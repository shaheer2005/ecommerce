from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from purchases.models import Order
from catalog.models import Product, Category
from decimal import Decimal


class DashboardAPITestCase(TestCase):
    """Test cases for Dashboard API (Phase 9)"""
    
    def setUp(self):
        """Create test data and admin user"""
        self.client = APIClient()
        
        # Create admin user
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='AdminPass123'
        )
        self.admin_user.is_staff = True
        self.admin_user.is_superuser = True
        self.admin_user.save()
        self.admin_token = Token.objects.create(user=self.admin_user)
        
        # Create regular user without admin access
        self.regular_user = User.objects.create_user(username='user', password='Pass123')
        self.regular_token = Token.objects.create(user=self.regular_user)
        
        # Create test data
        self.category = Category.objects.create(name="Test", slug="test")
        self.product = Product.objects.create(
            name="Test Product",
            category=self.category,
            price=Decimal("29.99"),
            stock=100
        )
        
        Order.objects.create(
            user=self.admin_user,
            status='paid',
            shipping_name='Admin',
            shipping_email='admin@example.com',
            shipping_address='123 Main',
            shipping_city='NYC',
            shipping_state='NY',
            shipping_zip='10001',
            shipping_country='USA',
            subtotal=Decimal('29.99'),
            total=Decimal('41.99')
        )

    def test_stats_requires_admin(self):
        """Test that stats API requires admin"""
        # Without token - returns 403 because IsAdminUser permission returns 403 for unauthenticated
        response = self.client.get('/api/dashboard/stats/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # With regular user token - returns 403 because user is not admin
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.regular_token.key}')
        response = self.client.get('/api/dashboard/stats/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_dashboard_stats(self):
        """Test retrieving dashboard stats"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        response = self.client.get('/api/dashboard/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_orders', response.data)
        self.assertIn('total_revenue', response.data)
        self.assertIn('total_customers', response.data)

    def test_get_top_products(self):
        """Test top products API"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        response = self.client.get('/api/dashboard/top-products/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_get_order_status_breakdown(self):
        """Test order status breakdown"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        response = self.client.get('/api/dashboard/order-status/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_get_daily_sales(self):
        """Test daily sales endpoint"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        response = self.client.get('/api/dashboard/daily-sales/?days=30')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_get_low_stock_products(self):
        """Test low stock products"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        response = self.client.get('/api/dashboard/low-stock/?threshold=50')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_get_customer_analytics(self):
        """Test customer analytics"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        response = self.client.get('/api/dashboard/customer-analytics/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_customers', response.data)
        self.assertIn('repeat_purchase_rate', response.data)

    def test_get_inventory_overview(self):
        """Test inventory endpoint"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        response = self.client.get('/api/dashboard/inventory/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_products', response.data)
        self.assertIn('inventory_health_score', response.data)

    def test_bulk_export(self):
        """Test bulk order export"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        order = Order.objects.first()
        data = {
            'action': 'bulk_export',
            'order_ids': [order.id]
        }
        response = self.client.post('/api/dashboard/bulk-actions/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
