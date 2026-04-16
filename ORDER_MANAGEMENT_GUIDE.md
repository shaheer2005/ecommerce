# Phase 7: Order Management System Guide

## Overview
Phase 7 adds comprehensive order tracking, management, and fulfillment capabilities to the e-commerce platform.

**New Features:**
- Order status tracking with detailed timeline
- Shipping integration (FedEx, UPS, USPS, DHL)
- Order cancellation with inventory restoration
- Full refund processing via Stripe
- Order estimated delivery dates

---

## API Endpoints

### 1. Get Order Details
**Endpoint:** `GET /api/purchases/orders/{id}/`  
**Authentication:** Required (Token)  
**Response:** Order with full details including timeline

```bash
curl -H "Authorization: Token YOUR_TOKEN" \
  http://localhost:8000/api/purchases/orders/1/
```

**Response:**
```json
{
  "id": 1,
  "status": "paid",
  "items": [
    {
      "id": 1,
      "product": {...},
      "quantity": 2,
      "price": "29.99",
      "size": "M",
      "color": "blue",
      "total_price": "59.98"
    }
  ],
  "timeline": [
    {
      "id": 1,
      "status": "paid",
      "message": "Payment confirmed",
      "created_at": "2026-03-02T10:00:00Z"
    }
  ],
  "subtotal": "59.98",
  "shipping_cost": "9.99",
  "tax": "5.60",
  "total": "75.57",
  "tracking_number": null,
  "shipping_carrier": null,
  "shipped_at": null,
  "estimated_delivery_at": null,
  "delivered_at": null,
  "can_be_cancelled": true,
  "can_be_refunded": true,
  "created_at": "2026-03-02T10:00:00Z"
}
```

---

### 2. Mark Order as Shipped
**Endpoint:** `POST /api/purchases/orders/{id}/mark_shipped/`  
**Authentication:** Required (Admin/Staff recommended)  
**Request Body:**
```json
{
  "tracking_number": "1Z999AA1012345678",
  "shipping_carrier": "fedex"
}
```

**Shipping Carrier Options:**
- `fedex` - FedEx
- `ups` - UPS
- `usps` - USPS
- `dhl` - DHL
- `other` - Other carriers

**Example:**
```bash
curl -X POST \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tracking_number": "1Z999AA1012345678",
    "shipping_carrier": "fedex"
  }' \
  http://localhost:8000/api/purchases/orders/1/mark_shipped/
```

**Automatically Sets:**
- Order status to `shipped`
- `shipped_at` timestamp
- `estimated_delivery_at` to 5 days from now
- Creates timeline entry with tracking info

---

### 3. Mark Order as Delivered
**Endpoint:** `POST /api/purchases/orders/{id}/mark_delivered/`  
**Authentication:** Required (Admin/Staff recommended)  
**Request Body:** Empty

**Example:**
```bash
curl -X POST \
  -H "Authorization: Token YOUR_TOKEN" \
  http://localhost:8000/api/purchases/orders/1/mark_delivered/
```

**Requirements:**
- Order must be in `shipped` status
- Automatically sets `delivered_at` timestamp
- Creates timeline entry

---

### 4. Cancel Order
**Endpoint:** `POST /api/purchases/orders/{id}/cancel/`  
**Authentication:** Required  
**Request Body:**
```json
{
  "cancellation_reason": "Changed my mind"
}
```

**Example:**
```bash
curl -X POST \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cancellation_reason": "Changed my mind"
  }' \
  http://localhost:8000/api/purchases/orders/1/cancel/
```

**Eligibility:**
- Order status must be: `pending`, `paid`, or `processing`
- Cannot cancel if already `shipped`, `delivered`, `cancelled`, or `refunded`

**Actions on Cancellation:**
- Sets status to `cancelled`
- Restores product inventory
- Creates timeline entry with reason
- Stores `cancelled_at` timestamp

---

### 5. Refund Order
**Endpoint:** `POST /api/purchases/orders/{id}/refund/`  
**Authentication:** Required (Admin recommended)  
**Request Body:** Empty

