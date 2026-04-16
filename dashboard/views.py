from rest_framework import views, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth.models import User
from django.db.models import Sum, Count, Avg, Q
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from purchases.models import Order, OrderItem
from catalog.models import Product
from .serializers import (
    DashboardStatsSerializer,
    TopProductSerializer,
    OrderStatusBreakdownSerializer,
    DailySalesSerializer,
    LowStockProductSerializer,
    CustomerAnalyticsSerializer,
)


class DashboardStatsView(views.APIView):
    """Get overall dashboard statistics (Phase 8)"""
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        """Aggregate key metrics"""
        # Total metrics
        total_orders = Order.objects.count()
        total_revenue = Order.objects.filter(status='paid').aggregate(
            total=Sum('total')
        )['total'] or Decimal('0')
        
        total_customers = User.objects.filter(orders__isnull=False).distinct().count()
        total_products = Product.objects.count()
        
        # Calculate average order value
        avg_order_value = (
            total_revenue / total_orders if total_orders > 0 else Decimal('0')
        )
        
        # Order status breakdown
        pending_orders = Order.objects.filter(
            status__in=['pending', 'processing']
        ).count()
        shipped_orders = Order.objects.filter(
            status='shipped'
        ).count()

        data = {
            'total_orders': total_orders,
            'total_revenue': total_revenue,
            'total_customers': total_customers,
            'total_products': total_products,
            'average_order_value': avg_order_value,
            'pending_orders': pending_orders,
            'shipped_orders': shipped_orders,
        }

        serializer = DashboardStatsSerializer(data)
        return Response(serializer.data)


class TopProductsView(views.APIView):
    """Get top-selling products by revenue (Phase 8)"""
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        """Return top 10 products by units sold"""
        limit = int(request.query_params.get('limit', 10))

        top_products = (
            OrderItem.objects
            .values('product_id', 'product__name', 'product__rating')
            .annotate(
                units_sold=Count('id'),
                revenue=Sum('price')
            )
            .order_by('-revenue')[:limit]
        )

        result = [
            {
                'product_id': item['product_id'],
                'product_name': item['product__name'],
                'units_sold': item['units_sold'],
                'revenue': Decimal(str(item['revenue'] or 0)),
                'average_rating': Decimal(str(item['product__rating'] or 0)),
            }
            for item in top_products
        ]

        serializer = TopProductSerializer(result, many=True)
        return Response(serializer.data)


class OrderStatusBreakdownView(views.APIView):
    """Get order status distribution (Phase 8)"""
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        """Return order count by status"""
        total_orders = Order.objects.count()
        
        status_breakdown = (
            Order.objects
            .values('status')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        result = [
            {
                'status': item['status'],
                'count': item['count'],
                'percentage': Decimal(
                    str((item['count'] / total_orders * 100) if total_orders > 0 else 0)
                ),
            }
            for item in status_breakdown
        ]

        serializer = OrderStatusBreakdownSerializer(result, many=True)
        return Response(serializer.data)


class DailySalesView(views.APIView):
    """Get sales data for the last N days (Phase 8)"""
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        """Return daily sales for chart"""
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now().date() - timedelta(days=days)

        daily_sales = (
            Order.objects
            .filter(status='paid', created_at__date__gte=start_date)
            .extra(select={'date': 'DATE(created_at)'})
            .values('date')
            .annotate(
                orders_count=Count('id'),
                revenue=Sum('total')
            )
            .order_by('date')
        )

        result = [
            {
                'date': item['date'],
                'orders_count': item['orders_count'],
                'revenue': Decimal(str(item['revenue'] or 0)),
            }
            for item in daily_sales
        ]

        serializer = DailySalesSerializer(result, many=True)
        return Response(serializer.data)


class LowStockProductsView(views.APIView):
    """Get products with low stock levels (Phase 8)"""
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        """Return products below warning threshold"""
        warning_threshold = int(request.query_params.get('threshold', 10))

        low_stock = Product.objects.filter(
            stock__lte=warning_threshold
        ).order_by('stock')

        result = [
            {
                'product_id': product.id,
                'product_name': product.name,
                'current_stock': product.stock,
                'warning_threshold': warning_threshold,
            }
            for product in low_stock
        ]

        serializer = LowStockProductSerializer(result, many=True)
        return Response(serializer.data)


class CustomerAnalyticsView(views.APIView):
    """Get customer-related analytics (Phase 8)"""
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        """Return customer metrics"""
        # Total customers
        total_customers = User.objects.filter(orders__isnull=False).distinct().count()
        
        # New customers this month
        this_month = timezone.now().replace(day=1)
        new_customers_this_month = User.objects.filter(
            date_joined__gte=this_month,
            orders__isnull=False
        ).distinct().count()
        
        # Returning customers (2+ orders)
        returning_customers = (
            User.objects
            .annotate(order_count=Count('orders'))
            .filter(order_count__gte=2)
            .count()
        )
        
        # Repeat purchase rate
        repeat_purchase_rate = (
            (Decimal(str(returning_customers)) / Decimal(str(total_customers)) * 100)
            if total_customers > 0 else Decimal('0')
        )
        
        # Average customer lifetime value
        avg_customer_lifetime_value = (
            Order.objects
            .filter(status='paid')
            .values('user_id')
            .annotate(total_spent=Sum('total'))
            .aggregate(avg=Avg('total_spent'))['avg']
        ) or Decimal('0')

        data = {
            'total_customers': total_customers,
            'new_customers_this_month': new_customers_this_month,
            'returning_customers': returning_customers,
            'repeat_purchase_rate': repeat_purchase_rate,
            'avg_customer_lifetime_value': Decimal(str(avg_customer_lifetime_value)),
        }

        serializer = CustomerAnalyticsSerializer(data)
        return Response(serializer.data)


class InventoryManagementView(views.APIView):
    """Get inventory overview and management options (Phase 8)"""
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        """Return inventory summary"""
        total_products = Product.objects.count()
        total_inventory_value = Product.objects.aggregate(
            value=Sum('stock')
        )['value'] or 0
        
        out_of_stock = Product.objects.filter(stock=0).count()
        low_stock = Product.objects.filter(stock__gt=0, stock__lte=10).count()

        return Response({
            'total_products': total_products,
            'total_items_in_stock': total_inventory_value,
            'out_of_stock_count': out_of_stock,
            'low_stock_count': low_stock,
            'inventory_health_score': (
                ((total_products - out_of_stock) / total_products * 100)
                if total_products > 0 else 0
            ),
        })


class BulkOrderActionsView(views.APIView):
    """Perform bulk operations on orders (Phase 8)"""
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        """Bulk update orders"""
        action = request.data.get('action')
        order_ids = request.data.get('order_ids', [])

        if not action or not order_ids:
            return Response(
                {'error': 'action and order_ids are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        orders = Order.objects.filter(id__in=order_ids)

        if action == 'mark_processing':
            updated = orders.filter(status='paid').update(status='processing')
            return Response({
                'success': True,
                'message': f'{updated} orders marked as processing'
            })

        elif action == 'bulk_export':
            data = []
            for order in orders:
                data.append({
                    'order_id': order.id,
                    'user': order.user.username,
                    'status': order.status,
                    'total': str(order.total),
                    'created_at': order.created_at.isoformat(),
                })
            return Response(data)

        else:
            return Response(
                {'error': f'Unknown action: {action}'},
                status=status.HTTP_400_BAD_REQUEST
            )
