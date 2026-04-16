import os
import stripe
import json
from django.conf import settings
from django.core.mail import send_mail
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.utils import timezone
from rest_framework import viewsets, views, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from decimal import Decimal
from datetime import datetime

from .models import Order, OrderItem, OrderTimeline
from .serializers import OrderSerializer, CheckoutSerializer, OrderUpdateSerializer
from cart.models import Cart, CartItem
from catalog.models import Product


def send_order_email(subject, message, recipient_list):
    if not recipient_list:
        return
    try:
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, recipient_list, fail_silently=True)
    except Exception:
        # Fail silently in development if email backend is not configured
        pass

# Set Stripe API key
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY', settings.STRIPE_SECRET_KEY if hasattr(settings, 'STRIPE_SECRET_KEY') else None)


class CheckoutView(views.APIView):
    """Create checkout session for selected payment method"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        payment_method = serializer.validated_data.get('payment_method', 'stripe')
        
        if payment_method == 'stripe':
            return self._handle_stripe_checkout(request, serializer)
        elif payment_method == 'easypaisa':
            return self._handle_easypaisa_checkout(request, serializer)
        elif payment_method == 'bank_transfer':
            return self._handle_bank_transfer_checkout(request, serializer)
        else:
            return Response(
                {"error": "Unsupported payment method."},
                status=status.HTTP_400_BAD_REQUEST
            )

    def _handle_stripe_checkout(self, request, serializer):
        if not stripe.api_key or str(stripe.api_key).startswith('sk_test_replaceme'):
            return Response(
                {"error": "Stripe API key is not configured. Please set STRIPE_SECRET_KEY."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        user = request.user
        cart, _ = Cart.objects.get_or_create(user=user)
        
        if not cart.items.exists():
            return Response(
                {"error": "Cart is empty."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Calculate order totals
        subtotal = Decimal(str(cart.total_price))
        shipping_cost = Decimal('10.00')  # Fixed shipping for demo
        tax = subtotal * Decimal('0.08')  # 8% tax
        total = subtotal + shipping_cost + tax

        try:
            # Create order
            order_data = {k: v for k, v in serializer.validated_data.items() if k not in ['payment_method', 'shipping_phone']}
            order = Order.objects.create(
                user=user,
                status='pending',
                subtotal=subtotal,
                shipping_cost=shipping_cost,
                tax=tax,
                total=total,
                **order_data
            )

            # Create order items from cart
            line_items = []
            for cart_item in cart.items.all():
                OrderItem.objects.create(
                    order=order,
                    product=cart_item.product,
                    quantity=cart_item.quantity,
                    price=cart_item.product.price,
                    size=cart_item.size,
                    color=cart_item.color
                )
                
                # Add to Stripe line items
                line_items.append({
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': cart_item.product.name,
                            'description': f"Size: {cart_item.size}, Color: {cart_item.color}",
                            'images': [request.build_absolute_uri(cart_item.product.image.url)] if cart_item.product.image else [],
                        },
                        'unit_amount': int(float(cart_item.product.price) * 100),
                    },
                    'quantity': cart_item.quantity,
                })

            # Add shipping and tax to line items
            line_items.append({
                'price_data': {
                    'currency': 'usd',
                    'product_data': {'name': 'Shipping'},
                    'unit_amount': int(float(shipping_cost) * 100),
                },
                'quantity': 1,
            })

            line_items.append({
                'price_data': {
                    'currency': 'usd',
                    'product_data': {'name': 'Tax'},
                    'unit_amount': int(float(tax) * 100),
                },
                'quantity': 1,
            })

            # Create Stripe checkout session
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=line_items,
                mode='payment',
                success_url=request.build_absolute_uri('/checkout/success/'),
                cancel_url=request.build_absolute_uri('/checkout/cancel/'),
                customer_email=user.email,
                metadata={
                    'order_id': order.id,
                    'user_id': user.id,
                },
            )

            # Link order to Stripe session and payment intent
            order.stripe_session_id = session.id
            order.stripe_payment_intent = getattr(session, 'payment_intent', None)
            order.save()

            # Send order confirmation email
            send_order_email(
                subject=f'E-Shop Deluxe Order Confirmation #{order.id}',
                message=(
                    f'Thank you for your order #{order.id}!\n\n'
                    f'Order total: ${order.total}\n'
                    f'Shipping to: {order.shipping_address}, {order.shipping_city}, {order.shipping_state} {order.shipping_zip}\n\n'
                    'We will notify you when your order ships.'
                ),
                recipient_list=[order.shipping_email]
            )

            return Response(
                {
                    'checkout_url': session.url,
                    'session_id': session.id,
                    'order_id': order.id,
                },
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def _handle_easypaisa_checkout(self, request, serializer):
        # EasyPaisa integration
        # Note: This is a mock implementation. Real integration requires:
        # 1. Register as EasyPaisa merchant
        # 2. Get API credentials (store_id, username, password)
        # 3. Use their API to initiate payment
        
        easypaisa_store_id = os.environ.get('EASYPAISA_STORE_ID')
        easypaisa_username = os.environ.get('EASYPAISA_USERNAME')
        easypaisa_password = os.environ.get('EASYPAISA_PASSWORD')
        
        if not all([easypaisa_store_id, easypaisa_username, easypaisa_password]):
            return Response(
                {"error": "EasyPaisa credentials not configured. Please set EASYPAISA_STORE_ID, EASYPAISA_USERNAME, EASYPAISA_PASSWORD."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        user = request.user
        cart, _ = Cart.objects.get_or_create(user=user)
        
        if not cart.items.exists():
            return Response(
                {"error": "Cart is empty."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Calculate order totals
        subtotal = Decimal(str(cart.total_price))
        shipping_cost = Decimal('10.00')
        tax = subtotal * Decimal('0.08')
        total = subtotal + shipping_cost + tax

        try:
            # Create order
            order_data = {k: v for k, v in serializer.validated_data.items() if k not in ['payment_method', 'shipping_phone']}
            order = Order.objects.create(
                user=user,
                status='pending',
                subtotal=subtotal,
                shipping_cost=shipping_cost,
                tax=tax,
                total=total,
                **order_data
            )

            # Create order items from cart
            for cart_item in cart.items.all():
                OrderItem.objects.create(
                    order=order,
                    product=cart_item.product,
                    quantity=cart_item.quantity,
                    price=cart_item.product.price,
                    size=cart_item.size,
                    color=cart_item.color
                )

            # Mock EasyPaisa API call
            # In real implementation, make API call to EasyPaisa
            import requests
            
            easypaisa_api_url = "https://api.easypaisa.com.pk/payment/initiate"  # Mock URL
            
            payload = {
                "store_id": easypaisa_store_id,
                "username": easypaisa_username,
                "password": easypaisa_password,
                "amount": str(total),
                "order_id": str(order.id),
                "customer_email": user.email,
                "customer_mobile": serializer.validated_data.get('shipping_phone', ''),  # Assuming we add phone field
                "callback_url": request.build_absolute_uri('/api/purchases/easypaisa/callback/'),
                "success_url": request.build_absolute_uri('/checkout/success/'),
                "cancel_url": request.build_absolute_uri('/checkout/cancel/'),
            }
            
            # Mock response - in real implementation, this would be the API response
            mock_response = {
                "transaction_id": f"EP_{order.id}_{timezone.now().timestamp()}",
                "payment_url": f"https://easypaisa.com.pk/pay?transaction={order.id}",  # Mock payment URL
                "status": "pending"
            }
            
            # In real implementation:
            # response = requests.post(easypaisa_api_url, json=payload)
            # if response.status_code == 200:
            #     data = response.json()
            # else:
            #     raise Exception("EasyPaisa API error")
            
            # Link order to EasyPaisa transaction
            order.easypaisa_transaction_id = mock_response['transaction_id']
            order.save()

            return Response(
                {
                    'checkout_url': mock_response['payment_url'],
                    'transaction_id': mock_response['transaction_id'],
                    'order_id': order.id,
                },
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def _handle_bank_transfer_checkout(self, request, serializer):
        user = request.user
        cart, _ = Cart.objects.get_or_create(user=user)
        
        if not cart.items.exists():
            return Response(
                {"error": "Cart is empty."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Calculate order totals
        subtotal = Decimal(str(cart.total_price))
        shipping_cost = Decimal('10.00')
        tax = subtotal * Decimal('0.08')
        total = subtotal + shipping_cost + tax

        try:
            # Create order
            order_data = {k: v for k, v in serializer.validated_data.items() if k not in ['payment_method', 'shipping_phone']}
            order = Order.objects.create(
                user=user,
                status='pending_payment',
                subtotal=subtotal,
                shipping_cost=shipping_cost,
                tax=tax,
                total=total,
                **order_data
            )

            # Create order items from cart
            for cart_item in cart.items.all():
                OrderItem.objects.create(
                    order=order,
                    product=cart_item.product,
                    quantity=cart_item.quantity,
                    price=cart_item.product.price,
                    size=cart_item.size,
                    color=cart_item.color
                )

            # Bank account details (configure these in settings)
            bank_details = {
                "bank_name": getattr(settings, 'BANK_NAME', 'Your Bank Name'),
                "account_holder": getattr(settings, 'ACCOUNT_HOLDER', 'Your Business Name'),
                "account_number": getattr(settings, 'ACCOUNT_NUMBER', '1234567890'),
                "iban": getattr(settings, 'IBAN', 'PK12345678901234567890'),
                "swift_code": getattr(settings, 'SWIFT_CODE', 'BANKPKKA'),
                "instructions": "Please transfer the exact amount and include your order ID in the payment reference."
            }

            # Send bank transfer order confirmation email
            send_order_email(
                subject=f'E-Shop Deluxe Order Confirmation #{order.id}',
                message=(
                    f'Thank you for your order #{order.id}!\n\n'
                    f'Order total: ${total}\n'
                    f'Shipping to: {order.shipping_address}, {order.shipping_city}, {order.shipping_state} {order.shipping_zip}\n\n'
                    'Please complete your bank transfer using the details below:\n'
                    f'Bank: {bank_details["bank_name"]}\n'
                    f'Account: {bank_details["account_number"]}\n'
                    f'IBAN: {bank_details["iban"]}\n'
                    f'SWIFT: {bank_details["swift_code"]}\n\n'
                    'Then upload your payment proof in your orders page.'
                ),
                recipient_list=[order.shipping_email]
            )

            return Response(
                {
                    'order_id': order.id,
                    'total_amount': str(total),
                    'bank_details': bank_details,
                    'message': 'Order created successfully. Please complete the bank transfer using the details below.',
                    'next_step': 'Upload payment proof after transfer'
                },
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


@csrf_exempt
def stripe_webhook(request):
    """Handle Stripe webhook for payment confirmation"""
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)

    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET', '')

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except ValueError:
        return JsonResponse({"error": "Invalid payload"}, status=400)
    except stripe.error.SignatureVerificationError:
        return JsonResponse({"error": "Invalid signature"}, status=400)

    # Handle checkout.session.completed
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        order_id = session['metadata']['order_id']
        
        try:
            order = Order.objects.get(id=order_id)
            order.status = 'paid'
            order.paid_at = datetime.now()
            if not order.stripe_payment_intent and session.get('payment_intent'):
                order.stripe_payment_intent = session.get('payment_intent')
            order.save()
            
            # Clear user's cart
            cart = Cart.objects.get(user=order.user)
            cart.items.all().delete()

            send_order_email(
                subject=f'E-Shop Deluxe Order #{order.id} Paid Successfully',
                message=(
                    f'Your payment for order #{order.id} has been confirmed.\n\n'
                    'Your order is now being processed and will be shipped shortly.'
                ),
                recipient_list=[order.shipping_email]
            )
            
        except Order.DoesNotExist:
            pass

    # Handle charge.refunded
    elif event['type'] == 'charge.refunded':
        charge = event['data']['object']
        payment_intent = charge.get('payment_intent')
        refund_id = None
        refunds_data = charge.get('refunds', {}).get('data', []) if isinstance(charge.get('refunds'), dict) else []
        if refunds_data:
            refund_id = refunds_data[0].get('id')

        try:
            order = Order.objects.get(stripe_payment_intent=payment_intent)
            if order.status != 'refunded':
                order.status = 'refunded'
                order.refund_amount = Decimal(str(charge.get('amount_refunded', 0) / 100))
                order.refunded_at = timezone.now()
                if refund_id:
                    order.stripe_refund_id = refund_id
                order.save()

                OrderTimeline.objects.create(
                    order=order,
                    status='refunded',
                    message=f'Order refunded via Stripe. Refund ID: {refund_id or "N/A"}'
                )

                send_order_email(
                    subject=f'E-Shop Deluxe Order #{order.id} Refunded',
                    message=(
                        f'Your order #{order.id} has been refunded for ${order.refund_amount}. '
                        'The refund should appear on your statement within a few business days.'
                    ),
                    recipient_list=[order.shipping_email]
                )
        except Order.DoesNotExist:
            pass

    return JsonResponse({"status": "success"})


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    """Retrieve user's orders with Phase 7 management features"""
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Order.objects.all()
        return Order.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def mark_shipped(self, request, pk=None):
        """Mark order as shipped with tracking info (Phase 7)"""
        order = self.get_object()
        serializer = OrderUpdateSerializer(data=request.data)
        
        if serializer.is_valid():
            tracking_number = serializer.validated_data.get('tracking_number')
            shipping_carrier = serializer.validated_data.get('shipping_carrier')
            
            if not tracking_number or not shipping_carrier:
                return Response(
                    {"error": "tracking_number and shipping_carrier are required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            order.set_shipped(tracking_number, shipping_carrier)

            send_order_email(
                subject=f'E-Shop Deluxe Order #{order.id} Shipped',
                message=(
                    f'Your order #{order.id} has shipped via {shipping_carrier.upper()}.\n\n'
                    f'Tracking number: {tracking_number}\n'
                    f'Expected delivery: {order.estimated_delivery_at.date() if order.estimated_delivery_at else "soon"}\n\n'
                    'Thank you for shopping with us!'
                ),
                recipient_list=[order.shipping_email]
            )

            return Response(OrderSerializer(order).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def mark_delivered(self, request, pk=None):
        """Mark order as delivered (Phase 7)"""
        order = self.get_object()
        
        if order.status != 'shipped':
            return Response(
                {"error": "Only shipped orders can be marked as delivered"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.set_delivered()

        send_order_email(
            subject=f'E-Shop Deluxe Order #{order.id} Delivered',
            message=(
                f'Your order #{order.id} has been delivered successfully.\n\n'
                'We hope you enjoy your purchase! If you have any questions, reply to this email.'
            ),
            recipient_list=[order.shipping_email]
        )

        return Response(OrderSerializer(order).data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel order if eligible (Phase 7)"""
        order = self.get_object()
        
        if not order.can_be_cancelled():
            return Response(
                {"error": f"Order with status '{order.status}' cannot be cancelled"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = OrderUpdateSerializer(data=request.data)
        if serializer.is_valid():
            cancellation_reason = serializer.validated_data.get('cancellation_reason', 'No reason provided')
            
            order.status = 'cancelled'
            order.cancellation_reason = cancellation_reason
            order.cancelled_at = timezone.now()
            order.save()
            
            # Create timeline entry
            OrderTimeline.objects.create(
                order=order,
                status='cancelled',
                message=f'Order cancelled: {cancellation_reason}'
            )
            
            # Restore inventory
            for item in order.items.all():
                if item.product:
                    item.product.stock += item.quantity
                    item.product.save()

            send_order_email(
                subject=f'E-Shop Deluxe Order #{order.id} Cancelled',
                message=(
                    f'Your order #{order.id} has been cancelled.\n\n'
                    f'Reason: {cancellation_reason}\n\n'
                    'If you need assistance, please contact support.'
                ),
                recipient_list=[order.shipping_email]
            )
            
            return Response(OrderSerializer(order).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def upload_payment_proof(self, request, pk=None):
        """Upload payment proof for bank transfer orders"""
        order = self.get_object()
        
        if order.status != 'pending_payment':
            return Response(
                {"error": "Payment proof can only be uploaded for orders pending payment"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if 'payment_proof' not in request.FILES:
            return Response(
                {"error": "No payment proof file provided"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.payment_proof = request.FILES['payment_proof']
        order.status = 'payment_submitted'
        order.save()
        
        # Create timeline entry
        OrderTimeline.objects.create(
            order=order,
            status='payment_submitted',
            message='Payment proof uploaded. Awaiting verification.'
        )
        
        return Response(OrderSerializer(order).data)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def verify_payment(self, request, pk=None):
        """Admin action to verify bank transfer payment"""
        order = self.get_object()
        
        if order.status not in ['pending_payment', 'payment_submitted']:
            return Response(
                {"error": "Order is not in a verifiable payment state"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mark as paid
        order.status = 'paid'
        order.paid_at = timezone.now()
        order.save()
        
        # Clear user's cart
        cart = Cart.objects.get(user=order.user)
        cart.items.all().delete()
        
        # Create timeline entry
        OrderTimeline.objects.create(
            order=order,
            status='paid',
            message='Payment verified by admin. Order processing started.'
        )

        send_order_email(
            subject=f'E-Shop Deluxe Payment Verified for Order #{order.id}',
            message=(
                f'Your payment for order #{order.id} has been verified.\n\n'
                'Your order is now being processed and will ship soon.'
            ),
            recipient_list=[order.shipping_email]
        )
        
        return Response(OrderSerializer(order).data)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def reject_payment(self, request, pk=None):
        """Admin action to reject bank transfer payment"""
        order = self.get_object()
        
        if order.status not in ['pending_payment', 'payment_submitted']:
            return Response(
                {"error": "Order is not in a rejectable payment state"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'cancelled'
        order.cancellation_reason = request.data.get('reason', 'Payment verification failed')
        order.cancelled_at = timezone.now()
        order.save()
        
        # Create timeline entry
        OrderTimeline.objects.create(
            order=order,
            status='cancelled',
            message=f'Payment rejected: {order.cancellation_reason}'
        )
        
        # Restore inventory
        for item in order.items.all():
            if item.product:
                item.product.stock += item.quantity
                item.product.save()

        send_order_email(
            subject=f'E-Shop Deluxe Payment Rejected for Order #{order.id}',
            message=(
                f'Your order #{order.id} has been cancelled because the payment could not be verified.\n\n'
                f'Reason: {order.cancellation_reason}\n\n'
                'If you would like assistance, please contact support.'
            ),
            recipient_list=[order.shipping_email]
        )
        
        return Response(OrderSerializer(order).data)
    
    @action(detail=True, methods=['post'])
    def refund(self, request, pk=None):
        """Refund order payment via Stripe (Phase 7)"""
        order = self.get_object()
        
        if not order.can_be_refunded():
            return Response(
                {"error": "Order is not eligible for refund"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not order.stripe_payment_intent:
            return Response(
                {"error": "Refunds are only supported for Stripe-paid orders."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Refund via Stripe
            refund = stripe.Refund.create(
                payment_intent=order.stripe_payment_intent,
                amount=int(order.total * 100)  # Convert to cents
            )
            
            order.status = 'refunded'
            order.refund_amount = Decimal(str(refund.amount / 100))
            order.refunded_at = timezone.now()
            order.stripe_refund_id = refund.id
            order.save()
            
            # Create timeline entry
            OrderTimeline.objects.create(
                order=order,
                status='refunded',
                message=f'Order refunded: ${order.refund_amount}'
            )

            send_order_email(
                subject=f'E-Shop Deluxe Order #{order.id} Refunded',
                message=(
                    f'Your order #{order.id} has been refunded for ${order.refund_amount}.\n\n'
                    'The refund should appear on your card statement within a few business days.'
                ),
                recipient_list=[order.shipping_email]
            )
            
            return Response(OrderSerializer(order).data)
        
        except stripe.error.StripeError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def latest(self, request):
        """Return the latest order for the current user"""
        queryset = self.filter_queryset(self.get_queryset())
        order = queryset.order_by('-created_at').first()
        if not order:
            return Response({'detail': 'No orders found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(OrderSerializer(order).data)


@csrf_exempt
def easypaisa_callback(request):
    """Handle EasyPaisa payment callback"""
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)

    # In real implementation, verify the callback authenticity
    # EasyPaisa typically sends transaction_id, status, amount, etc.
    
    transaction_id = request.POST.get('transaction_id')
    status_code = request.POST.get('status')  # 'success', 'failed', etc.
    amount = request.POST.get('amount')
    
    if not transaction_id:
        return JsonResponse({"error": "Missing transaction_id"}, status=400)
    
    try:
        order = Order.objects.get(easypaisa_transaction_id=transaction_id)
        
        if status_code == 'success':
            order.status = 'paid'
            order.paid_at = timezone.now()
            order.save()
            
            # Clear user's cart
            cart = Cart.objects.get(user=order.user)
            cart.items.all().delete()
            
            # Create timeline entry
            OrderTimeline.objects.create(
                order=order,
                status='paid',
                message='Payment completed via EasyPaisa'
            )

            send_order_email(
                subject=f'E-Shop Deluxe Order #{order.id} Paid Successfully',
                message=(
                    f'Your payment for order #{order.id} has been confirmed via EasyPaisa.\n\n'
                    'Your order is now being processed and will ship soon.'
                ),
                recipient_list=[order.shipping_email]
            )
            
        elif status_code == 'failed':
            order.status = 'cancelled'
            order.cancellation_reason = 'Payment failed via EasyPaisa'
            order.cancelled_at = timezone.now()
            order.save()
            
            OrderTimeline.objects.create(
                order=order,
                status='cancelled',
                message='Payment failed via EasyPaisa'
            )
        
        return JsonResponse({"status": "processed"})
        
    except Order.DoesNotExist:
        return JsonResponse({"error": "Order not found"}, status=404)
