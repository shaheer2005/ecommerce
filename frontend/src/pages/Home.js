import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, Link } from 'react-router-dom';

const Home = () => {
    const { isAuthenticated } = useAuth();
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [priceRange] = useState({ min: '', max: '' });
    const [selectedGender] = useState('');
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [inStockOnly] = useState(false);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [quantity, setQuantity] = useState(1);
    const [selectedProduct, setSelectedProduct] = useState(null);

    useEffect(() => {
        document.title = 'E-Shop Deluxe | Discover Excellence';
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', 'Shop curated clothing and accessories with fast checkout, wishlist sync, and product reviews on E-Shop Deluxe.');
        }
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/catalog/categories/');
            if (response.ok) {
                const data = await response.json();
                setCategories(data.results || data);
            }
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    const fetchProducts = useCallback(async () => {
        console.log('fetchProducts: starting');
        setError(null);
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedCategory) params.append('category', selectedCategory);
            if (selectedGender) params.append('gender', selectedGender);
            if (priceRange.min) params.append('min_price', priceRange.min);
            if (priceRange.max) params.append('max_price', priceRange.max);
            if (selectedSize) params.append('size', selectedSize);
            if (selectedColor) params.append('color', selectedColor);
            if (inStockOnly) params.append('in_stock', 'true');

            const url = `http://localhost:8000/api/catalog/products/?${params.toString()}`;
            console.log('Fetching products from:', url);

            const response = await fetch(url);
            console.log('fetchProducts: got response', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('fetchProducts: json', data);
                setProducts(data.results || data);
                setLoading(false);
            } else {
                const errText = await response.text();
                console.log('fetchProducts: server error', response.status, errText);
                setError(`Server error: ${response.status} ${errText}`);
                setLoading(false);
            }
        } catch (err) {
            console.error('fetchProducts: network error', err);
            setError(err.message);
            setLoading(false);
        }
    }, [selectedCategory, selectedGender, priceRange, selectedSize, selectedColor, inStockOnly]);

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const filteredProducts = products
        .filter(p => p.name.toLowerCase().includes(filter.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'price-low') return a.price - b.price;
            if (sortBy === 'price-high') return b.price - a.price;
            if (sortBy === 'rating') return b.rating - a.rating;
            if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
            return a.name.localeCompare(b.name);
        });

    const handleAddToCart = (product) => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        addToCart(product, quantity, selectedSize, selectedColor);
        addToast(`${product.name} added to cart!`, 'success');
        setSelectedProduct(null);
        setQuantity(1);
        setSelectedSize('');
        setSelectedColor('');
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: 'easeOut' }
        }
    };

    const resolveImageUrl = (imageUrl) => {
        if (!imageUrl) return null;
        return imageUrl.startsWith('http') ? imageUrl : `http://localhost:8000${imageUrl}`;
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
                    animate={{ y: [0, 50, 0], x: [0, 30, 0] }}
                    transition={{ duration: 8, repeat: Infinity }}
                />
                <motion.div
                    className="absolute top-40 right-10 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
                    animate={{ y: [0, -50, 0], x: [0, -30, 0] }}
                    transition={{ duration: 8, repeat: Infinity }}
                />
            </div>

            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <h2 className="text-5xl md:text-6xl font-bold mb-4">
                        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                            Discover Excellence
                        </span>
                    </h2>
                    <p className="text-xl text-gray-300">Curated collection of premium products</p>
                </motion.div>

                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                >
                    <div className="flex flex-wrap justify-center gap-4">
                        <button
                            onClick={() => setSelectedCategory('')}
                            className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                                selectedCategory === ''
                                    ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg shadow-purple-500/50'
                                    : 'bg-slate-800/50 text-gray-300 hover:bg-slate-700/50 hover:text-white'
                            }`}
                        >
                            All Products
                        </button>
                        {categories.map(category => (
                            <button
                                key={category.slug}
                                onClick={() => setSelectedCategory(category.slug)}
                                className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                                    selectedCategory === category.slug
                                        ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg shadow-purple-500/50'
                                        : 'bg-slate-800/50 text-gray-300 hover:bg-slate-700/50 hover:text-white'
                                }`}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    className="mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:space-x-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="flex-1 px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    >
                        <option value="name">Sort by Name</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                    </select>
                </motion.div>

                {loading && (
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {[...Array(8)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="h-80 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-2xl overflow-hidden border border-purple-500/20 animate-pulse"
                                variants={itemVariants}
                            />
                        ))}
                    </motion.div>
                )}

                {error && !loading && (
                    <motion.div className="text-center py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <p className="text-red-400 text-lg">{error}</p>
                    </motion.div>
                )}

                {!loading && !error && (
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {filteredProducts.map(product => (
                            <motion.div
                                key={product.id}
                                className="group cursor-pointer"
                                variants={itemVariants}
                                whileHover={{ y: -10 }}
                                onClick={() => setSelectedProduct(product)}
                            >
                                <div className="relative h-64 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-2xl overflow-hidden border border-purple-500/30 group-hover:border-cyan-500/50 transition-all duration-300 mb-4">
                                    {resolveImageUrl(product.image || product.images?.[0]?.image) ? (
                                        <motion.img
                                            src={resolveImageUrl(product.image || product.images?.[0]?.image)}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                            decoding="async"
                                            whileHover={{ scale: 1.1 }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-5xl">
                                            🖼️
                                        </div>
                                    )}

                                    {product.stock > 0 ? (
                                        <div className="absolute top-3 left-3 px-2 py-1 bg-green-500/90 text-white text-xs font-bold rounded-full">
                                            In Stock
                                        </div>
                                    ) : (
                                        <div className="absolute top-3 left-3 px-2 py-1 bg-red-500/90 text-white text-xs font-bold rounded-full">
                                            Out of Stock
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors mb-2">
                                    {product.name}
                                </h3>

                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {renderStars(product.rating)}
                                        <span className="text-gray-400 text-sm">
                                            {product.rating ? parseFloat(product.rating).toFixed(1) : '—'} · {product.review_count ?? 0} review{(product.review_count ?? 0) === 1 ? '' : 's'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-2xl font-bold text-white">${parseFloat(product.price).toFixed(2)}</span>
                                    <button
                                        className="px-4 py-2 bg-purple-600/80 rounded-full text-white hover:bg-purple-500 transition"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/product/${product.id}`);
                                        }}
                                    >
                                        View
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {!loading && !error && filteredProducts.length === 0 && (
                    <motion.div className="text-center py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <p className="text-gray-400 text-lg">No products found</p>
                    </motion.div>
                )}

                {selectedProduct && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedProduct(null)}
                    >
                        <motion.div
                            className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl p-8 max-w-2xl w-full border border-purple-500/30 max-h-[80vh] overflow-y-auto"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex flex-col gap-4 justify-between items-start md:flex-row md:items-center mb-6">
                                <div>
                                    <h2 className="text-3xl font-bold text-white">{selectedProduct.name}</h2>
                                    <div className="mt-2 flex items-center gap-3 text-sm text-gray-400">
                                        {renderStars(selectedProduct.rating)}
                                        <span>{selectedProduct.rating ? parseFloat(selectedProduct.rating).toFixed(1) : '—'}</span>
                                        <span>·</span>
                                        <span>{selectedProduct.review_count ?? 0} review{(selectedProduct.review_count ?? 0) === 1 ? '' : 's'}</span>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <Link
                                        to={`/product/${selectedProduct.id}/reviews`}
                                        className="inline-flex items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20 transition"
                                    >
                                        View Reviews
                                    </Link>
                                    <motion.button
                                        className="text-gray-400 hover:text-white text-2xl"
                                        onClick={() => setSelectedProduct(null)}
                                        whileHover={{ scale: 1.2 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        ×
                                    </motion.button>
                                </div>
                            </div>

                            {resolveImageUrl(selectedProduct.image) && (
                                <img
                                    src={resolveImageUrl(selectedProduct.image)}
                                    alt={selectedProduct.name}
                                    className="w-full rounded-xl mb-6 max-h-96 object-cover"
                                    loading="lazy"
                                    decoding="async"
                                />
                            )}

                            <p className="text-gray-300 mb-6">{selectedProduct.description}</p>

                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-300 mb-2">Quantity</label>
                                <div className="flex items-center space-x-3">
                                    <motion.button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="px-3 py-2 bg-purple-600/50 hover:bg-purple-600 rounded-lg text-white"
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        −
                                    </motion.button>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-16 px-3 py-2 bg-slate-800/50 border border-purple-500/30 rounded-lg text-white text-center"
                                    />
                                    <motion.button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="px-3 py-2 bg-purple-600/50 hover:bg-purple-600 rounded-lg text-white"
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        +
                                    </motion.button>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-300 mb-2">Size(Optional)</label>
                                <div className="flex flex-wrap gap-3">
                                    {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                                        <motion.button
                                            key={size}
                                            onClick={() => setSelectedSize(selectedSize === size ? '' : size)}
                                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                                selectedSize === size
                                                    ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white'
                                                    : 'bg-slate-800/50 text-gray-300 border border-purple-500/30 hover:border-purple-500'
                                            }`}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            {size}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-300 mb-2">Color(Optional)</label>
                                <div className="flex flex-wrap gap-3">
                                    {['Red', 'Blue', 'Black', 'White', 'Green'].map(color => (
                                        <motion.button
                                            key={color}
                                            onClick={() => setSelectedColor(selectedColor === color ? '' : color)}
                                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                                selectedColor === color
                                                    ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white'
                                                    : 'bg-slate-800/50 text-gray-300 border border-purple-500/30 hover:border-purple-500'
                                            }`}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            {color}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-purple-500/20">
                                <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                                    ${(parseFloat(selectedProduct.price) * quantity).toFixed(2)}
                                </div>
                                <motion.button
                                    onClick={() => handleAddToCart(selectedProduct)}
                                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg text-white font-bold text-lg hover:shadow-lg hover:shadow-purple-500/50"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Add to Cart
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </main>
        </div>
    );
};

export default Home;
