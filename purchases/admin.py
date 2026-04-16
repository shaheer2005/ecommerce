from django.contrib import admin
from .models import OrderTimeline


@admin.register(OrderTimeline)
class OrderTimelineAdmin(admin.ModelAdmin):
    """Phase 7: Admin interface for order timeline"""
    list_display = ['order', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['order__id', 'message']
    readonly_fields = ['order', 'status', 'message', 'created_at']
    can_delete = False
