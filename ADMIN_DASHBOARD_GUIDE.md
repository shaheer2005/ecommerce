# Phase 8: Admin Dashboard Guide

## Overview
Phase 8 provides a comprehensive admin dashboard with analytics, order management, inventory tracking, and customer insights.

**Key Features:**
- Real-time statistics (revenue, orders, customers)
- Sales analytics with daily breakdowns
- Top-selling products ranking
- Inventory management & low-stock alerts
- Customer analytics & lifetime value
- Bulk order operations
- Enhanced admin interface with visual indicators

---

## Dashboard API Endpoints

### 1. Overall Statistics
**Endpoint:** `GET /api/dashboard/stats/`  
**Authentication:** Required (Admin only)  
**Purpose:** Get key metrics overview

```bash
curl -H "Authorization: Token YOUR_ADMIN_TOKEN" \
  http://localhost:8000/api/dashboard/stats/
```

**Response:**
```json
{
  "total_orders": 45,
  "total_revenue": "3250.50",
  "total_customers": 32,
  "total_products": 18,
  "average_order_value": "72.34",
  "pending_orders": 5,
  "shipped_orders": 12
}
```

**Use Cases:**
- Dashboard home widget
- KPI monitoring
- Business health check

---

### 2. Top-Selling Products
**Endpoint:** `GET /api/dashboard/top-products/`  
**Authentication:** Required (Admin only)  
**Query Parameters:**
- `limit` (optional, default: 10) - Number of products to return

```bash
curl -H "Authorization: Token YOUR_ADMIN_TOKEN" \
  "http://localhost:8000/api/dashboard/top-products/?limit=5"
```

**Response:**
```json
[
  {
    "product_id": 3,
    "product_name": "Classic Blue T-Shirt",
    "units_sold": 156,
    "revenue": "3120.00",
    "average_rating": "4.5"
  },
  {
    "product_id": 1,
    "product_name": "Premium Denim Jeans",
    "units_sold": 89,
    "revenue": "2670.00",
    "average_rating": "4.8"
  }
]
```

**Sorting:**
- Results are ordered by revenue (highest first)

---

### 3. Order Status Breakdown
**Endpoint:** `GET /api/dashboard/order-status/`  
**Authentication:** Required (Admin only)  
**Purpose:** See distribution of orders by status

```bash
curl -H "Authorization: Token YOUR_ADMIN_TOKEN" \
  http://localhost:8000/api/dashboard/order-status/
```

**Response:**
```json
[
  {
    "status": "delivered",
    "count": 25,
    "percentage": "55.56"
  },
  {
    "status": "shipped",
    "count": 12,
    "percentage": "26.67"
  },
  {
    "status": "pending",
    "count": 5,
    "percentage": "11.11"
  },
  {
    "status": "refunded",
    "count": 3,
    "percentage": "6.67"
  }
]
```

**Use Cases:**
- Status pie/donut chart
- Fulfillment rate monitoring
- Order pipeline visualization

---

### 4. Daily Sales Data
**Endpoint:** `GET /api/dashboard/daily-sales/`  
**Authentication:** Required (Admin only)  
**Query Parameters:**
- `days` (optional, default: 30) - Number of days to return

```bash
curl -H "Authorization: Token YOUR_ADMIN_TOKEN" \
  "http://localhost:8000/api/dashboard/daily-sales/?days=7"
```

**Response:**
```json
[
  {
    "date": "2026-02-24",
    "orders_count": 3,
    "revenue": "215.50"
  },
  {
    "date": "2026-02-25",
    "orders_count": 5,
    "revenue": "385.75"
  },
  {
    "date": "2026-02-26",
    "orders_count": 2,
    "revenue": "149.99"
  }
]
```

**Use Cases:**
- Line chart for revenue trends
- Order volume tracking
- Sales performance analysis

---

### 5. Low-Stock Products
**Endpoint:** `GET /api/dashboard/low-stock/`  
**Authentication:** Required (Admin only)  
**Query Parameters:**
- `threshold` (optional, default: 10) - Stock warning level

```bash
curl -H "Authorization: Token YOUR_ADMIN_TOKEN" \
  "http://localhost:8000/api/dashboard/low-stock/?threshold=15"
```

