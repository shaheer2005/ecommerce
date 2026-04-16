from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CheckoutView, stripe_webhook, easypaisa_callback, OrderViewSet

router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='order')

urlpatterns = [
    path('', include(router.urls)),
    path('checkout/', CheckoutView.as_view(), name='checkout'),
    path('webhook/stripe/', stripe_webhook, name='stripe-webhook'),
    path('easypaisa/callback/', easypaisa_callback, name='easypaisa-callback'),
]
