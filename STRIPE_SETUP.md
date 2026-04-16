# Phase 6: Stripe Payment Integration Guide

## 🎯 Setup Overview

Your ecommerce backend now has full Stripe integration for:
- Secure checkout sessions
- Payment processing
- Order management
- Webhook handling for payment confirmation

---

## 📋 Database Schema

### Order Model
```
- id (primary key)
- user (ForeignKey to User)
- stripe_session_id
- stripe_payment_intent
- status (pending, paid, processing, shipped, delivered, cancelled, refunded)
- shipping_name, email, address, city, state, zip, country
- subtotal, shipping_cost, tax, total
- created_at, updated_at, paid_at
```

### OrderItem Model
```
- id
- order (ForeignKey to Order)
- product (ForeignKey to Product)
- quantity, price, size, color
```

---

## 🔑 Getting Stripe Keys

### 1. Create Stripe Account
Go to https://stripe.com and sign up for a free account.

### 2. Get Test Keys
1. Log in to Stripe Dashboard
2. Go to Developers → API Keys
3. Copy:
   - **Secret Key** (starts with `sk_test_`)
   - **Publishable Key** (starts with `pk_test_`)

### 3. Set Up Webhook
1. Go to Developers → Webhooks
2. Click "Add endpoint"
3. Enter webhook URL: `https://yourdomain.com/api/purchases/webhook/stripe/`
4. Select events: `checkout.session.completed`, `charge.refunded`
5. Copy webhook signing secret (starts with `whsec_`)

---

## 🛠️ Configuration

### Local Development (.env file)
```bash
STRIPE_SECRET_KEY=sk_test_your_test_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Production (.env file)
Use production keys (starts with `sk_live_` and `pk_live_`)

---

## 🎯 API Endpoints

### 1. Create Checkout Session
**POST** `/api/purchases/checkout/`

**Authentication:** Token required

**Request Body:**
```json
{
  "shipping_name": "John Doe",
  "shipping_email": "john@example.com",
  "shipping_address": "123 Main St",
  "shipping_city": "New York",
  "shipping_state": "NY",
  "shipping_zip": "10001",
  "shipping_country": "USA"
}
```

**Response:**
```json
{
  "checkout_url": "https://checkout.stripe.com/pay/...",
  "session_id": "cs_test_...",
  "order_id": 1
}
```

**Flow:**
1. User clicks "Checkout" with items in cart
2. POST to `/api/purchases/checkout/` with shipping info
3. Backend creates Order + OrderItems
4. Stripe checkout session created
5. Redirect user to `checkout_url`
6. Stripe handles payment
7. On success, webhook confirms and marks order as `paid`

### 2. Get User's Orders
**GET** `/api/purchases/orders/`

**Authentication:** Token required

**Response:**
```json
[
  {
    "id": 1,
    "status": "paid",
    "items": [
      {
        "id": 1,
        "product": { ... },
        "quantity": 2,
        "price": "59.99",
        "size": "M",
        "color": "Black",
        "total_price": 119.98
      }
    ],
    "subtotal": "119.98",
    "shipping_cost": "10.00",
    "tax": "10.40",
    "total": "140.38",
    "shipping_name": "John Doe",
    "created_at": "2026-03-02T10:00:00Z",
    "paid_at": "2026-03-02T10:05:00Z"
  }
]
```

### 3. Get Order Details
**GET** `/api/purchases/orders/{id}/`

**Authentication:** Token required

---

## 🧪 Testing Flow

### Step 1: Create Account & Add to Cart
```bash
# Register
TOKEN=$(curl -X POST http://localhost:8000/api/users/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123",
    "password2": "testpass123"
  }' | jq -r '.token')

# Add product to cart
curl -X POST http://localhost:8000/api/cart/cart/add_item/ \
  -H "Authorization: Token $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 1,
    "quantity": 1,
    "size": "M",
    "color": "Black"
  }'
```

### Step 2: Create Checkout Session
```bash
curl -X POST http://localhost:8000/api/purchases/checkout/ \
  -H "Authorization: Token $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shipping_name": "John Doe",
    "shipping_email": "john@example.com",
    "shipping_address": "123 Main St",
    "shipping_city": "New York",
    "shipping_state": "NY",
    "shipping_zip": "10001",
    "shipping_country": "USA"
  }'
```

Response includes `checkout_url` – click it to go to Stripe test checkout.

### Step 3: Test Payment
Use Stripe test card numbers:

**Success (payment succeeds):**
```
Card: 4242 4242 4242 4242
Exp: 12/25
CVC: 123
```

**Decline (payment fails):**
```
Card: 4000 0000 0000 0002
Exp: 12/25
CVC: 123
```

### Step 4: Verify Orders
```bash
curl http://localhost:8000/api/purchases/orders/ \
  -H "Authorization: Token $TOKEN"
```

---

## 🔐 Production Checklist

- [ ] Use live Stripe keys (from https://stripe.com/dashboard)
- [ ] Set `DEBUG = False` in settings
- [ ] Verify webhook signing secret is correct
- [ ] Test webhook delivery in Stripe Dashboard
- [ ] Set proper ALLOWED_HOSTS in Django settings
- [ ] Use HTTPS everywhere (required by Stripe)
- [ ] Store sensitive keys in environment variables, never in code
- [ ] Set up error logging/monitoring
- [ ] Add email notifications for order confirmations

---

## 📧 Order Confirmations (Optional)

To send confirmation emails after payment:

1. Add to `purchases/views.py` in webhook handler:
```python
from django.core.mail import send_mail

if order.status == 'paid':
    send_mail(
        'Order Confirmation',
        f'Thank you! Your order #{order.id} is confirmed.',
        'noreply@yourdomain.com',
        [order.user.email],
    )
```

2. Configure email backend in `.env`:
```
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

---

## 🐛 Troubleshooting

**Webhook not working?**
- Verify webhook secret in settings matches Stripe Dashboard
- Check Django logs for errors
- Test webhook delivery in Stripe Dashboard

**Payment succeeds but order status not updating?**
- Check stripe_webhook view is being called
- Verify PaymentIntent metadata includes `order_id`
- Check database for order record

**Cart not clearing after payment?**
- Webhook handler should delete CartItems
- Verify cart object exists for user

---

## Next Steps

- [ ] Build React checkout form UI
- [ ] Add order confirmation emails
- [ ] Integrate order tracking/shipping
- [ ] Add refund/cancellation logic
- [ ] Set up production Stripe account
