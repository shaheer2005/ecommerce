from django.contrib import admin
from purchases.models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    """Inline order items display"""
    model = OrderItem
    fields = ['product', 'quantity', 'price', 'size', 'color']
    extra = 0
    readonly_fields = ['product', 'quantity', 'price']


@admin.register(Order)
class EnhancedOrderAdmin(admin.ModelAdmin):
    """Enhanced admin interface for orders (Phase 8)"""
    list_display = [
        'order_id_display',
        'user',
        'status_badge',
        'total',
        'tracking_number',
        'order_date',
        'payment_status',
    ]
    list_filter = [
        'status',
        'created_at',
        'shipped_at',
        'shipping_carrier',
        ('paid_at', admin.EmptyFieldListFilter),
    ]
    search_fields = [
        'id',
        'user__username',
        'user__email',
        'shipping_email',
        'tracking_number',
    ]
    readonly_fields = [
        'stripe_session_id',
        'stripe_payment_intent',
        'order_id_display',
        'revenue_display',
        'created_at',
        'updated_at',
    ]
    
    inlines = [OrderItemInline]

    fieldsets = (
        ('Order Info', {
            'fields': ('order_id_display', 'user', 'status', 'revenue_display')
        }),
        ('Payment', {
            'fields': ('paid_at', 'stripe_session_id', 'stripe_payment_intent'),
            'classes': ('collapse',)
        }),
        ('Shipping Address', {
            'fields': (
                'shipping_name',
                'shipping_email',
                'shipping_address',
                'shipping_city',
                'shipping_state',
                'shipping_zip',
                'shipping_country',
            )
        }),
        ('Tracking & Delivery', {
            'fields': (
                'tracking_number',
                'shipping_carrier',
                'shipped_at',
                'estimated_delivery_at',
                'delivered_at',
            ),
            'classes': ('collapse',)
        }),
        ('Cancellation & Refunds', {
            'fields': (
                'cancellation_reason',
                'cancelled_at',
                'refund_amount',
                'refunded_at',
                'stripe_refund_id',
            ),
            'classes': ('collapse',)
        }),
        ('Pricing Breakdown', {
            'fields': ('subtotal', 'shipping_cost', 'tax', 'total'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    actions = ['mark_processing', 'export_orders']

    def order_id_display(self, obj):
        """Display order ID with link"""
        return f"#{obj.id}"
    order_id_display.short_description = "Order"

    def revenue_display(self, obj):
        """Display final revenue"""
        return f"${obj.total}"
    revenue_display.short_description = "Total"

    def status_badge(self, obj):
        """Colored status display"""
        colors = {
            'pending': '#FFA500',      # Orange
            'paid': '#0066CC',         # Blue
            'processing': '#9966FF',   # Purple
            'shipped': '#00CC00',      # Green
            'delivered': '#00AA00',    # Dark Green
            'cancelled': '#999999',    # Gray
            'refunded': '#FF0000',     # Red
        }
        color = colors.get(obj.status, '#000000')
        return f'<span style="background-color: {color}; color: white; padding: 3px 8px; border-radius: 3px;">{obj.get_status_display()}</span>'
    status_badge.short_description = "Status"
    status_badge.allow_tags = True

    def order_date(self, obj):
        """Display creation date"""
        return obj.created_at.strftime('%Y-%m-%d')
    order_date.short_description = "Created"

    def payment_status(self, obj):
        """Check if paid"""
        return '✓ Paid' if obj.paid_at else '⏳ Pending'
    payment_status.short_description = "Payment"

    def mark_processing(self, request, queryset):
        """Bulk action: Mark orders as processing"""
        updated = queryset.filter(status='paid').update(status='processing')
        self.message_user(request, f'{updated} orders marked as processing.')
    mark_processing.short_description = "Mark selected orders as Processing"

    def export_orders(self, request, queryset):
        """Bulk action: Export to CSV"""
        import csv
        from django.http import HttpResponse

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="orders.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Order ID', 'User', 'Status', 'Total', 'Date', 'Tracking', 'Shipped'
        ])
        
        for order in queryset:
            writer.writerow([
                order.id,
                order.user.username,
                order.status,
                order.total,
                order.created_at.date(),
                order.tracking_number or '-',
                'Yes' if order.shipped_at else 'No',
            ])
        
        return response
    export_orders.short_description = "Export selected orders as CSV"


# Enhanced User Admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin


class UserAdminEnhanced(BaseUserAdmin):
    """Enhanced user admin with customer stats (Phase 8)"""
    list_display = [
        'username',
        'email',
        'customer_order_count',
        'customer_spent',
        'date_joined',
        'is_staff',
    ]
    list_filter = ['date_joined', 'is_staff', 'is_active']

    def customer_order_count(self, obj):
        count = obj.orders.count()
        return f"📦 {count}" if count > 0 else "-"
    customer_order_count.short_description = "Orders"

    def customer_spent(self, obj):
        from django.db.models import Sum
        total = obj.orders.filter(status='paid').aggregate(
            Sum('total')
        )['total__sum'] or 0
        return f"${total}" if total > 0 else "-"
    customer_spent.short_description = "Total Spent"


# Unregister default User admin and register enhanced version
admin.site.unregister(User)
admin.site.register(User, UserAdminEnhanced)
