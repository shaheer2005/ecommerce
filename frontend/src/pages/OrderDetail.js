import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const OrderDetail = () => {
    const { id } = useParams();
    const { token } = useAuth();
    const { addToast } = useToast();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrder = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`http://localhost:8000/api/purchases/orders/${id}/`, {
                    headers: {
                        Authorization: `Token ${token}`
                    }
                });
                if (!response.ok) {
                    throw new Error('Unable to load order details.');
                }
                const data = await response.json();
                setOrder(data);
            } catch (err) {
                setError(err.message);
                addToast(err.message, 'error');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchOrder();
        } else {
            setLoading(false);
            setError('Please sign in to view your order details.');
        }
    }, [id, token, addToast]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'paid': return 'text-green-400';
            case 'pending_payment': return 'text-yellow-400';
            case 'payment_submitted': return 'text-blue-400';
            case 'processing': return 'text-purple-400';
            case 'shipped': return 'text-cyan-400';
            case 'delivered': return 'text-green-500';
            case 'cancelled': return 'text-red-400';
            case 'refunded': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900 text-white py-16 px-4">
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-5xl font-bold mb-3">Order Details</h1>
                    <p className="text-gray-400">Review the full details for your recent order.</p>
                </motion.div>

                <div className="mb-6">
                    <Link to="/orders" className="inline-flex items-center rounded-full border border-cyan-500/20 bg-slate-900/70 px-5 py-3 text-sm font-semibold text-cyan-300 hover:bg-slate-900 transition">
                        &larr; Back to orders
                    </Link>
                </div>

                {loading ? (
                    <div className="rounded-3xl border border-purple-500/20 bg-slate-900/80 p-10 text-center">
                        <div className="inline-flex h-12 w-12 animate-spin rounded-full border-4 border-purple-500/20 border-t-purple-500"></div>
                        <p className="mt-4 text-gray-300">Loading order information...</p>
                    </div>
                ) : error ? (
                    <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-10 text-center text-red-200">
                        {error}
                    </div>
                ) : order ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-3xl border border-purple-500/20 bg-slate-900/80 p-8 shadow-xl"
                    >
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
                            <div>
                                <h2 className="text-3xl font-semibold">Order #{order.id}</h2>
                                <p className="text-gray-400">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
                            </div>
                            <span className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${getStatusColor(order.status)} bg-slate-950/70`}>
                                {order.status.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-3 mb-8">
                            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">Shipping</h3>
                                <p className="text-sm text-gray-300">{order.shipping_name}</p>
                                <p className="text-sm text-gray-300">{order.shipping_address}</p>
                                <p className="text-sm text-gray-300">{order.shipping_city}, {order.shipping_state} {order.shipping_zip}</p>
                                <p className="text-sm text-gray-300">{order.shipping_country}</p>
                                <p className="text-sm text-gray-400 mt-4">Email: {order.shipping_email}</p>
                            </div>
                            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">Summary</h3>
                                <div className="space-y-2 text-sm text-gray-300">
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span>${order.subtotal}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Shipping</span>
                                        <span>${order.shipping_cost}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Tax</span>
                                        <span>${order.tax}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold text-white border-t border-slate-800 pt-3">
                                        <span>Total</span>
                                        <span>${order.total}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">Shipping Info</h3>
                                {order.shipping_carrier && <p className="text-sm text-gray-300">Carrier: {order.shipping_carrier.toUpperCase()}</p>}
                                {order.tracking_number && <p className="text-sm text-gray-300">Tracking #: {order.tracking_number}</p>}
                                {order.shipped_at && <p className="text-sm text-gray-300">Shipped: {new Date(order.shipped_at).toLocaleDateString()}</p>}
                                {order.estimated_delivery_at && <p className="text-sm text-gray-300">Est. Delivery: {new Date(order.estimated_delivery_at).toLocaleDateString()}</p>}
                                {order.delivered_at && <p className="text-sm text-gray-300">Delivered: {new Date(order.delivered_at).toLocaleDateString()}</p>}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 mb-8">
                            <h3 className="text-lg font-semibold text-white mb-4">Items</h3>
                            <div className="space-y-4">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="font-semibold text-white">{item.product.name}</span>
                                            <span className="text-sm text-gray-400">${item.total_price}</span>
                                        </div>
                                        <div className="grid gap-2 sm:grid-cols-2 text-sm text-gray-400">
                                            <span>Quantity: {item.quantity}</span>
                                            {item.size && <span>Size: {item.size}</span>}
                                            {item.color && <span>Color: {item.color}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {order.timeline && order.timeline.length > 0 && (
                            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">Order Timeline</h3>
                                <div className="space-y-3 text-sm text-gray-300">
                                    {order.timeline.map((entry) => (
                                        <div key={entry.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="font-semibold text-white">{entry.status.replace('_', ' ').toUpperCase()}</span>
                                                <span className="text-xs text-gray-500">{new Date(entry.created_at).toLocaleString()}</span>
                                            </div>
                                            <p className="mt-2 text-gray-300">{entry.message}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                ) : null}
            </div>
        </div>
    );
};

export default OrderDetail;
