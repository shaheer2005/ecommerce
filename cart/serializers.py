from rest_framework import serializers
from .models import Cart, CartItem, Wishlist, WishlistItem
from catalog.serializers import ProductSerializer


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_id', 'quantity', 'size', 'color', 'total_price', 'added_at']

    def get_total_price(self, obj):
        return float(obj.get_total_price())


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_price = serializers.SerializerMethodField()
    total_items = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_price', 'total_items', 'created_at', 'updated_at']

    def get_total_price(self, obj):
        return float(obj.total_price)

    def get_total_items(self, obj):
        return obj.total_items


class WishlistItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = WishlistItem
        fields = ['id', 'product', 'product_id', 'added_at']


class WishlistSerializer(serializers.ModelSerializer):
    products = serializers.SerializerMethodField()

    class Meta:
        model = Wishlist
        fields = ['id', 'products', 'created_at', 'updated_at']

    def get_products(self, obj):
        wishlisted = obj.wishlistitem_set.all()
        return WishlistItemSerializer(wishlisted, many=True).data