**Example:**
```bash
curl -X POST \
  -H "Authorization: Token YOUR_TOKEN" \
  http://localhost:8000/api/purchases/orders/1/refund/
```

**Eligibility:**
- Order must be in `paid` status
- Must not have been previously refunded
- Must have valid Stripe `stripe_payment_intent`

**Actions on Refund:**
- Creates Stripe refund for full order amount
- Sets status to `refunded`
- Stores `refund_amount` and `refunded_at`
- Stores Stripe `refund_id` for audit trail
- Creates timeline entry

---

## Order Timeline
Every order action (payment, shipping, delivery, cancellation, refund) creates an entry in the timeline.

**Timeline Fields:**
- `id` - Timeline entry ID
- `status` - Status at this point
- `message` - Human-readable message
- `created_at` - When this status was set

**Example Timeline:**
```json
{
  "timeline": [
    {
      "id": 1,
      "status": "paid",
      "message": "Payment confirmed",
      "created_at": "2026-03-02T10:00:00Z"
    },
    {
      "id": 2,
      "status": "shipped",
      "message": "Order shipped via FEDEX - Tracking: 1Z999AA1012345678",
      "created_at": "2026-03-02T12:00:00Z"
    },
    {
      "id": 3,
      "status": "delivered",
      "message": "Order delivered successfully",
      "created_at": "2026-03-07T14:30:00Z"
    }
  ]
}
```

---

## Admin Interface Features

### Order Admin Panel
Access at: `http://localhost:8000/admin/purchases/order/`

**List Display:**
- Order ID
- User
- Current Status
- Total Amount
- Tracking Number
- Created Date
- Shipped Date

**Filters:**
- Status (pending, paid, processing, shipped, delivered, cancelled, refunded)
- Creation Date
- Payment Date
- Shipped Date
- Shipping Carrier

**Editable Fieldsets:**
1. **User** - Order owner
2. **Stripe** - Payment IDs (read-only)
3. **Status** - Current order status
4. **Shipping Info** - Delivery address
5. **Tracking** - Tracking number, carrier, dates
6. **Cancellation** - Cancellation reason and timestamp
7. **Refund** - Refund amount, Stripe ID
8. **Pricing** - Subtotal, shipping, tax, total
9. **Timeline** - Inline display of all status updates

---

## Order Status Flow

```
pending
  ├─→ paid (payment confirmed)
  │     ├─→ processing (preparing to ship)
  │     │     ├─→ shipped (in transit)
  │     │     │     └─→ delivered ✓
  │     │     └─→ cancelled (inventory restored)
  │     ├─→ refunded (full refund issued)
  │     └─→ cancelled (inventory restored)
  └─→ cancelled (never paid)
```

---

## Testing (Manual)

### Test Scenario: Full Order Lifecycle

**1. Create Account**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "SecurePass123",
    "password2": "SecurePass123"
  }' \
  http://localhost:8000/api/users/register/
```

Copy the token from response.

**2. Add Product to Cart**
```bash
curl -X POST \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 1,
    "quantity": 1,
    "size": "M",
    "color": "blue"
  }' \
  http://localhost:8000/api/cart/cart/add_item/
```

**3. Create Order (Checkout)**
```bash
curl -X POST \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shipping_name": "John Doe",
    "shipping_email": "john@example.com",
    "shipping_address": "123 Main St",
    "shipping_city": "New York",
    "shipping_state": "NY",
    "shipping_zip": "10001",
    "shipping_country": "USA"
  }' \
  http://localhost:8000/api/purchases/checkout/
```

**4. Verify Order (Admin Only)**
- Go to Django Admin: http://localhost:8000/admin/purchases/order/
- Find your order, view details

**5. Mark as Shipped (Admin)**
```bash
curl -X POST \
  -H "Authorization: Token ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tracking_number": "1Z999AA1012345678",
    "shipping_carrier": "fedex"
  }' \
  http://localhost:8000/api/purchases/orders/1/mark_shipped/
