import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { addToast } = useToast();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [activeImage, setActiveImage] = useState('');
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [relatedLoading, setRelatedLoading] = useState(false);
    const [relatedError, setRelatedError] = useState(null);

    const resolveImageUrl = (imageUrl) => {
        if (!imageUrl) return null;
        return imageUrl.startsWith('http') ? imageUrl : `http://localhost:8000${imageUrl}`;
    };

    const fetchProduct = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:8000/api/catalog/products/${id}/`);
            if (!response.ok) {
                throw new Error('Unable to load product details.');
            }
            const data = await response.json();
            setProduct(data);
            setActiveImage(resolveImageUrl(data.image || data.images?.[0]?.image));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchProduct();
    }, [fetchProduct]);

    useEffect(() => {
        if (product) {
            setActiveImage(resolveImageUrl(product.image || product.images?.[0]?.image));
        }
    }, [product]);

    useEffect(() => {
        if (product) {
            document.title = `${product.name} | E-Shop Deluxe`;
            const metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
                metaDescription.setAttribute('content', product.description || `Buy ${product.name} on E-Shop Deluxe.`);
            }
        }
    }, [product]);

    useEffect(() => {
        const fetchRelatedProducts = async () => {
            if (!product) {
                return;
            }

            setRelatedLoading(true);
            setRelatedError(null);
            try {
                const response = await fetch(`http://localhost:8000/api/catalog/products/${product.id}/related/`);
                if (!response.ok) {
                    throw new Error('Unable to load related products.');
                }
                const data = await response.json();
                setRelatedProducts(data);
            } catch (err) {
                setRelatedError(err.message);
            } finally {
                setRelatedLoading(false);
            }
        };

        fetchRelatedProducts();
    }, [product]);

    const handleAddToCart = async () => {
        if (!token) {
            addToast('Please login to add items to your cart.', 'warning');
            navigate('/login');
            return;
        }

        addToCart(product, quantity, selectedSize, selectedColor);
        addToast('Added to cart.', 'success');
    };

    const handleToggleWishlist = async () => {
        if (!token) {
            addToast('Please login to manage your wishlist.', 'warning');
            navigate('/login');
            return;
        }

        await toggleWishlist(product);
        addToast(isInWishlist(product.id) ? 'Removed from wishlist.' : 'Added to wishlist.', 'success');
    };

    const renderStars = (value) => (
        <div className="flex text-yellow-400">
            {Array.from({ length: 5 }).map((_, index) => (
                <span key={index} className={index < Math.round(value || 0) ? 'text-yellow-400' : 'text-gray-600'}>
                    ★
                </span>
            ))}
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                    <p>Loading product...</p>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900 text-white flex items-center justify-center px-4">
                <div className="max-w-xl text-center rounded-3xl border border-red-500/20 bg-slate-950/80 p-10">
                    <p className="text-red-400 text-lg mb-4">{error || 'Product not found.'}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 rounded-full bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition"
                    >
                        Back to Shop
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900 text-white">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
                    animate={{ y: [0, 50, 0] }}
                    transition={{ duration: 8, repeat: Infinity }}
                />
            </div>

            <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between mb-10">
                    <div>
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-slate-950/70 px-4 py-2 text-sm text-cyan-300 hover:bg-cyan-500/10 transition"
                        >
                            ← Back to Shop
                        </Link>
                        <h1 className="mt-6 text-5xl font-bold text-white">{product.name}</h1>
                        <p className="mt-3 text-gray-400 max-w-2xl">{product.category_name || 'Shop our curated collection'}</p>
                    </div>
                    <div className="flex flex-wrap gap-3 items-center">
                        <button
                            onClick={handleToggleWishlist}
                            className="rounded-full border border-white/10 bg-slate-950/80 px-5 py-3 text-sm font-semibold text-white hover:border-cyan-500/40 hover:bg-cyan-500/10 transition"
                        >
                            {isInWishlist(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                        </button>
                        <Link
                            to={`/product/${product.id}/reviews`}
                            className="rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition"
                        >
                            View Reviews
                        </Link>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
                    <div className="space-y-6">
                        <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
                            {activeImage ? (
                                <img
                                    src={activeImage}
                                    alt={product.name}
                                    className="w-full rounded-3xl object-cover max-h-[520px]"
                                    loading="lazy"
                                    decoding="async"
                                />
                            ) : (
                                <div className="h-[520px] rounded-3xl bg-slate-900/50 flex items-center justify-center text-gray-500 text-4xl">
                                    No Image
                                </div>
                            )}

                            {product.images && product.images.length > 1 && (
                                <div className="mt-4 grid grid-cols-5 gap-3">
                                    {[product.image, ...product.images.map(img => img.image)]
                                        .filter(Boolean)
                                        .map((imageSrc, index) => {
                                            const url = resolveImageUrl(imageSrc);
                                            return (
                                                <button
                                                    key={`${imageSrc}-${index}`}
                                                    type="button"
                                                    onClick={() => setActiveImage(url)}
                                                    className={`rounded-3xl overflow-hidden border ${activeImage === url ? 'border-cyan-400' : 'border-white/10'} transition`}
                                                >
                                                    <img src={url} alt={`${product.name} ${index + 1}`} className="h-20 w-full object-cover" />
                                                </button>
                                            );
                                        })}
                                </div>
                            )}
                        </div>

                        <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
                            <div className="flex flex-wrap items-center gap-4 mb-4">
                                {renderStars(product.rating)}
                                <span className="text-sm text-gray-300">
                                    {product.rating ? parseFloat(product.rating).toFixed(1) : 'New'} · {product.review_count ?? 0} review{(product.review_count ?? 0) === 1 ? '' : 's'}
                                </span>
                            </div>
                            <h2 className="text-2xl font-semibold text-white mb-3">Product Details</h2>
                            <p className="text-gray-300 leading-relaxed whitespace-pre-line">{product.description || 'A premium product built for style and comfort.'}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Price</p>
                                    <p className="text-4xl font-bold text-white mt-2">${parseFloat(product.price).toFixed(2)}</p>
                                </div>
                                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${product.stock > 0 ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'}`}>
                                    {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                                </span>
                            </div>

                            {product.sizes_list?.length > 0 && (
                                <div className="mb-6">
                                    <p className="text-sm font-semibold text-gray-300 mb-3">Choose a size</p>
                                    <div className="flex flex-wrap gap-3">
                                        {product.sizes_list.map((size) => (
                                            <button
                                                key={size}
                                                type="button"
                                                onClick={() => setSelectedSize(selectedSize === size ? '' : size)}
                                                className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${selectedSize === size ? 'border-cyan-400 bg-cyan-500/10 text-white' : 'border-white/10 bg-slate-900 text-gray-300 hover:border-cyan-500/40'}`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {product.colors_list?.length > 0 && (
                                <div className="mb-6">
                                    <p className="text-sm font-semibold text-gray-300 mb-3">Choose a color</p>
                                    <div className="flex flex-wrap gap-3">
                                        {product.colors_list.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setSelectedColor(selectedColor === color ? '' : color)}
                                                className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${selectedColor === color ? 'border-cyan-400 bg-cyan-500/10 text-white' : 'border-white/10 bg-slate-900 text-gray-300 hover:border-cyan-500/40'}`}
                                            >
                                                {color}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mb-6">
                                <p className="text-sm font-semibold text-gray-300 mb-3">Quantity</p>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white"
                                    >
                                        −
                                    </button>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                                        className="w-20 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-center text-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleAddToCart}
                                disabled={product.stock <= 0}
                                className="w-full rounded-3xl bg-gradient-to-r from-purple-600 to-cyan-500 px-6 py-4 text-lg font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {product.stock > 0 ? 'Add to Cart' : 'Out of stock'}
                            </button>
                        </div>

                        <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
                            <h3 className="text-xl font-semibold text-white mb-4">Why customers love this</h3>
                            <ul className="space-y-3 text-gray-300 text-sm">
                                <li>• Smooth checkout with saved carts and wishlist sync.</li>
                                <li>• Built-in review page for every product.</li>
                                <li>• Fast browsing with category filters and product search.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <section className="mt-10">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-3xl font-semibold text-white">Related Products</h2>
                        {relatedLoading && <span className="text-sm text-gray-400">Loading...</span>}
                    </div>

                    {relatedError ? (
                        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
                            {relatedError}
                        </div>
                    ) : relatedProducts.length === 0 ? (
                        <p className="text-gray-400">No related products available at the moment.</p>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {relatedProducts.map((related) => (
                                <Link
                                    key={related.id}
                                    to={`/product/${related.id}`}
                                    className="group rounded-3xl border border-white/10 bg-slate-950/80 p-5 transition hover:border-cyan-500/30"
                                >
                                    <div className="h-48 overflow-hidden rounded-3xl bg-slate-900 mb-4">
                                        <img
                                            src={related.image ? (related.image.startsWith('http') ? related.image : `http://localhost:8000${related.image}`) : 'https://via.placeholder.com/350x350?text=No+Image'}
                                            alt={related.name}
                                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-2">{related.name}</h3>
                                        <p className="text-sm text-gray-400 mb-3">{related.category_name}</p>
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-lg font-semibold text-white">${parseFloat(related.price).toFixed(2)}</span>
                                            <span className={`text-xs font-semibold uppercase ${related.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {related.stock > 0 ? 'In stock' : 'Out of stock'}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default ProductDetail;
