import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const CheckoutSuccess = () => {
    const { token } = useAuth();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        document.title = 'Checkout Success | E-Shop Deluxe';
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', 'Thank you for your purchase at E-Shop Deluxe. Your order is being processed.');
        }
    }, []);

    useEffect(() => {
        const fetchLatestOrder = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch('http://localhost:8000/api/purchases/orders/latest/', {
                    headers: {
                        Authorization: `Token ${token}`
                    }
                });
                if (!response.ok) {
                    throw new Error('Unable to fetch order details.');
                }
                const data = await response.json();
                setOrder(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLatestOrder();
    }, [token]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900 text-white flex items-center justify-center px-4 py-16">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl w-full rounded-3xl border border-cyan-500/20 bg-slate-900/90 p-10 shadow-2xl"
            >
                <div className="text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-300 text-4xl">
                        ✓
                    </div>
                    <h1 className="text-4xl font-bold mb-4">Thank you for your order!</h1>
                    <p className="text-gray-300 leading-relaxed mb-8">
                        Your payment was successful and your order is now being prepared. You can view the order status in your account, or continue shopping for more items.
                    </p>
                    {loading ? (
                        <p className="text-gray-400 mb-6">Loading your latest order details...</p>
                    ) : error ? (
                        <p className="text-red-400 mb-6">{error}</p>
                    ) : order ? (
                        <div className="mb-6 rounded-3xl border border-cyan-500/20 bg-slate-950/80 p-5 text-left">
                            <p className="text-sm text-cyan-300">Order #{order.id}</p>
                            <p className="text-lg font-semibold text-white">Total: ${order.total}</p>
                            <p className="text-sm text-gray-400">Status: {order.status.replace('_', ' ').toUpperCase()}</p>
                            <p className="text-sm text-gray-400">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                    ) : (
                        <p className="text-gray-400 mb-6">No recent order details available right now.</p>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Link
                            to="/orders"
                            className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition"
                        >
                            View My Orders
                        </Link>
                        <Link
                            to="/"
                            className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:border-cyan-400 hover:text-cyan-300 transition"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default CheckoutSuccess;
