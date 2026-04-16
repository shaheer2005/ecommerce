import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within WishlistProvider');
    }
    return context;
};

export const WishlistProvider = ({ children }) => {
    const { token } = useAuth();
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const saveLocalWishlist = (items) => {
        try {
            localStorage.setItem('wishlist', JSON.stringify(items));
        } catch (error) {
            console.error('Failed to save wishlist:', error);
        }
    };

    const loadLocalWishlist = () => {
        try {
            const saved = localStorage.getItem('wishlist');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Failed to load wishlist:', error);
            return [];
        }
    };

    const fetchBackendWishlist = useCallback(async () => {
        if (!token) return null;
        try {
            const response = await fetch('http://localhost:8000/api/cart/wishlist/view/', {
                headers: {
                    'Authorization': `Token ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to load wishlist: ${response.status}`);
            }

            const data = await response.json();
            const backendProducts = (data.products || []).map(item => item.product || item);
            setWishlistItems(backendProducts);
            saveLocalWishlist(backendProducts);
            return backendProducts;
        } catch (error) {
            console.error('Error loading wishlist from backend:', error);
            return null;
        }
    }, [token]);

    const syncLocalWishlistToBackend = useCallback(async (localItems) => {
        if (!token || !localItems.length) {
            return await fetchBackendWishlist();
        }

        try {
            const backendItems = await fetchBackendWishlist();
            const backendIds = new Set((backendItems || []).map(product => product.id));

            for (const product of localItems) {
                if (!backendIds.has(product.id)) {
                    await fetch('http://localhost:8000/api/cart/wishlist/add_item/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Token ${token}`
                        },
                        body: JSON.stringify({ product_id: product.id })
                    });
                }
            }

            return await fetchBackendWishlist();
        } catch (error) {
            console.error('Error syncing local wishlist to backend:', error);
            return null;
        }
    }, [token, fetchBackendWishlist]);

    useEffect(() => {
        const initialize = async () => {
            const localItems = loadLocalWishlist();

            if (token) {
                const backendItems = await syncLocalWishlistToBackend(localItems);
                if (backendItems) {
                    setWishlistItems(backendItems);
                } else {
                    setWishlistItems(localItems);
                }
            } else {
                setWishlistItems(localItems);
            }

            setLoading(false);
        };

        initialize();
    }, [token, syncLocalWishlistToBackend]);

    useEffect(() => {
        if (!loading) {
            saveLocalWishlist(wishlistItems);
        }
    }, [wishlistItems, loading]);

    const addToWishlist = async (product) => {
        if (wishlistItems.some(item => item.id === product.id)) {
            return;
        }

        if (token) {
            try {
                const response = await fetch('http://localhost:8000/api/cart/wishlist/add_item/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Token ${token}`
                    },
                    body: JSON.stringify({ product_id: product.id })
                });

                if (response.ok) {
                    const data = await response.json();
                    const savedProduct = data.product || product;
                    setWishlistItems(prev => [...prev, savedProduct]);
                    return;
                }
            } catch (error) {
                console.error('Error adding to wishlist backend:', error);
            }
        }

        setWishlistItems(prev => [...prev, product]);
    };

    const removeFromWishlist = async (productId) => {
        if (token) {
            try {
                await fetch('http://localhost:8000/api/cart/wishlist/remove_item/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Token ${token}`
                    },
                    body: JSON.stringify({ product_id: productId })
                });
            } catch (error) {
                console.error('Error removing wishlist item from backend:', error);
            }
        }

        setWishlistItems(prev => prev.filter(item => item.id !== productId));
    };

    const isInWishlist = (productId) => {
        return wishlistItems.some(item => item.id === productId);
    };

    const getTotalWishlistItems = () => {
        return wishlistItems.length;
    };

    const clearWishlist = () => {
        setWishlistItems([]);
    };

    const toggleWishlist = async (product) => {
        if (isInWishlist(product.id)) {
            await removeFromWishlist(product.id);
        } else {
            await addToWishlist(product);
        }
    };

    return (
        <WishlistContext.Provider value={{
            wishlistItems,
            addToWishlist,
            removeFromWishlist,
            isInWishlist,
            getTotalWishlistItems,
            clearWishlist,
            toggleWishlist,
            loading
        }}>
            {children}
        </WishlistContext.Provider>
    );
};