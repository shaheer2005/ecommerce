from rest_framework import viewsets, views, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from .models import Cart, CartItem, Wishlist, WishlistItem
from catalog.models import Product
from .serializers import CartSerializer, CartItemSerializer, WishlistSerializer, WishlistItemSerializer


class CartViewSet(viewsets.ViewSet):
    """Cart management endpoints"""
    permission_classes = [permissions.IsAuthenticated]

    def get_cart(self, user):
        """Get or create cart for user"""
        cart, _ = Cart.objects.get_or_create(user=user)
        return cart

    @action(detail=False, methods=['get'])
    def view(self, request):
        """Get user's cart"""
        cart = self.get_cart(request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def add_item(self, request):
        """Add item to cart"""
        cart = self.get_cart(request.user)
        product_id = request.data.get('product_id')
        quantity = request.data.get('quantity', 1)
        size = request.data.get('size', '')
        color = request.data.get('color', '')

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check stock
        if product.stock < quantity:
            return Response(
                {"error": f"Not enough stock. Available: {product.stock}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Add or update item in cart
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            size=size,
            color=color,
            defaults={'quantity': quantity}
        )

        if not created:
            # Update quantity if item already in cart
            cart_item.quantity += quantity
            if cart_item.quantity > product.stock:
                cart_item.quantity = product.stock
            cart_item.save()

        serializer = CartItemSerializer(cart_item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def remove_item(self, request):
        """Remove item from cart"""
        cart = self.get_cart(request.user)
        item_id = request.data.get('item_id')

        try:
            item = CartItem.objects.get(id=item_id, cart=cart)
            item.delete()
            return Response(
                {"detail": "Item removed from cart."},
                status=status.HTTP_200_OK
            )
        except CartItem.DoesNotExist:
            return Response(
                {"error": "Item not found in cart."},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['post'])
    def update_quantity(self, request):
        """Update item quantity in cart"""
        cart = self.get_cart(request.user)
        item_id = request.data.get('item_id')
        quantity = request.data.get('quantity', 1)

        try:
            item = CartItem.objects.get(id=item_id, cart=cart)
            
            # Check stock
            if item.product.stock < quantity:
                return Response(
                    {"error": f"Not enough stock. Available: {item.product.stock}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            item.quantity = quantity
            item.save()
            serializer = CartItemSerializer(item)
            return Response(serializer.data)
        except CartItem.DoesNotExist:
            return Response(
                {"error": "Item not found in cart."},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['post'])
    def clear(self, request):
        """Clear entire cart"""
        cart = self.get_cart(request.user)
        cart.items.all().delete()
        return Response(
            {"detail": "Cart cleared."},
            status=status.HTTP_200_OK
        )


class WishlistViewSet(viewsets.ViewSet):
    """Wishlist management endpoints"""
    permission_classes = [permissions.IsAuthenticated]

    def get_wishlist(self, user):
        """Get or create wishlist for user"""
        wishlist, _ = Wishlist.objects.get_or_create(user=user)
        return wishlist

    @action(detail=False, methods=['get'])
    def view(self, request):
        """Get user's wishlist"""
        wishlist = self.get_wishlist(request.user)
        serializer = WishlistSerializer(wishlist)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def add_item(self, request):
        """Add product to wishlist"""
        wishlist = self.get_wishlist(request.user)
        product_id = request.data.get('product_id')

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        wishlist_item, created = WishlistItem.objects.get_or_create(
            wishlist=wishlist,
            product=product
        )

        if created:
            serializer = WishlistItemSerializer(wishlist_item)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(
                {"detail": "Product already in wishlist."},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def remove_item(self, request):
        """Remove product from wishlist"""
        wishlist = self.get_wishlist(request.user)
        product_id = request.data.get('product_id')

        try:
            item = WishlistItem.objects.get(wishlist=wishlist, product_id=product_id)
            item.delete()
            return Response(
                {"detail": "Product removed from wishlist."},
                status=status.HTTP_200_OK
            )
        except WishlistItem.DoesNotExist:
            return Response(
                {"error": "Product not in wishlist."},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['post'])
    def clear(self, request):
        """Clear entire wishlist"""
        wishlist = self.get_wishlist(request.user)
        wishlist.wishlistitem_set.all().delete()
        return Response(
            {"detail": "Wishlist cleared."},
            status=status.HTTP_200_OK
        )