```

**6. View Updated Order**
```bash
curl -H "Authorization: Token YOUR_TOKEN" \
  http://localhost:8000/api/purchases/orders/1/
```

Verify:
- Status changed to `shipped`
- `tracking_number` populated
- `shipped_at` timestamp set
- `estimated_delivery_at` set to +5 days
- New timeline entry created

**7. Mark as Delivered (Admin)**
```bash
curl -X POST \
  -H "Authorization: Token ADMIN_TOKEN" \
  http://localhost:8000/api/purchases/orders/1/mark_delivered/
```

**8. View Final Order**
- Status should be `delivered`
- `delivered_at` timestamp should be recent
- Timeline shows complete flow

---

## Testing Cancellation & Refunds

### Cancellation (Before Shipped)
```bash
curl -X POST \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cancellation_reason": "Item out of stock"
  }' \
  http://localhost:8000/api/purchases/orders/1/cancel/
```

**Verify:**
- Status → `cancelled`
- Inventory restored to products
- Timeline entry created

### Refund (After Payment)
```bash
curl -X POST \
  -H "Authorization: Token YOUR_TOKEN" \
  http://localhost:8000/api/purchases/orders/1/refund/
```

**Verify:**
- Status → `refunded`
- Refund visible in Stripe dashboard
- `stripe_refund_id` populated in order

---

## Database Schema

### Order Model (Updated)
```python
user: ForeignKey(User)
stripe_session_id: CharField (nullable)
stripe_payment_intent: CharField (nullable)
status: Choice [pending, paid, processing, shipped, delivered, cancelled, refunded]
shipping_name/email/address: CharField/EmailField/TextField
shipping_city/state/zip/country: CharField
tracking_number: CharField (nullable, Phase 7)
shipping_carrier: Choice [fedex, ups, usps, dhl, other]
shipped_at: DateTime (nullable, Phase 7)
estimated_delivery_at: DateTime (nullable, Phase 7)
delivered_at: DateTime (nullable, Phase 7)
cancellation_reason: TextField (nullable, Phase 7)
cancelled_at: DateTime (nullable, Phase 7)
refund_amount: DecimalField (Phase 7)
refunded_at: DateTime (nullable, Phase 7)
stripe_refund_id: CharField (nullable, Phase 7)
subtotal/shipping_cost/tax/total: DecimalField
created_at/updated_at/paid_at: DateTime
```

### OrderTimeline Model (New)
```python
order: ForeignKey(Order)
status: CharField
message: TextField
created_at: DateTime (auto_now_add)
```

---

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `Order is not eligible for refund` | Order not in `paid` status or already refunded | Check order status, can only refund paid orders |
| `Order with status 'X' cannot be cancelled` | Order in non-cancellable state | Can only cancel pending/paid/processing orders |
| `tracking_number and shipping_carrier are required` | Missing required fields | Provide both tracking number and carrier |
| `Only shipped orders can be marked as delivered` | Order not shipped yet | Mark as shipped first |
| Stripe refund fails | Invalid Stripe intent or token expired | Verify Stripe API key, check test vs. live mode |

---

## Next Steps (Phase 8+)
- **Phase 8**: Admin dashboard with order analytics
- **Phase 9**: Automated email notifications for status changes
- **Phase 10**: Shipping rate integration and real-time tracking updates

---

## Code Reference

**Key Methods:**
- `Order.can_be_cancelled()` - Check if order eligible for cancellation
- `Order.can_be_refunded()` - Check if order eligible for refund
- `Order.set_shipped(tracking_number, carrier)` - Mark shipped with tracking
- `Order.set_delivered()` - Mark as delivered

**ViewSet Actions:**
- `POST /orders/{id}/mark_shipped/` - Ship an order
- `POST /orders/{id}/mark_delivered/` - Deliver an order
- `POST /orders/{id}/cancel/` - Cancel an order
- `POST /orders/{id}/refund/` - Refund an order

---

## Support
For issues or questions, check the Django admin interface for order history or enable Django debug mode for detailed error messages.
