import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const { token } = useAuth();
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            try {
                const parsed = JSON.parse(savedCart);
                if (Array.isArray(parsed)) {
                    const normalized = parsed.map(item => {
                        if (item.product) {
                            return item;
                        }
                        return {
                            product: {
                                id: item.id,
                                name: item.name,
                                price: item.price,
                                image: item.image,
                                description: item.description || ''
                            },
                            quantity: item.quantity,
                            size: item.size,
                            color: item.color
                        };
                    });
                    setCartItems(normalized);
                }
            } catch (error) {
                console.error('Error loading cart:', error);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const normalizeCartItems = (items) => {
        return items.map(item => ({
            ...item,
            product: {
                ...item.product,
                price: Number(item.product?.price || 0),
                image: item.product?.image || '',
                description: item.product?.description || ''
            }
        }));
    };

    const fetchCartFromBackend = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/cart/view/', {
                headers: {
                    'Authorization': `Token ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setCartItems(normalizeCartItems(data.items || []));
            }
        } catch (error) {
            console.error('Error fetching cart from backend:', error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchCartFromBackend();
        }
    }, [token, fetchCartFromBackend]);

    const addToCart = async (product, quantity = 1, size = '', color = '') => {
        const existingItem = cartItems.find(
            item => item.product.id === product.id && item.size === size && item.color === color
        );
        const addedAsNewItem = !existingItem;

        setCartItems(prevItems => {
            const currentItem = prevItems.find(
                item => item.product.id === product.id && item.size === size && item.color === color
            );

            if (currentItem) {
                return prevItems.map(item =>
                    item.product.id === product.id && item.size === size && item.color === color ?
                        { ...item, quantity: item.quantity + quantity } :
                        item
                );
            }

            return [
                ...prevItems,
                {
                    product: {
                        id: product.id,
                        name: product.name,
                        price: Number(product.price || 0),
                        image: product.image,
                        description: product.description || ''
                    },
                    quantity,
                    size,
                    color
                }
            ];
        });

        if (token) {
            try {
                const response = await fetch('http://localhost:8000/api/cart/add_item/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Token ${token}`
                    },
                    body: JSON.stringify({
                        product_id: product.id,
                        quantity,
                        size,
                        color
                    })
                });

                if (!response.ok) {
                    console.error('Failed to add item to backend cart');
                    setCartItems(prevItems => prevItems.map(item => {
                        if (item.product.id !== product.id || item.size !== size || item.color !== color) {
                            return item;
                        }

                        if (!existingItem) {
                            return null;
                        }

                        const adjustedQuantity = item.quantity - quantity;
                        if (adjustedQuantity <= 0) {
                            return null;
                        }

                        return { ...item, quantity: adjustedQuantity };
                    }).filter(Boolean));
                }
            } catch (error) {
                console.error('Error adding to backend cart:', error);
                setCartItems(prevItems => prevItems.filter(item => {
                    if (item.product.id !== product.id || item.size !== size || item.color !== color) {
                        return true;
                    }
                    return !addedAsNewItem;
                }));
            }
        }
    };

    const removeFromCart = async (productId, size = '', color = '') => {
        const itemToRemove = cartItems.find(
            item => item.product.id === productId && item.size === size && item.color === color
        );

        setCartItems(prevItems =>
            prevItems.filter(item =>
                !(item.product.id === productId && item.size === size && item.color === color)
            )
        );

        if (token && itemToRemove) {
            try {
                const cartResponse = await fetch('http://localhost:8000/api/cart/view/', {
                    headers: {
                        'Authorization': `Token ${token}`
                    }
                });
                if (cartResponse.ok) {
                    const cartData = await cartResponse.json();
                    const backendItem = cartData.items.find(
                        item => item.product.id === productId && item.size === size && item.color === color
                    );
                    if (backendItem) {
                        await fetch('http://localhost:8000/api/cart/remove_item/', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Token ${token}`
                            },
                            body: JSON.stringify({
                                item_id: backendItem.id
                            })
                        });
                    }
                }
            } catch (error) {
                console.error('Error removing from backend cart:', error);
            }
        }
    };

    const updateQuantity = async (productId, quantity, size = '', color = '') => {
        if (quantity <= 0) {
            removeFromCart(productId, size, color);
            return;
        }

        setCartItems(prevItems =>
            prevItems.map(item =>
                item.product.id === productId && item.size === size && item.color === color ?
                    { ...item, quantity } :
                    item
            )
        );

        if (token) {
            try {
                const cartResponse = await fetch('http://localhost:8000/api/cart/view/', {
                    headers: {
                        'Authorization': `Token ${token}`
                    }
                });
                if (cartResponse.ok) {
                    const cartData = await cartResponse.json();
                    const backendItem = cartData.items.find(
                        item => item.product.id === productId && item.size === size && item.color === color
                    );
                    if (backendItem) {
                        await fetch('http://localhost:8000/api/cart/update_quantity/', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Token ${token}`
                            },
                            body: JSON.stringify({
                                item_id: backendItem.id,
                                quantity
                            })
                        });
                    }
                }
            } catch (error) {
                console.error('Error updating backend cart:', error);
            }
        }
    };

    const clearCart = async () => {
        setCartItems([]);

        if (token) {
            try {
                await fetch('http://localhost:8000/api/cart/clear/', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Token ${token}`
                    }
                });
            } catch (error) {
                console.error('Error clearing backend cart:', error);
            }
        }
    };

    const getTotalPrice = () => {
        return cartItems.reduce((total, item) => {
            const price = Number(item.product?.price || 0);
            return total + (price * item.quantity);
        }, 0);
    };

    const getTotalItems = () => {
        return cartItems.reduce((total, item) => total + item.quantity, 0);
    };

    return (
        <CartContext.Provider
            value={{
                cartItems,
                loading,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                getTotalPrice,
                getTotalItems,
                itemCount: cartItems.length
            }}
        >
            {children}
        </CartContext.Provider>
    );
};