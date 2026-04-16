from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token


class UserAuthTestCase(TestCase):
    """Test cases for User Authentication (Phase 9)"""
    
    def setUp(self):
        """Setup test client"""
        self.client = APIClient()

    def test_user_registration(self):
        """Test user registration"""
        data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'TestPass123',
            'password2': 'TestPass123'
        }
        response = self.client.post('/api/users/register/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)
        self.assertTrue(User.objects.filter(username='testuser').exists())

    def test_registration_weak_password(self):
        """Test registration with weak password"""
        data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'short',
            'password2': 'short'
        }
        response = self.client.post('/api/users/register/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_login(self):
        """Test user login"""
        User.objects.create_user(username='testuser', email='test@example.com', password='TestPass123')
        data = {
            'username': 'testuser',
            'password': 'TestPass123'
        }
        response = self.client.post('/api/users/login/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        User.objects.create_user(username='testuser', password='TestPass123')
        data = {
            'username': 'testuser',
            'password': 'WrongPassword'
        }
        response = self.client.post('/api/users/login/', data, format='json')
        # Login endpoint returns 400 for invalid credentials
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED])

    def test_get_user_profile(self):
        """Test retrieving user profile"""
        user = User.objects.create_user(username='testuser', email='test@example.com', password='TestPass123')
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        
        response = self.client.get('/api/users/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertFalse(response.data.get('is_staff', False))
