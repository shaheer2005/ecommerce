from rest_framework import serializers
from .models import Product, Category, ProductImage, ProductReview


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image']


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_primary', 'order']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    sizes_list = serializers.SerializerMethodField()
    colors_list = serializers.SerializerMethodField()
    images = ProductImageSerializer(many=True, read_only=True)
    review_count = serializers.IntegerField(source='reviews.count', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'category', 'category_name',
            'gender', 'price', 'stock', 'image', 'images', 'sizes', 'colors',
            'sizes_list', 'colors_list', 'rating', 'review_count', 'created_at'
        ]

    def get_sizes_list(self, obj):
        return [s.strip() for s in obj.sizes.split(',')] if obj.sizes else []

    def get_colors_list(self, obj):
        return [c.strip() for c in obj.colors.split(',')] if obj.colors else []


class ProductImageUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_primary', 'order']


class ProductReviewSerializer(serializers.ModelSerializer):
    user = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = ProductReview
        fields = ['id', 'user', 'rating', 'title', 'comment', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']
