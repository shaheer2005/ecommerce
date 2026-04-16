from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from PIL import Image
import os


def validate_image_file(file):
    """Validate image file size and format"""
    # Check file size (10MB max)
    if file.size > 10485760:  # 10MB
        raise ValidationError('File size must not exceed 10MB.')
    
    # Check file format
    allowed_formats = ['jpeg', 'jpg', 'png', 'webp']
    file_ext = os.path.splitext(file.name)[1][1:].lower()
    if file_ext not in allowed_formats:
        raise ValidationError(f'File format not allowed. Allowed: {', '.join(allowed_formats)}')


def product_image_upload(instance, filename):
    """Upload path: media/products/<product_id>/images/<filename>"""
    return f"products/{instance.product.id}/images/{filename}"


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True, validators=[validate_image_file])

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name


class Product(models.Model):
    GENDER_CHOICES = [
        ('men', 'Men'),
        ('women', 'Women'),
        ('unisex', 'Unisex'),
    ]

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='unisex')
    price = models.DecimalField(max_digits=8, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    image = models.ImageField(upload_to=product_image_upload, blank=True, null=True, validators=[validate_image_file])
    sizes = models.CharField(max_length=200, blank=True, help_text="Comma-separated sizes (e.g., S,M,L,XL)")
    colors = models.CharField(max_length=200, blank=True, help_text="Comma-separated colors (e.g., Red,Blue,Black)")
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['category']),
            models.Index(fields=['gender']),
            models.Index(fields=['price']),
        ]

    def __str__(self):
        return self.name


class ProductImage(models.Model):
    """Multiple images per product for gallery"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to=product_image_upload, validators=[validate_image_file])
    alt_text = models.CharField(max_length=255, blank=True)
    is_primary = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'uploaded_at']

    def __str__(self):
        return f"{self.product.name} - Image {self.order}"

    def save(self, *args, **kwargs):
        """Optimize image on save"""
        if self.image:
            # Open image and optimize
            img = Image.open(self.image)
            # Resize if too large (max 1200px width)
            if img.width > 1200:
                ratio = 1200 / img.width
                new_height = int(img.height * ratio)
                img = img.resize((1200, new_height), Image.Resampling.LANCZOS)
            # Convert to RGB if necessary (for JPEG compatibility)
            if img.mode in ('RGBA', 'LA', 'P'):
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                rgb_img.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = rgb_img
            # Save optimized image
            img.save(self.image.path, quality=85, optimize=True)
        super().save(*args, **kwargs)


class ProductReview(models.Model):
    """Customer reviews for products"""
    RATING_CHOICES = [(i, str(i)) for i in range(1, 6)]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='product_reviews')
    rating = models.PositiveSmallIntegerField(choices=RATING_CHOICES)
    title = models.CharField(max_length=200, blank=True)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('product', 'user')

    def __str__(self):
        return f"{self.product.name} review by {self.user.username}"
