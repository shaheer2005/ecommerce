import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const Navigation = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const { getTotalItems } = useCart();
    const { getTotalWishlistItems } = useWishlist();
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();
    const cartCount = getTotalItems();
    const wishlistCount = getTotalWishlistItems();

    const handleLogout = () => {
        logout();
        navigate('/');
        setMenuOpen(false);
    };

    return (
        <motion.header className="relative z-50 backdrop-blur-sm bg-black/20 border-b border-purple-500/20 sticky top-0"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-3">
                        <motion.div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span className="text-white font-bold text-lg">✨</span>
                        </motion.div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                            Premium Shop
                        </h1>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-6">
                        <Link to="/" className="text-gray-300 hover:text-cyan-400 transition">
                            Home
                        </Link>
                        {isAuthenticated && (
                            <>
                                <Link to="/cart" className="relative text-gray-300 hover:text-cyan-400 transition">
                                    <span>🛒 Cart</span>
                                    {cartCount > 0 && (
                                        <motion.span className="absolute -top-2 -right-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full"
                                            animate={{ scale: [1, 1.1, 1] }}
                                            transition={{ duration: 0.5, repeat: Infinity }}
                                        >
                                            {cartCount}
                                        </motion.span>
                                    )}
                                </Link>
                                <Link to="/wishlist" className="relative text-gray-300 hover:text-cyan-400 transition">
                                    <span>❤️Wishlist</span>
                                    {wishlistCount > 0 && (
                                        <motion.span className="absolute -top-2 -right-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full"
                                            animate={{ scale: [1, 1.1, 1] }}
                                            transition={{ duration: 0.5, repeat: Infinity }}
                                        >
                                            {wishlistCount}
                                        </motion.span>
                                    )}
                                </Link>
                                <Link to="/orders" className="text-gray-300 hover:text-cyan-400 transition">
                                    📦 Orders
                                </Link>
                                {user?.is_staff && (
                                    <>
                                        <Link to="/admin/dashboard" className="text-gray-300 hover:text-cyan-400 transition">
                                            📊 Admin Dashboard
                                        </Link>
                                        <Link to="/admin/orders" className="text-gray-300 hover:text-cyan-400 transition">
                                            🛠 Admin Orders
                                        </Link>
                                    </>
                                )}
                                <Link to="/profile" className="text-gray-300 hover:text-cyan-400 transition">
                                    Profile
                                </Link>
                            </>
                        )}
                        {isAuthenticated ? (
                            <>
                                <span className="text-gray-300">{user?.username}</span>
                                <motion.button onClick={handleLogout}
                                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold hover:shadow-lg hover:shadow-purple-500/50"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Logout
                                </motion.button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-gray-300 hover:text-cyan-400 transition">
                                    Login
                                </Link>
                                <Link to="/register" className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold hover:shadow-lg hover:shadow-purple-500/50">
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <motion.button onClick={() => setMenuOpen(!menuOpen)}
                            className="text-white"
                            whileTap={{ scale: 0.95 }}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </motion.button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <AnimatePresence>
                    {menuOpen && (
                        <motion.div className="md:hidden mt-4 space-y-3 pb-4"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <Link to="/" className="block text-gray-300 hover:text-cyan-400 transition py-2" onClick={() => setMenuOpen(false)}>
                                Home
                            </Link>
                            {isAuthenticated && (
                                <>
                                    <Link to="/cart" className="block text-gray-300 hover:text-cyan-400 transition py-2 relative" onClick={() => setMenuOpen(false)}>
                                        🛒 Cart
                                        {cartCount > 0 && (
                                            <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                                                {cartCount}
                                            </span>
                                        )}
                                    </Link>
                                    <Link to="/wishlist" className="block text-gray-300 hover:text-cyan-400 transition py-2 relative" onClick={() => setMenuOpen(false)}>
                                        ❤️ Wishlist
                                        {wishlistCount > 0 && (
                                            <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                                                {wishlistCount}
                                            </span>
                                        )}
                                    </Link>
                                    <Link to="/profile" className="block text-gray-300 hover:text-cyan-400 transition py-2" onClick={() => setMenuOpen(false)}>
                                        Profile
                                    </Link>
                                    {user?.is_staff && (
                                        <>
                                            <Link to="/admin/dashboard" className="block text-gray-300 hover:text-cyan-400 transition py-2" onClick={() => setMenuOpen(false)}>
                                                Admin Dashboard
                                            </Link>
                                            <Link to="/admin/orders" className="block text-gray-300 hover:text-cyan-400 transition py-2" onClick={() => setMenuOpen(false)}>
                                                Admin Orders
                                            </Link>
                                        </>
                                    )}
                                </>
                            )}
                            {isAuthenticated ? (
                                <>
                                    <div className="text-gray-300 py-2">{user?.username}</div>
                                    <button onClick={handleLogout}
                                        className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold text-left hover:shadow-lg hover:shadow-purple-500/50"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className="block text-gray-300 hover:text-cyan-400 transition py-2" onClick={() => setMenuOpen(false)}>
                                        Login
                                    </Link>
                                    <Link to="/register" className="block px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold hover:shadow-lg hover:shadow-purple-500/50" onClick={() => setMenuOpen(false)}>
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.header>
    );
};

export default Navigation;
