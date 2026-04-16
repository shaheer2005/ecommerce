from django.contrib import admin
from .models import Category, Product, ProductImage


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    fields = ['image', 'alt_text', 'is_primary', 'order']
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """Enhanced product admin with inventory alerts (Phase 8)"""
    list_display = [
        'name',
        'category',
        'price_display',
        'stock_status',
        'rating_display',
        'in_wishlist_count',
    ]
    list_filter = ['category', 'gender', ('stock', admin.EmptyFieldListFilter)]
    search_fields = ['name', 'description', 'category__name']
    inlines = [ProductImageInline]
    readonly_fields = ['rating', 'in_wishlist_count']
    
    fieldsets = (
        ('Basic Info', {'fields': ('name', 'description', 'category')}),
        ('Pricing & Stock', {'fields': ('price', 'stock')}),
        ('Attributes', {'fields': ('gender', 'sizes', 'colors')}),
        ('Media', {'fields': ('image',)}),
        ('Rating & Wishlist', {'fields': ('rating', 'in_wishlist_count')}),
    )

    def price_display(self, obj):
        return f"${obj.price}"
    price_display.short_description = "Price"

    def stock_status(self, obj):
        """Display stock with warning if low"""
        if obj.stock == 0:
            return '<span style="color: red; font-weight: bold;">❌ OUT OF STOCK</span>'
        elif obj.stock <= 10:
            return f'<span style="color: orange;">⚠️ {obj.stock}</span>'
        else:
            return f'<span style="color: green;">✓ {obj.stock}</span>'
    stock_status.short_description = "Stock Status"
    stock_status.allow_tags = True

    def rating_display(self, obj):
        stars = '★' * int(obj.rating) + '☆' * (5 - int(obj.rating))
        return f"{stars} ({obj.rating}/5)"
    rating_display.short_description = "Rating"

    def in_wishlist_count(self, obj):
        return obj.wishlistitems.count()
    in_wishlist_count.short_description = "In Wishlists"


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ['product', 'is_primary', 'order', 'uploaded_at']
    list_filter = ['is_primary', 'uploaded_at']
    readonly_fields = ['uploaded_at']
    fieldsets = (
        ('Image Info', {'fields': ('product', 'image', 'alt_text')}),
        ('Display', {'fields': ('is_primary', 'order')}),
        ('Metadata', {'fields': ('uploaded_at',)}),
    )
