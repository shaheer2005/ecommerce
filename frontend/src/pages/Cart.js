import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const Cart = () => {
    const { cartItems, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const handleRemoveItem = (item) => {
        setTimeout(() => {
            removeFromCart(item.product.id, item.size, item.color);
            addToast('Item removed from cart', 'info');
        }, 300);
    };

    const handleQuantityChange = (item, newQuantity) => {
        if (newQuantity >= 1) {
            updateQuantity(item.product.id, newQuantity, item.size, item.color);
        }
    };

    const handleCheckout = () => {
        if (cartItems.length === 0) {
            addToast('Your cart is empty', 'warning');
            return;
        }
        navigate('/checkout');
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { duration: 0.4 }
        },
        exit: {
            opacity: 0,
            x: -20,
            transition: { duration: 0.3 }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900">
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
                    animate={{ y: [0, 50, 0] }}
                    transition={{ duration: 8, repeat: Infinity }}
                />
                <motion.div className="absolute bottom-20 right-10 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
                    animate={{ y: [0, -50, 0] }}
                    transition={{ duration: 8, repeat: Infinity }}
                />
            </div>

            <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <motion.div className="mb-12"
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}>
                    <h1 className="text-5xl md:text-6xl font-bold mb-4">
                        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">🛒Shopping Cart</span>
                    </h1>
                    <p className="text-gray-300 text-lg">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in cart</p>
                </motion.div>

                {cartItems.length === 0 ? (
                    <motion.div className="text-center py-20"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}>
                        <div className="text-6xl mb-4">🛍️</div>
                        <h2 className="text-3xl font-bold text-white mb-4">Your cart is empty</h2>
                        <p className="text-gray-400 mb-8 text-lg">Start adding items to your cart!</p>
                        <Link to="/" className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all">
                            Continue Shopping
                        </Link>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <motion.div className="space-y-4"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible">
                                {cartItems.map((item) => {
                                    const itemKey = `${item.product.id}-${item.size}-${item.color}`;
                                    return (
                                        <motion.div key={itemKey}
                                            className="bg-slate-900/50 border border-purple-500/30 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all"
                                            variants={itemVariants}
                                            layout>
                                            <div className="p-6 flex gap-6">
                                                {/* Product Image */}
                                                <div className="w-32 h-32 flex-shrink-0 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-lg overflow-hidden">
                                                    {item.product.image ? (
                                                        <motion.img src={`http://localhost:8000${item.product.image}`}
                                                            alt={item.product.name}
                                                            className="w-full h-full object-cover"
                                                            whileHover={{ scale: 1.05 }}
                                                            transition={{ duration: 0.3 }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-3xl">🎁</div>
                                                    )}
                                                </div>

                                                {/* Product Info */}
                                                <div className="flex-grow">
                                                    <h3 className="text-xl font-bold text-white mb-2">{item.product.name}</h3>
                                                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{item.product.description}</p>

                                                    {/* Quantity & Price */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="flex items-center border border-purple-500/30 rounded-lg">
                                                                <button onClick={() => handleQuantityChange(item, item.quantity - 1)}
                                                                    className="px-3 py-2 text-gray-400 hover:text-cyan-400">−</button>
                                                                <span className="px-4 py-2 text-white font-semibold min-w-[2rem] text-center">{item.quantity}</span>
                                                                <button onClick={() => handleQuantityChange(item, item.quantity + 1)}
                                                                    className="px-3 py-2 text-gray-400 hover:text-cyan-400">+</button>
                                                            </div>
                                                            <span className="text-2xl font-bold text-cyan-400">${(item.product.price * item.quantity).toFixed(2)}</span>
                                                        </div>

                                                        {/* Remove Button */}
                                                        <motion.button onClick={() => handleRemoveItem(item)}
                                                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all"
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}>
                                                            Remove
                                                        </motion.button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        </div>

                        {/* Order Summary */}
                        <motion.div className="lg:col-span-1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}>
                            <div className="bg-slate-900/50 border border-purple-500/30 rounded-xl p-6 sticky top-24">
                                <h3 className="text-2xl font-bold text-white mb-6">Order Summary</h3>
                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-gray-400">
                                        <span>Subtotal</span>
                                        <span>${getTotalPrice().toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-400">
                                        <span>Shipping</span>
                                        <span>Free</span>
                                    </div>
                                    <div className="border-t border-purple-500/20 pt-4 flex justify-between">
                                        <span className="text-lg font-bold text-white">Total</span>
                                        <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                                            ${getTotalPrice().toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                <motion.button onClick={handleCheckout}
                                    className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold hover:shadow-lg hover:shadow-purple-500/50 transition-all mb-3"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}>
                                    Proceed to Checkout
                                </motion.button>

                                <motion.button onClick={() => navigate('/')}
                                    className="w-full py-3 rounded-lg border border-purple-500/30 text-white font-semibold hover:bg-purple-500/10 transition-all"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}>
                                    Continue Shopping
                                </motion.button>

                                {cartItems.length > 0 && (
                                    <motion.button onClick={clearCart}
                                        className="w-full mt-3 py-2 text-red-400 hover:text-red-300 text-sm font-semibold"
                                        whileHover={{ scale: 1.02 }}>
                                        Clear Cart
                                    </motion.button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Cart;