**Response:**
```json
[
  {
    "product_id": 5,
    "product_name": "Summer Dress",
    "current_stock": 3,
    "warning_threshold": 15
  },
  {
    "product_id": 8,
    "product_name": "White Sneakers",
    "current_stock": 7,
    "warning_threshold": 15
  },
  {
    "product_id": 2,
    "product_name": "Cotton Shorts",
    "current_stock": 0,
    "warning_threshold": 15
  }
]
```

**Use Cases:**
- Inventory alerts
- Restock reminders
- Critical stock warnings

---

### 6. Customer Analytics
**Endpoint:** `GET /api/dashboard/customer-analytics/`  
**Authentication:** Required (Admin only)  
**Purpose:** Get customer behavior metrics

```bash
curl -H "Authorization: Token YOUR_ADMIN_TOKEN" \
  http://localhost:8000/api/dashboard/customer-analytics/
```

**Response:**
```json
{
  "total_customers": 32,
  "new_customers_this_month": 8,
  "returning_customers": 12,
  "repeat_purchase_rate": "37.50",
  "avg_customer_lifetime_value": "101.58"
}
```

**Metrics:**
- **repeat_purchase_rate**: Percentage of customers with 2+ orders
- **avg_customer_lifetime_value**: Average total spent per customer

---

### 7. Inventory Management
**Endpoint:** `GET /api/dashboard/inventory/`  
**Authentication:** Required (Admin only)  
**Purpose:** Get inventory overview

```bash
curl -H "Authorization: Token YOUR_ADMIN_TOKEN" \
  http://localhost:8000/api/dashboard/inventory/
```

**Response:**
```json
{
  "total_products": 18,
  "total_items_in_stock": 487,
  "out_of_stock_count": 2,
  "low_stock_count": 5,
  "inventory_health_score": 88.89
}
```

**Inventory Health Score:**
- Percentage of products in stock
- 100% = all products have inventory
- Lower score = more products out of stock

---

### 8. Bulk Order Actions
**Endpoint:** `POST /api/dashboard/bulk-actions/`  
**Authentication:** Required (Admin only)  
**Request Body:**
```json
{
  "action": "mark_processing",
  "order_ids": [1, 2, 3]
}
```

**Supported Actions:**

#### mark_processing
Mark paid orders as processing
```bash
curl -X POST \
  -H "Authorization: Token YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "mark_processing",
    "order_ids": [1, 2, 3]
  }' \
  http://localhost:8000/api/dashboard/bulk-actions/
```

**Response:**
```json
{
  "success": true,
  "message": "3 orders marked as processing"
}
```

#### bulk_export
Export order data to JSON
```bash
curl -X POST \
  -H "Authorization: Token YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "bulk_export",
    "order_ids": [1, 2, 3]
  }' \
  http://localhost:8000/api/dashboard/bulk-actions/
```

**Response:**
```json
[
  {
    "order_id": 1,
    "user": "john_doe",
    "status": "paid",
    "total": "150.00",
    "created_at": "2026-03-01T10:00:00Z"
  },
  {
    "order_id": 2,
    "user": "jane_smith",
    "status": "shipped",
    "total": "89.99",
    "created_at": "2026-03-01T11:30:00Z"
  }
]
```

---

## Enhanced Admin Interface

### Order Management
**URL:** `http://localhost:8000/admin/purchases/order/`

**Features:**
- **Color-coded Status** – Visual status badges (orange=pending, blue=paid, green=shipped, etc.)
- **Inline Order Items** – View products in each order without extra clicks
- **Bulk Actions:**
  - Mark selected orders as Processing
  - Export selected orders as CSV
- **Advanced Filters:**
  - Status
  - Creation/Payment/Shipped dates
  - Shipping carrier
  - Payment status (empty/filled)
- **Collapsible Fieldsets:**
  - Payment details (Stripe IDs)
  - Tracking & delivery info
  - Cancellation & refund data

**Quick Actions:**
- Click order ID to edit details
- Use filters to find orders by status
- Search by username, email, tracking number

---

### Product Inventory Management
**URL:** `http://localhost:8000/admin/catalog/product/`

**Enhancements:**
- **Stock Status Indicator:**
  - Green checkmark (✓) – In stock
  - Orange warning (⚠️) – Low stock (≤10 items)
  - Red X (❌) – Out of stock
- **Price Display** – Formatted with dollar sign
- **Rating Stars** – Visual 5-star rating display
- **Wishlist Count** – How many users want it

---

