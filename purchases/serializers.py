from rest_framework import serializers
from .models import Order, OrderItem, OrderTimeline
from catalog.serializers import ProductSerializer
from users.serializers import UserDetailSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'quantity', 'price', 'size', 'color', 'total_price']


class OrderTimelineSerializer(serializers.ModelSerializer):
    """Serialize order status timeline (Phase 7)"""
    class Meta:
        model = OrderTimeline
        fields = ['id', 'status', 'message', 'created_at']
        read_only_fields = ['id', 'created_at']


class OrderSerializer(serializers.ModelSerializer):
    user = UserDetailSerializer(read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    timeline = OrderTimelineSerializer(many=True, read_only=True)
    can_be_cancelled = serializers.SerializerMethodField()
    can_be_refunded = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'user', 'status', 'items', 'timeline', 'subtotal', 'shipping_cost', 'tax', 'total',
            'shipping_name', 'shipping_email', 'shipping_address', 'shipping_city',
            'shipping_state', 'shipping_zip', 'shipping_country', 'payment_proof',
            'tracking_number', 'shipping_carrier', 'shipped_at', 'estimated_delivery_at', 'delivered_at',
            'cancellation_reason', 'cancelled_at', 'refund_amount', 'refunded_at',
            'can_be_cancelled', 'can_be_refunded', 'created_at', 'updated_at', 'paid_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'paid_at', 'timeline']

    def get_can_be_cancelled(self, obj):
        return obj.can_be_cancelled()
    
    def get_can_be_refunded(self, obj):
        return obj.can_be_refunded()


class OrderUpdateSerializer(serializers.Serializer):
    """Serialize order status updates (Phase 7)"""
    tracking_number = serializers.CharField(max_length=100, required=False)
    shipping_carrier = serializers.ChoiceField(
        choices=['fedex', 'ups', 'usps', 'dhl', 'other'],
        required=False
    )
    cancellation_reason = serializers.CharField(required=False)

class CheckoutSerializer(serializers.Serializer):
    """Serialize checkout request data"""
    payment_method = serializers.ChoiceField(choices=['stripe', 'easypaisa', 'bank_transfer'], default='stripe')
    shipping_name = serializers.CharField(max_length=255)
    shipping_email = serializers.EmailField()
    shipping_address = serializers.CharField()
    shipping_city = serializers.CharField(max_length=100)
    shipping_state = serializers.CharField(max_length=100)
    shipping_zip = serializers.CharField(max_length=20)
    shipping_country = serializers.CharField(max_length=100)
    shipping_phone = serializers.CharField(max_length=30, required=False)
