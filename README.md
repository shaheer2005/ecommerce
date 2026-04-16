# E-commerce Project

This workspace contains a Django backend and a React frontend for a clothing and shoes e-commerce site.

## Structure

- `backend/` - Django project
  - `users/` - user accounts API
  - `catalog/` - product models and APIs
  - `purchases/` - order/purchase logic with Stripe integration

- `frontend/` - React application created with Create React App

## Quick Start

### Prerequisites
- Python 3.14+
- Node.js 24+
- PowerShell execution policy set to allow scripts

### Setup and Run

1. **Clone and navigate to the project directory**

2. **Backend Setup:**
   ```bash
   # Install Python dependencies
   d:/ecommerce/.venv-1/Scripts/python.exe -m pip install -r requirements.txt

   # Run migrations
   d:/ecommerce/.venv-1/Scripts/python.exe manage.py migrate

   # Start Django server
   d:/ecommerce/.venv-1/Scripts/python.exe manage.py runserver
   ```
   Backend will run on: http://localhost:8000

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm start
   ```
   Frontend will run on: http://localhost:3000

### Alternative: Use the batch file
Double-click `start_servers.bat` to start both servers automatically.

## Features

- Django REST framework API for users, products, cart, and orders
- Stripe payment integration
- Image handling via `ImageField` and media settings
- CORS configured for React dev server
- React front-end with authentication, cart, and checkout
- Admin dashboard for order management

## Environment Variables

Create a `.env` file in the root directory with:
```
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,yourdomain.com

STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

EASYPAISA_STORE_ID=your_easypaisa_store_id
EASYPAISA_USERNAME=your_easypaisa_username
EASYPAISA_PASSWORD=your_easypaisa_password

BANK_NAME=Your Bank Name
ACCOUNT_HOLDER=Your Business Name
ACCOUNT_NUMBER=1234567890
IBAN=PK12345678901234567890
SWIFT_CODE=BANKPKKA

EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
DEFAULT_FROM_EMAIL=no-reply@eshopdeluxe.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@example.com
EMAIL_HOST_PASSWORD=your-email-password
USE_S3=true  # optional for S3 storage
```
For local development, you can also use `django.core.mail.backends.console.EmailBackend` to print email output to the console.

## API Documentation

API docs available at: http://localhost:8000/api/docs/

## Troubleshooting

- If PowerShell blocks scripts, run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
- Ensure virtual environment is activated for backend commands
- Check that ports 8000 and 3000 are free

```
}