### User Management
**URL:** `http://localhost:8000/admin/auth/user/`

**Additional Columns:**
- **Orders Count** – Number of orders per customer (📦 emoji)
- **Total Spent** – Cumulative revenue from customer
- **Date Joined** – Customer signup date
- **Staff Status** – Admin/staff indicator

**Use Cases:**
- Identify VIP customers (high spend)
- Track new vs. old customers
- Monitor staff activity

---

## Admin Features Summary

| Feature | Location | Benefit |
|---------|----------|---------|
| Color-coded status | Order list | Quick visual scanning |
| Stock warnings | Product list | Avoid overselling |
| Customer spend | User list | Identify VIP customers |
| Bulk export | Order management | Data analysis/reporting |
| Collapsible sections | Order details | Less clutter, organized info |
| Inline order items | Order details | Edit items without navigation |
| Advanced filters | All lists | Faster data discovery |

---

## Testing Dashboard

### Test Scenario: Generate Dashboard Data

**1. Create Test Account**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "AdminPass123",
    "password2": "AdminPass123"
  }' \
  http://localhost:8000/api/users/register/
```

**2. Verify Admin Access** (Make user staff in Django shell)
```bash
python manage.py shell
# Inside shell:
from django.contrib.auth.models import User
admin = User.objects.get(username='admin')
admin.is_staff = True
admin.is_superuser = True
admin.save()
exit()
```

**3. Get Dashboard Stats**
```bash
curl -H "Authorization: Token YOUR_ADMIN_TOKEN" \
  http://localhost:8000/api/dashboard/stats/
```

**4. View Admin Interface**
- Go to: http://localhost:8000/admin
- Login with admin credentials
- Navigate to Orders, Products, Users

**5. Test Bulk Actions**
```bash
curl -X POST \
  -H "Authorization: Token YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "bulk_export",
    "order_ids": [1]
  }' \
  http://localhost:8000/api/dashboard/bulk-actions/
```

---

## API Response Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 200 | Success | Data returned |
| 401 | Unauthorized | Add valid Authorization header |
| 403 | Forbidden | User is not admin |
| 400 | Bad Request | Check request format |
| 404 | Not Found | Endpoint doesn't exist |

---

## Performance Notes

- **Stats endpoint** aggregates all orders (optimized with .aggregate())
- **Top products** uses annotation for efficiency
- **Daily sales** uses `.extra()` for date grouping (consider window functions in Django 3.1+)
- **Customer analytics** uses distinct() to avoid duplicates in aggregation

**Optimization Tips:**
- Cache stats if dashboard refreshes frequently
- Implement pagination for large product/customer lists
- Use `.only()` or `.defer()` to limit field retrieval
- Add database indexes on frequently filtered fields (status, created_at)

---

## Admin Dashboard Customization

The admin interface is fully customizable. To extend:

**1. Add more actions:**
```python
# In dashboard/admin.py
def bulk_action_example(self, request, queryset):
    # Custom logic here
    self.message_user(request, "Action complete")
bulk_action_example.short_description = "Custom Action"
```

**2. Add custom filters:**
```python
from django.contrib.admin import SimpleListFilter

class CustomFilter(SimpleListFilter):
    title = 'custom field'
    parameter_name = 'custom'
    
    def lookups(self, request, model_admin):
        return [('option1', 'Option 1')]
    
    def queryset(self, request, queryset):
        if self.value() == 'option1':
            return queryset.filter(...)
```

**3. Add calculated columns:**
```python
def revenue_chart(self, obj):
    return f"${obj.total} ({obj.status})"
revenue_chart.short_description = "Revenue"
```

---

## Next Steps

**Phase 9: Testing & Optimization**
- Add unit tests for dashboard views
- Implement caching (Redis)
- Add request throttling
- Generate API documentation

**Phase 10: Deployment**
- Scale dashboard for production
- Set up monitoring/alerts
- Configure Gunicorn + Nginx
- Deploy to AWS/Heroku

---

## Support

**Common Issues:**

**Issue:** "Forbidden" when accessing dashboard
- **Solution:** Ensure user has `is_staff=True` and `is_superuser=True` flags

**Issue:** Stats showing 0 values
- **Solution:** Create test orders and customers first

**Issue:** Slow dashboard loading
- **Solution:** Add database indexes or implement caching

For detailed troubleshooting, enable Django debug mode and check error logs.
