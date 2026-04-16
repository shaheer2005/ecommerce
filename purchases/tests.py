from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from catalog.models import Product, Category
from cart.models import Cart, CartItem
from .models import Order
from decimal import Decimal


class OrderAPITestCase(TestCase):
    """Integration tests for Order/Checkout flow (Phase 9)"""
    
    def setUp(self):
        """Create test data"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123'
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        
        self.category = Category.objects.create(name="Test", slug="test")
        self.product = Product.objects.create(
            name="Test Product",
            category=self.category,
            price=Decimal("29.99"),
            stock=100
        )

    def test_get_user_orders(self):
        """Test retrieving user's orders"""
        Order.objects.create(
            user=self.user,
            status='pending',
            shipping_name='John Doe',
            shipping_email='john@example.com',
            shipping_address='123 Main St',
            shipping_city='NYC',
            shipping_state='NY',
            shipping_zip='10001',
            shipping_country='USA',
            subtotal=Decimal('29.99'),
            total=Decimal('41.99')
        )
        
        response = self.client.get('/api/purchases/orders/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_order_cannot_be_marked_shipped_by_user(self):
        """Normal user cannot mark their own order as shipped"""
        order = Order.objects.create(
            user=self.user,
            status='paid',
            shipping_name='John Doe',
            shipping_email='john@example.com',
            shipping_address='123 Main St',
            shipping_city='NYC',
            shipping_state='NY',
            shipping_zip='10001',
            shipping_country='USA',
            subtotal=Decimal('29.99'),
            total=Decimal('41.99')
        )

        data = {
            'tracking_number': '1Z999AA1012345678',
            'shipping_carrier': 'fedex'
        }
        response = self.client.post(f'/api/purchases/orders/{order.id}/mark_shipped/', data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_mark_order_shipped(self):
        """Admin user should be able to mark orders as shipped"""
        admin_user = User.objects.create_user(username='adminuser', email='admin@example.com', password='AdminPass123')
        admin_user.is_staff = True
        admin_user.save()
        admin_token = Token.objects.create(user=admin_user)
        order = Order.objects.create(
            user=self.user,
            status='paid',
            shipping_name='John Doe',
            shipping_email='john@example.com',
            shipping_address='123 Main St',
            shipping_city='NYC',
            shipping_state='NY',
            shipping_zip='10001',
            shipping_country='USA',
            subtotal=Decimal('29.99'),
            total=Decimal('41.99')
        )

        self.client.credentials(HTTP_AUTHORIZATION=f'Token {admin_token.key}')
        data = {
            'tracking_number': '1Z999AA1012345678',
            'shipping_carrier': 'fedex'
        }
        response = self.client.post(f'/api/purchases/orders/{order.id}/mark_shipped/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'shipped')
