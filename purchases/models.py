from django.db import models
from django.contrib.auth.models import User
from catalog.models import Product
from datetime import timedelta
from django.utils import timezone


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('pending_payment', 'Pending Payment'),
        ('payment_submitted', 'Payment Submitted'),
        ('paid', 'Paid'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    stripe_session_id = models.CharField(max_length=255, blank=True, null=True)
    stripe_payment_intent = models.CharField(max_length=255, blank=True, null=True)
    easypaisa_transaction_id = models.CharField(max_length=255, blank=True, null=True)
    payment_proof = models.ImageField(upload_to='payment_proofs/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Shipping info
    shipping_name = models.CharField(max_length=255)
    shipping_email = models.EmailField()
    shipping_address = models.TextField()
    shipping_city = models.CharField(max_length=100)
    shipping_state = models.CharField(max_length=100)
    shipping_zip = models.CharField(max_length=20)
    shipping_country = models.CharField(max_length=100)
    
    # Tracking info (Phase 7)
    tracking_number = models.CharField(max_length=100, blank=True, null=True)
    shipping_carrier = models.CharField(
        max_length=50,
        choices=[
            ('fedex', 'FedEx'),
            ('ups', 'UPS'),
            ('usps', 'USPS'),
            ('dhl', 'DHL'),
            ('other', 'Other')
        ],
        blank=True,
        null=True
    )
    shipped_at = models.DateTimeField(blank=True, null=True)
    estimated_delivery_at = models.DateTimeField(blank=True, null=True)
    delivered_at = models.DateTimeField(blank=True, null=True)
    
    # Pricing
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Cancellation & Refund (Phase 7)
    cancellation_reason = models.TextField(blank=True, null=True)
    cancelled_at = models.DateTimeField(blank=True, null=True)
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    refunded_at = models.DateTimeField(blank=True, null=True)
    stripe_refund_id = models.CharField(max_length=255, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    paid_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order #{self.id} - {self.user.username}"
    
    def can_be_cancelled(self):
        """Check if order is eligible for cancellation"""
        return self.status in ['pending', 'pending_payment', 'payment_submitted', 'paid', 'processing']

    def can_be_refunded(self):
        """Check if order is eligible for refund"""
        return self.status == 'paid' and not self.refunded_at and bool(self.stripe_payment_intent)

    def set_shipped(self, tracking_number, carrier):
        """Mark order as shipped with tracking info"""
        self.status = 'shipped'
        self.tracking_number = tracking_number
        self.shipping_carrier = carrier
        self.shipped_at = timezone.now()
        self.estimated_delivery_at = timezone.now() + timedelta(days=5)
        self.save()
        
        # Create timeline entry
        OrderTimeline.objects.create(
            order=self,
            status='shipped',
            message=f'Order shipped via {carrier.upper()} - Tracking: {tracking_number}'
        )
    
    def set_delivered(self):
        """Mark order as delivered"""
        self.status = 'delivered'
        self.delivered_at = timezone.now()
        self.save()
        
        OrderTimeline.objects.create(
            order=self,
            status='delivered',
            message='Order delivered successfully'
        )


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Price at time of order
    size = models.CharField(max_length=50, blank=True)
    color = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"

    @property
    def total_price(self):
        return self.price * self.quantity

class OrderTimeline(models.Model):
    """Track status changes and updates for orders (Phase 7)"""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='timeline')
    status = models.CharField(max_length=20)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.order.id} - {self.status} at {self.created_at}"