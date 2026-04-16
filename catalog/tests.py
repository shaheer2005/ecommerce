from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from .models import Category, Product, ProductImage
from decimal import Decimal


class ProductAPITestCase(TestCase):
    """Test cases for Product API endpoints (Phase 9)"""
    
    def setUp(self):
        """Create test data"""
        self.client = APIClient()
        self.category = Category.objects.create(
            name="Test Category",
            slug="test-category"
        )
        self.product = Product.objects.create(
            name="Test Product",
            category=self.category,
            description="Test Description",
            price=Decimal("29.99"),
            stock=100,
            gender="unisex",
            sizes="S,M,L",
            colors="red,blue",
            rating=Decimal("4.5")
        )

    def test_get_products_list(self):
        """Test retrieving product list"""
        response = self.client.get('/api/catalog/products/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)

    def test_get_product_detail(self):
        """Test retrieving single product"""
        response = self.client.get(f'/api/catalog/products/{self.product.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], "Test Product")

    def test_filter_by_category(self):
        """Test filtering products by category"""
        response = self.client.get(f'/api/catalog/products/?category={self.category.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_filter_by_price_range(self):
        """Test filtering by price range"""
        response = self.client.get('/api/catalog/products/?min_price=20&max_price=40')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_search_products(self):
        """Test product search"""
        response = self.client.get('/api/catalog/products/?search=Test')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_featured_products(self):
        """Test featured products endpoint"""
        response = self.client.get('/api/catalog/products/featured/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
