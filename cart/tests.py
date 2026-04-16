from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from catalog.models import Product, Category
from .models import Cart, CartItem
from decimal import Decimal


class CartAPITestCase(TestCase):
    """Test cases for Shopping Cart API (Phase 9)"""
    
    def setUp(self):
        """Create test data"""
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='TestPass123')
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        
        self.category = Category.objects.create(name="Test", slug="test")
        self.product = Product.objects.create(
            name="Test Product",
            category=self.category,
            price=Decimal("29.99"),
            stock=100
        )
        
        self.cart = Cart.objects.create(user=self.user)

    def test_get_empty_cart(self):
        """Test retrieving empty cart"""
        response = self.client.get('/api/cart/view/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['items']), 0)

    def test_add_item_to_cart(self):
        """Test adding item to cart"""
        data = {
            'product_id': self.product.id,
            'quantity': 2,
            'size': 'M',
            'color': 'red'
        }
        response = self.client.post('/api/cart/add_item/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['quantity'], 2)

    def test_add_item_with_insufficient_stock(self):
        """Test adding item when stock is too low"""
        data = {
            'product_id': self.product.id,
            'quantity': 1000,
            'size': 'M',
            'color': 'red'
        }
        response = self.client.post('/api/cart/add_item/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
