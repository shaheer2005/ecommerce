from django.contrib import admin
from .models import Cart, CartItem, Wishlist, WishlistItem


class CartItemInline(admin.TabularInline):
    model = CartItem
    fields = ['product', 'quantity', 'size', 'color', 'added_at']
    readonly_fields = ['added_at']
    extra = 0


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['user', 'total_items', 'total_price', 'created_at']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [CartItemInline]
    fieldsets = (
        ('User', {'fields': ('user',)}),
        ('Metadata', {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ['product', 'cart', 'quantity', 'size', 'color']
    list_filter = ['cart__user', 'added_at']
    search_fields = ['product__name', 'cart__user__username']


class WishlistItemInline(admin.TabularInline):
    model = WishlistItem
    fields = ['product', 'added_at']
    readonly_fields = ['added_at']
    extra = 0


@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ['user', 'get_product_count', 'created_at']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [WishlistItemInline]
    fieldsets = (
        ('User', {'fields': ('user',)}),
        ('Metadata', {'fields': ('created_at', 'updated_at')}),
    )

    def get_product_count(self, obj):
        return obj.wishlistitem_set.count()
    get_product_count.short_description = 'Products'


@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    list_display = ['product', 'wishlist', 'added_at']
    list_filter = ['wishlist__user', 'added_at']
    search_fields = ['product__name', 'wishlist__user__username']
    readonly_fields = ['added_at']
