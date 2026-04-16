# Image Upload & CDN Setup Guide

## Local Development (Default)

Images are stored in `media/` folder locally. No special setup needed:

```bash
# Django dev server automatically serves media files
python manage.py runserver
# Images accessible at: http://localhost:8000/media/products/{product_id}/images/{filename}
```

## Upload Images via Admin

1. Go to http://localhost:8000/admin
2. Navigate to Products
3. Select a product
4. In the "Product Images" inline section, click "Add another Product Image"
5. Upload image and set alt text, is_primary, order
6. Save

## Upload Images via API

```bash
# Create authorization token first (see Phase 2)
TOKEN="your-token-here"

# Upload image(s) to a product (staff user only)
curl -X POST http://localhost:8000/api/catalog/products/1/upload_image/ \
  -H "Authorization: Token $TOKEN" \
  -F "images=@path/to/image.jpg" \
  -F "alt_text=Product image" \
  -F "is_primary=true"

# Upload multiple images
curl -X POST http://localhost:8000/api/catalog/products/1/upload_image/ \
  -H "Authorization: Token $TOKEN" \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg" \
  -F "images=@image3.png"
```

## Production: AWS S3 Setup

### 1. Create AWS S3 Bucket

```bash
# Create bucket
aws s3api create-bucket \
  --bucket my-ecommerce-images \
  --region us-east-1

# Enable public read access
aws s3api put-bucket-policy \
  --bucket my-ecommerce-images \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::my-ecommerce-images/*"
      }
    ]
  }'
```

### 2. Create IAM User with S3 Access

```bash
# Create policy for Django uploads
aws iam create-policy \
  --policy-name ecommerce-s3-upload \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
        "Resource": "arn:aws:s3:::my-ecommerce-images/*"
      }
    ]
  }'

# Create user and attach policy
aws iam create-user --user-name ecommerce-django
aws iam attach-user-policy \
  --user-name ecommerce-django \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/ecommerce-s3-upload

# Generate access keys
aws iam create-access-key --user-name ecommerce-django
```

### 3. Configure Environment Variables

```bash
# .env file (keep secure!)
USE_S3=True
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_STORAGE_BUCKET_NAME=my-ecommerce-images
AWS_S3_REGION_NAME=us-east-1
```

### 4. Deploy to Production

```bash
# Update settings to use S3
python manage.py collectstatic --noinput

# Django will now upload all media files to S3
# Images accessible at: https://my-ecommerce-images.s3.amazonaws.com/media/...
```

## With Cloudflare CDN

S3 works great, but for even faster delivery globally:

1. **Set up CloudFlare:**
   - Add your domain to Cloudflare
   - Point DNS to Cloudflare nameservers
   
2. **Cache Images:**
   - S3 bucket images get cached automatically at Cloudflare edge locations
   - Cache rules: Cache everything for media/* with long TTL

3. **Custom domain:**
   - Point `images.yourdomain.com` to your S3 bucket via CNAME
   - Cloudflare caches and serves from nearest location

## Image Optimization on Frontend (React)

```jsx
import { useState, useEffect } from 'react';

export function ProductGallery({ product }) {
  const images = product.images || [];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const currentImage = images[selectedIndex];

  return (
    <div>
      {/* Main image with lazy loading */}
      <img
        src={currentImage.image}
        alt={currentImage.alt_text}
        loading="lazy"
        srcSet={`
          ${currentImage.image}?w=400 400w,
          ${currentImage.image}?w=800 800w,
          ${currentImage.image}?w=1200 1200w
        `}
        sizes="(max-width: 600px) 100vw, 50vw"
      />

      {/* Thumbnails */}
      <div className="thumbnail-gallery">
        {images.map((img, idx) => (
          <img
            key={idx}
            src={`${img.image}?w=100`}  // Small thumbnail
            alt="Thumbnail"
            onClick={() => setSelectedIndex(idx)}
            className={selectedIndex === idx ? 'selected' : ''}
          />
        ))}
      </div>
    </div>
  );
}
```

## Testing

```bash
# Get product with all images
curl http://localhost:8000/api/catalog/products/1/

# Response includes 'images' array with all gallery images
```

## Key Takeaways

- **Local**: Images in `media/` folder, Django serves them
- **Production**: Use S3 for scalability + Cloudflare for global CDN
- **Optimization**: Auto-resize + compress on upload
- **Upload**: Admin UI or API endpoint (staff only)
- **Frontend**: Use responsive srcset + lazy loading

Next: Phase 5 - Shopping Cart & Wishlist
