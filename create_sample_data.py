"""Enhanced sample data management script with professional products"""
import os
import django
import requests
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from catalog.models import Category, Product, ProductImage

def download_image(url, fallback_text="Product Image"):
    """Download image from URL or create fallback"""
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            img = Image.open(BytesIO(response.content))
            # Resize to standard dimensions
            img = img.resize((800, 600), Image.Resampling.LANCZOS)
            buffer = BytesIO()
            img.save(buffer, format='JPEG', quality=85)
            buffer.seek(0)
            return buffer
    except Exception as e:
        print(f"Failed to download {url}: {e}")

    # Fallback: create simple placeholder
    img = Image.new('RGB', (800, 600), (100, 100, 100))
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("arial.ttf", 40)
    except:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), fallback_text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (800 - text_width) // 2
    y = (600 - text_height) // 2
    draw.text((x, y), fallback_text, fill=(255, 255, 255), font=font)
    buffer = BytesIO()
    img.save(buffer, format='JPEG')
    buffer.seek(0)
    return buffer

def create_sample_data():
    """Create comprehensive sample data"""

    # Clear existing data
    ProductImage.objects.all().delete()
    Product.objects.all().delete()
    Category.objects.all().delete()

    print("Creating categories...")

    # Create main categories with colors
    categories_data = [
        {
            'name': 'Men\'s Shoes',
            'slug': 'mens-shoes',
            'description': 'Premium athletic and casual footwear for men',
            'color': (70, 130, 180)  # Steel Blue
        },
        {
            'name': 'Women\'s Shoes',
            'slug': 'womens-shoes',
            'description': 'Elegant and comfortable shoes for women',
            'color': (255, 20, 147)  # Deep Pink
        },
        {
            'name': 'Men\'s Clothing',
            'slug': 'mens-clothing',
            'description': 'Stylish apparel for the modern man',
            'color': (0, 100, 0)  # Dark Green
        },
        {
            'name': 'Women\'s Clothing',
            'slug': 'womens-clothing',
            'description': 'Fashionable clothing for women',
            'color': (148, 0, 211)  # Dark Violet
        },
        {
            'name': 'Watches',
            'slug': 'watches',
            'description': 'Luxury and casual timepieces',
            'color': (184, 134, 11)  # Dark Goldenrod
        },
        {
            'name': 'Perfumes',
            'slug': 'perfumes',
            'description': 'Premium fragrances for men and women',
            'color': (75, 0, 130)  # Indigo
        },
        {
            'name': 'Accessories',
            'slug': 'accessories',
            'description': 'Bags, belts, and other accessories',
            'color': (139, 69, 19)  # Saddle Brown
        }
    ]

    categories = {}
    for cat_data in categories_data:
        color = cat_data.pop('color')
        category = Category.objects.create(**cat_data)
        categories[cat_data['slug']] = {'obj': category, 'color': color}
        print(f"Created category: {category.name}")

    print("Creating products...")

    # Men's Shoes
    mens_shoes_products = [
        {
            'name': 'Nike Air Max 270',
            'description': 'Revolutionary Air Max technology meets modern design. Experience all-day comfort with responsive cushioning.',
            'price': 150.00,
            'sizes': '7,8,9,10,11,12,13',
            'colors': 'Black,White,Blue,Red',
            'rating': 4.8,
            'stock': 25,
            'image_url': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop'
        },
        {
            'name': 'Adidas Ultraboost 22',
            'description': 'Engineered for performance with BOOST technology. Perfect for running and everyday wear.',
            'price': 180.00,
            'sizes': '7,8,9,10,11,12,13',
            'colors': 'Black,Gray,White,Blue',
            'rating': 4.7,
            'stock': 30,
            'image_url': 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=600&fit=crop'
        },
        {
            'name': 'Puma RS-X³',
            'description': 'Retro-inspired design with modern comfort. Bold colors and premium materials.',
            'price': 120.00,
            'sizes': '7,8,9,10,11,12,13',
            'colors': 'Black,Pink,White,Green',
            'rating': 4.5,
            'stock': 20,
            'image_url': 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&h=600&fit=crop'
        },
        {
            'name': 'New Balance 574',
            'description': 'Classic style meets modern comfort. Iconic design that never goes out of fashion.',
            'price': 90.00,
            'sizes': '7,8,9,10,11,12,13',
            'colors': 'Navy,Black,Gray,White',
            'rating': 4.6,
            'stock': 35,
            'image_url': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop'
        }
    ]

    for product_data in mens_shoes_products:
        image_url = product_data.pop('image_url')
        product = Product.objects.create(
            category=categories['mens-shoes']['obj'],
            gender='men',
            **product_data
        )
        # Download real product image
        img_buffer = download_image(image_url, f"{product.name}")
        # Save to a temporary file first
        from django.core.files.base import ContentFile
        image_content = ContentFile(img_buffer.getvalue(), name=f"{product.name.replace(' ', '_')}.jpg")
        ProductImage.objects.create(
            product=product,
            image=image_content,
            alt_text=f"{product.name} - Men's Shoes",
            is_primary=True
        )
        print(f"Created product: {product.name}")

    # Women's Shoes
    womens_shoes_products = [
        {
            'name': 'Jimmy Choo Romy',
            'description': 'Elegant pointed-toe pumps with crystal embellishments. Perfect for special occasions.',
            'price': 895.00,
            'sizes': '5,6,7,8,9,10',
            'colors': 'Nude,Black,Gold,Silver',
            'rating': 4.9,
            'stock': 15,
            'image_url': 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=600&fit=crop'
        },
        {
            'name': 'Manolo Blahnik Hangisi',
            'description': 'Timeless 100mm stiletto heels. Iconic design with superior craftsmanship.',
            'price': 765.00,
            'sizes': '5,6,7,8,9,10',
            'colors': 'Black,Red,Nude,Silver',
            'rating': 4.8,
            'stock': 12,
            'image_url': 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=600&fit=crop'
        },
        {
            'name': 'Christian Louboutin Pigalle',
            'description': 'Signature red sole with sleek design. The ultimate luxury heel.',
            'price': 995.00,
            'sizes': '5,6,7,8,9,10',
            'colors': 'Black,Red,Nude,White',
            'rating': 4.9,
            'stock': 8,
            'image_url': 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&h=600&fit=crop'
        },
        {
            'name': 'Stuart Weitzman Nudist',
            'description': 'Minimalist slingback with signature stretch fabric. Comfortable elegance.',
            'price': 455.00,
            'sizes': '5,6,7,8,9,10',
            'colors': 'Nude,Black,White,Gold',
            'rating': 4.7,
            'stock': 18,
            'image_url': 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=800&h=600&fit=crop'
        }
    ]

    for product_data in womens_shoes_products:
        image_url = product_data.pop('image_url')
        product = Product.objects.create(
            category=categories['womens-shoes']['obj'],
            gender='women',
            **product_data
        )
        # Download real product image
        img_buffer = download_image(image_url, f"{product.name}")
        from django.core.files.base import ContentFile
        image_content = ContentFile(img_buffer.getvalue(), name=f"{product.name.replace(' ', '_')}.jpg")
        ProductImage.objects.create(
            product=product,
            image=image_content,
            alt_text=f"{product.name} - Women's Shoes",
            is_primary=True
        )
        print(f"Created product: {product.name}")

    # Men's Clothing
    mens_clothing_products = [
        {
            'name': 'Brioni Wool Suit',
            'description': 'Handcrafted Italian wool suit. Superior tailoring with attention to every detail.',
            'price': 4500.00,
            'sizes': '38,40,42,44,46,48',
            'colors': 'Navy,Charcoal,Black,Gray',
            'rating': 4.9,
            'stock': 10,
            'image_url': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop'
        },
        {
            'name': 'Tom Ford Cashmere Sweater',
            'description': 'Ultra-soft cashmere knit. Luxurious comfort with impeccable style.',
            'price': 1200.00,
            'sizes': 'S,M,L,XL,XXL',
            'colors': 'Navy,Gray,Black,White',
            'rating': 4.8,
            'stock': 15,
            'image_url': 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&h=600&fit=crop'
        },
        {
            'name': 'Ralph Lauren Oxford Shirt',
            'description': 'Classic cotton oxford with signature pony embroidery. Timeless elegance.',
            'price': 125.00,
            'sizes': 'S,M,L,XL,XXL',
            'colors': 'White,Light Blue,Blue,Stripe',
            'rating': 4.6,
            'stock': 40,
            'image_url': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=600&fit=crop'
        },
        {
            'name': 'Hugo Boss Tailored Trousers',
            'description': 'Premium wool blend trousers. Perfect fit with modern silhouette.',
            'price': 295.00,
            'sizes': '30,32,34,36,38,40',
            'colors': 'Navy,Gray,Black,Khaki',
            'rating': 4.5,
            'stock': 25,
            'image_url': 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&h=600&fit=crop'
        }
    ]

    for product_data in mens_clothing_products:
        image_url = product_data.pop('image_url')
        product = Product.objects.create(
            category=categories['mens-clothing']['obj'],
            gender='men',
            **product_data
        )
        # Download real product image
        img_buffer = download_image(image_url, f"{product.name}")
        image_content = ContentFile(img_buffer.getvalue(), name=f"{product.name.replace(' ', '_')}.jpg")
        ProductImage.objects.create(
            product=product,
            image=image_content,
            alt_text=f"{product.name} - Men's Clothing",
            is_primary=True
        )
        print(f"Created product: {product.name}")

    # Women's Clothing
    womens_clothing_products = [
        {
            'name': 'Chanel Tweed Jacket',
            'description': 'Iconic quilted tweed with gold chain details. Timeless luxury.',
            'price': 5800.00,
            'sizes': 'XS,S,M,L,XL',
            'colors': 'Black,White,Beige,Pink',
            'rating': 4.9,
            'stock': 8,
            'image_url': 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&h=600&fit=crop'
        },
        {
            'name': 'Dior Bar Suit',
            'description': 'Tailored perfection with signature Bar jacket. Modern elegance.',
            'price': 7200.00,
            'sizes': 'XS,S,M,L,XL',
            'colors': 'Black,Navy,White,Gray',
            'rating': 4.9,
            'stock': 6,
            'image_url': 'https://images.unsplash.com/photo-1583195764036-6dc248ac07d9?w=800&h=600&fit=crop'
        },
        {
            'name': 'Gucci Silk Blouse',
            'description': 'Luxurious silk with GG monogram. Perfect for any occasion.',
            'price': 890.00,
            'sizes': 'XS,S,M,L,XL',
            'colors': 'White,Black,Red,Blue',
            'rating': 4.7,
            'stock': 20,
            'image_url': 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=600&fit=crop'
        },
        {
            'name': 'Prada Cashmere Dress',
            'description': 'Ultra-soft cashmere with minimalist design. Contemporary luxury.',
            'price': 2500.00,
            'sizes': 'XS,S,M,L,XL',
            'colors': 'Black,Gray,Navy,White',
            'rating': 4.8,
            'stock': 12,
            'image_url': 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=600&fit=crop'
        }
    ]

    for product_data in womens_clothing_products:
        image_url = product_data.pop('image_url')
        product = Product.objects.create(
            category=categories['womens-clothing']['obj'],
            gender='women',
            **product_data
        )
        # Download real product image
        img_buffer = download_image(image_url, f"{product.name}")
        image_content = ContentFile(img_buffer.getvalue(), name=f"{product.name.replace(' ', '_')}.jpg")
        ProductImage.objects.create(
            product=product,
            image=image_content,
            alt_text=f"{product.name} - Women's Clothing",
            is_primary=True
        )
        print(f"Created product: {product.name}")

    # Watches
    watches_products = [
        {
            'name': 'Rolex Submariner',
            'description': 'The ultimate luxury dive watch. Ceramic bezel with automatic movement.',
            'price': 8500.00,
            'sizes': '40mm',
            'colors': 'Black,Green,Blue',
            'rating': 4.9,
            'stock': 5,
            'image_url': 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&h=600&fit=crop'
        },
        {
            'name': 'Omega Speedmaster',
            'description': 'The Moonwatch. Legendary chronograph with manual winding movement.',
            'price': 5200.00,
            'sizes': '42mm',
            'colors': 'Black,White,Blue',
            'rating': 4.8,
            'stock': 8,
            'image_url': 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&h=600&fit=crop'
        },
        {
            'name': 'Tag Heuer Carrera',
            'description': 'Sporty elegance with automatic chronograph. Perfect for racing enthusiasts.',
            'price': 3200.00,
            'sizes': '41mm',
            'colors': 'Black,White,Blue',
            'rating': 4.7,
            'stock': 15,
            'image_url': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop'
        },
        {
            'name': 'Seiko Presage',
            'description': 'Japanese craftsmanship with automatic movement. Affordable luxury.',
            'price': 450.00,
            'sizes': '40mm',
            'colors': 'White,Black,Blue',
            'rating': 4.6,
            'stock': 30,
            'image_url': 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=800&h=600&fit=crop'
        }
    ]

    for product_data in watches_products:
        image_url = product_data.pop('image_url')
        product = Product.objects.create(
            category=categories['watches']['obj'],
            gender='unisex',
            **product_data
        )
        # Download real product image
        img_buffer = download_image(image_url, f"{product.name}")
        image_content = ContentFile(img_buffer.getvalue(), name=f"{product.name.replace(' ', '_')}.jpg")
        ProductImage.objects.create(
            product=product,
            image=image_content,
            alt_text=f"{product.name} - Watch",
            is_primary=True
        )
        print(f"Created product: {product.name}")

    # Perfumes
    perfumes_products = [
        {
            'name': 'Chanel No. 5',
            'description': 'The world\'s most famous fragrance. Timeless floral aldehyde scent.',
            'price': 125.00,
            'sizes': '30ml,50ml,100ml',
            'colors': 'Clear',
            'rating': 4.8,
            'stock': 50,
            'image_url': 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&h=600&fit=crop'
        },
        {
            'name': 'Dior Sauvage',
            'description': 'Fresh and spicy masculine fragrance. Perfect for the modern man.',
            'price': 95.00,
            'sizes': '30ml,50ml,100ml',
            'colors': 'Clear',
            'rating': 4.7,
            'stock': 60,
            'image_url': 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=800&h=600&fit=crop'
        },
        {
            'name': 'Gucci Bloom',
            'description': 'Floral and romantic. Inspired by Tuscany\'s flower fields.',
            'price': 110.00,
            'sizes': '30ml,50ml,100ml',
            'colors': 'Clear',
            'rating': 4.6,
            'stock': 45,
            'image_url': 'https://images.unsplash.com/photo-1588405748880-12d1d2a59db9?w=800&h=600&fit=crop'
        },
        {
            'name': 'Tom Ford Oud Wood',
            'description': 'Luxurious oriental fragrance. Rich and sophisticated.',
            'price': 280.00,
            'sizes': '30ml,50ml,100ml',
            'colors': 'Clear',
            'rating': 4.8,
            'stock': 25,
            'image_url': 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&h=600&fit=crop'
        }
    ]

    for product_data in perfumes_products:
        image_url = product_data.pop('image_url')
        product = Product.objects.create(
            category=categories['perfumes']['obj'],
            gender='unisex',
            **product_data
        )
        # Download real product image
        img_buffer = download_image(image_url, f"{product.name}")
        image_content = ContentFile(img_buffer.getvalue(), name=f"{product.name.replace(' ', '_')}.jpg")
        ProductImage.objects.create(
            product=product,
            image=image_content,
            alt_text=f"{product.name} - Perfume",
            is_primary=True
        )
        print(f"Created product: {product.name}")

    # Accessories
    accessories_products = [
        {
            'name': 'Louis Vuitton Neverfull',
            'description': 'Iconic monogram canvas tote. Spacious and stylish.',
            'price': 1850.00,
            'sizes': 'Medium',
            'colors': 'Monogram,Brown,Black',
            'rating': 4.8,
            'stock': 20,
            'image_url': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop'
        },
        {
            'name': 'Hermès Birkin 25',
            'description': 'The ultimate luxury handbag. Crocodile leather with palladium hardware.',
            'price': 12500.00,
            'sizes': '25cm',
            'colors': 'Black,Orange,White',
            'rating': 4.9,
            'stock': 3,
            'image_url': 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=600&fit=crop'
        },
        {
            'name': 'Gucci Marmont Matelassé',
            'description': 'Quilted leather with double-G buckle. Timeless elegance.',
            'price': 2200.00,
            'sizes': 'Medium',
            'colors': 'Black,Red,Beige',
            'rating': 4.7,
            'stock': 15,
            'image_url': 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800&h=600&fit=crop'
        },
        {
            'name': 'Prada Saffiano Leather Belt',
            'description': 'Signature saffiano leather with triangle buckle. Italian craftsmanship.',
            'price': 450.00,
            'sizes': '32,34,36,38,40,42',
            'colors': 'Black,Brown,White',
            'rating': 4.6,
            'stock': 35,
            'image_url': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop'
        }
    ]

    for product_data in accessories_products:
        image_url = product_data.pop('image_url')
        product = Product.objects.create(
            category=categories['accessories']['obj'],
            gender='unisex',
            **product_data
        )
        # Download real product image
        img_buffer = download_image(image_url, f"{product.name}")
        image_content = ContentFile(img_buffer.getvalue(), name=f"{product.name.replace(' ', '_')}.jpg")
        ProductImage.objects.create(
            product=product,
            image=image_content,
            alt_text=f"{product.name} - Accessory",
            is_primary=True
        )
        print(f"Created product: {product.name}")

    # Ensure product.image is set from the first available ProductImage for every product
    print("Linking primary images to products...")
    products_without_image = Product.objects.filter(image__isnull=True) | Product.objects.filter(image='')
    for product in products_without_image:
        primary_image = product.images.filter(is_primary=True).order_by('order').first()
        if primary_image:
            product.image = primary_image.image
            product.save()

    print("Sample data created successfully!")
    print(f"Created {Category.objects.count()} categories, {Product.objects.count()} products, and {ProductImage.objects.count()} images")

if __name__ == '__main__':
    create_sample_data()
