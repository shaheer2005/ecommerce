from django.db.models import Q, Avg
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Product, Category, ProductImage
from .serializers import ProductSerializer, CategorySerializer, ProductImageUploadSerializer, ProductReviewSerializer


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'rating', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Product.objects.all()

        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__slug=category)

        # Filter by gender
        gender = self.request.query_params.get('gender')
        if gender:
            queryset = queryset.filter(gender=gender)

        # Filter by price range
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        # Filter by size
        size = self.request.query_params.get('size')
        if size:
            queryset = queryset.filter(sizes__icontains=size)

        # Filter by color
        color = self.request.query_params.get('color')
        if color:
            queryset = queryset.filter(colors__icontains=color)

        # Filter in stock
        in_stock = self.request.query_params.get('in_stock')
        if in_stock and in_stock.lower() == 'true':
            queryset = queryset.filter(stock__gt=0)

        return queryset

    @action(detail=True, methods=['get','post'], permission_classes=[permissions.IsAuthenticatedOrReadOnly])
    def reviews(self, request, pk=None):
        """Get or add reviews for a product"""
        product = self.get_object()

        if request.method == 'GET':
            reviews = product.reviews.order_by('-created_at')
            serializer = ProductReviewSerializer(reviews, many=True)
            return Response(serializer.data)

        serializer = ProductReviewSerializer(data=request.data)
        if serializer.is_valid():
            try:
                serializer.save(product=product, user=request.user)
            except Exception as e:
                return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            self._update_product_rating(product)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def _update_product_rating(self, product):
        average = product.reviews.aggregate(avg_rating=Avg('rating'))['avg_rating'] or 0
        product.rating = round(average, 2)
        product.save(update_fields=['rating'])

    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny])
    def related(self, request, pk=None):
        """Return related products from the same category."""
        product = self.get_object()
        related_queryset = Product.objects.filter(
            category=product.category
        ).exclude(pk=product.pk).order_by('-created_at')[:4]
        serializer = ProductSerializer(related_queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], parser_classes=(MultiPartParser, FormParser))
    def upload_image(self, request, pk=None):
        """Upload image(s) for a product"""
        product = self.get_object()
        
        # Check permission
        if not request.user.is_staff:
            return Response(
                {"detail": "Only staff can upload images."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        files = request.FILES.getlist('images')
        alt_text = request.data.get('alt_text', '')
        is_primary = request.data.get('is_primary', False)
        
        if not files:
            return Response(
                {"detail": "No images provided."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        uploaded_images = []
        for file in files:
            product_image = ProductImage.objects.create(
                product=product,
                image=file,
                alt_text=alt_text,
                is_primary=is_primary
            )
            uploaded_images.append(ProductImageUploadSerializer(product_image).data)
        
        return Response(
            {"detail": f"{len(uploaded_images)} image(s) uploaded.", "images": uploaded_images},
            status=status.HTTP_201_CREATED
        )
