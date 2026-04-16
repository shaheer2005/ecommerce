from rest_framework import serializers
from django.contrib.auth.models import User
from purchases.models import Order
from catalog.models import Product


class DashboardStatsSerializer(serializers.Serializer):
    """Overall dashboard statistics (Phase 8)"""
    total_orders = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_customers = serializers.IntegerField()
    total_products = serializers.IntegerField()
    average_order_value = serializers.DecimalField(max_digits=10, decimal_places=2)
    pending_orders = serializers.IntegerField()
    shipped_orders = serializers.IntegerField()


class TopProductSerializer(serializers.Serializer):
    """Top selling products (Phase 8)"""
    product_id = serializers.IntegerField()
    product_name = serializers.CharField()
    units_sold = serializers.IntegerField()
    revenue = serializers.DecimalField(max_digits=10, decimal_places=2)
    average_rating = serializers.DecimalField(max_digits=3, decimal_places=1)


class OrderStatusBreakdownSerializer(serializers.Serializer):
    """Order status distribution (Phase 8)"""
    status = serializers.CharField()
    count = serializers.IntegerField()
    percentage = serializers.DecimalField(max_digits=5, decimal_places=2)


class DailySalesSerializer(serializers.Serializer):
    """Daily sales data for charts (Phase 8)"""
    date = serializers.DateField()
    orders_count = serializers.IntegerField()
    revenue = serializers.DecimalField(max_digits=10, decimal_places=2)


class LowStockProductSerializer(serializers.Serializer):
    """Products with low stock levels (Phase 8)"""
    product_id = serializers.IntegerField()
    product_name = serializers.CharField()
    current_stock = serializers.IntegerField()
    warning_threshold = serializers.IntegerField()


class CustomerAnalyticsSerializer(serializers.Serializer):
    """Customer purchase analysis (Phase 8)"""
    total_customers = serializers.IntegerField()
    new_customers_this_month = serializers.IntegerField()
    returning_customers = serializers.IntegerField()
    repeat_purchase_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    avg_customer_lifetime_value = serializers.DecimalField(max_digits=10, decimal_places=2)
