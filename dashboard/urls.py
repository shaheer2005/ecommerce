from django.urls import path
from .views import (
    DashboardStatsView,
    TopProductsView,
    OrderStatusBreakdownView,
    DailySalesView,
    LowStockProductsView,
    CustomerAnalyticsView,
    InventoryManagementView,
    BulkOrderActionsView,
)

urlpatterns = [
    path('stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('top-products/', TopProductsView.as_view(), name='top-products'),
    path('order-status/', OrderStatusBreakdownView.as_view(), name='order-status'),
    path('daily-sales/', DailySalesView.as_view(), name='daily-sales'),
    path('low-stock/', LowStockProductsView.as_view(), name='low-stock'),
    path('customer-analytics/', CustomerAnalyticsView.as_view(), name='customer-analytics'),
    path('inventory/', InventoryManagementView.as_view(), name='inventory'),
    path('bulk-actions/', BulkOrderActionsView.as_view(), name='bulk-actions'),
]
