import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Orders = () => {
    const { token } = useAuth();
    const { addToast } = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [paymentProof, setPaymentProof] = useState(null);

    const fetchOrders = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:8000/api/purchases/orders/', {
                headers: {
                    'Authorization': `Token ${token}`
                }
            });
            const data = await response.json();
            setOrders(data.results || data);
        } catch (error) {
            console.error('Error fetching orders:', error);
            addToast('Failed to load orders', 'error');
        } finally {
            setLoading(false);
        }
    }, [token, addToast]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handlePaymentProofUpload = async (orderId) => {
        if (!paymentProof) {
            addToast('Please select a payment proof file', 'warning');
            return;
        }

        const formData = new FormData();
        formData.append('payment_proof', paymentProof);

        try {
            const response = await fetch(`http://localhost:8000/api/purchases/orders/${orderId}/upload_payment_proof/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`
                },
                body: formData
            });

            if (response.ok) {
                addToast('Payment proof uploaded successfully!', 'success');
                fetchOrders(); // Refresh orders
                setSelectedOrder(null);
                setPaymentProof(null);
            } else {
                const error = await response.json();
                addToast(error.error || 'Failed to upload payment proof', 'error');
            }
        } catch (error) {
            console.error('Error uploading payment proof:', error);
            addToast('Failed to upload payment proof', 'error');
        }
    };

    const handleCancelOrder = async (orderId) => {
        try {
            const response = await fetch(`http://localhost:8000/api/purchases/orders/${orderId}/cancel/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({ cancellation_reason: 'Customer requested cancellation.' })
            });

            if (response.ok) {
                addToast('Order cancelled successfully.', 'success');
                fetchOrders();
            } else {
                const error = await response.json();
                addToast(error.error || error.detail || 'Failed to cancel order.', 'error');
            }
        } catch (error) {
            console.error('Error cancelling order:', error);
            addToast('Failed to cancel order.', 'error');
        }
    };

    const handleRequestRefund = async (orderId) => {
        try {
            const response = await fetch(`http://localhost:8000/api/purchases/orders/${orderId}/refund/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                }
            });

            if (response.ok) {
                addToast('Refund processed successfully.', 'success');
                fetchOrders();
            } else {
                const error = await response.json();
                addToast(error.error || error.detail || 'Failed to process refund.', 'error');
            }
        } catch (error) {
            console.error('Error requesting refund:', error);
            addToast('Failed to request refund.', 'error');
        }
    };

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

    const getTrackingUrl = (carrier, trackingNumber) => {
        if (!trackingNumber) return null;

        switch (carrier) {
            case 'fedex':
                return `https://www.fedex.com/apps/fedextrack/?tracknumbers=${trackingNumber}`;
            case 'ups':
                return `https://www.ups.com/track?loc=en_US&tracknum=${trackingNumber}`;
            case 'usps':
                return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;
            case 'dhl':
                return `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`;
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                    <p>Loading your orders...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-5xl font-bold text-white mb-4">My Orders</h1>
                    <p className="text-gray-300 text-lg">Track your orders and manage payments</p>
                </motion.div>

                <div className="space-y-6">
                    {orders.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-400 text-lg">You haven't placed any orders yet.</p>
                        </div>
                    ) : (
                        orders.map((order) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-slate-900/60 border border-purple-500/30 rounded-3xl p-6 shadow-xl"
                            >
                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-semibold">Order #{order.id}</h3>
                                        <p className="text-gray-400">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Link
                                            to={`/orders/${order.id}`}
                                            className="rounded-2xl border border-cyan-500/30 bg-cyan-600/10 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-600/20 transition"
                                        >
                                            View Details
                                        </Link>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)} bg-slate-800`}>
                                            {order.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6 mb-4">
                                    <div>
                                        <h4 className="font-semibold mb-2">Order Items</h4>
                                        <div className="space-y-2">
                                            {order.items.map((item) => (
                                                <div key={item.id} className="flex justify-between text-sm">
                                                    <span>{item.product.name} (x{item.quantity})</span>
                                                    <span>${item.total_price}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="border-t border-slate-700 mt-2 pt-2">
                                            <div className="flex justify-between font-semibold">
                                                <span>Total: ${order.total}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold mb-2">Shipping Address</h4>
                                        <p className="text-sm text-gray-300">
                                            {order.shipping_name}<br />
                                            {order.shipping_address}<br />
                                            {order.shipping_city}, {order.shipping_state} {order.shipping_zip}<br />
                                            {order.shipping_country}
                                        </p>
                                    </div>
                                </div>

                                {(order.tracking_number || order.shipping_carrier || order.shipped_at || order.estimated_delivery_at) && (
                                    <div className="bg-slate-900/70 border border-cyan-500/20 rounded-2xl p-4 mb-4">
                                        <h4 className="font-semibold text-white mb-2">Tracking & Delivery</h4>
                                        {order.shipping_carrier && (
                                            <p className="text-sm text-gray-300">Carrier: {order.shipping_carrier.toUpperCase()}</p>
                                        )}
                                        {order.tracking_number && (
                                            <p className="text-sm text-gray-300">Tracking #: {order.tracking_number}</p>
                                        )}
                                        {order.shipped_at && (
                                            <p className="text-sm text-gray-300">Shipped on {new Date(order.shipped_at).toLocaleDateString()}</p>
                                        )}
                                        {order.estimated_delivery_at && (
                                            <p className="text-sm text-gray-300">Estimated delivery: {new Date(order.estimated_delivery_at).toLocaleDateString()}</p>
                                        )}
                                        {getTrackingUrl(order.shipping_carrier, order.tracking_number) && (
                                            <a
                                                href={getTrackingUrl(order.shipping_carrier, order.tracking_number)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex mt-3 items-center rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-500 transition"
                                            >
                                                Track shipment
                                            </a>
                                        )}
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-3 mb-4">
                                    {order.can_be_cancelled && (
                                        <button
                                            onClick={() => handleCancelOrder(order.id)}
                                            className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/20 transition"
                                        >
                                            Cancel Order
                                        </button>
                                    )}
                                    {order.can_be_refunded && (
                                        <button
                                            onClick={() => handleRequestRefund(order.id)}
                                            className="rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300 hover:bg-blue-500/20 transition"
                                        >
                                            Request Refund
                                        </button>
                                    )}
                                </div>

                                {order.status === 'pending_payment' && (
                                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4 mb-4">
                                        <h4 className="font-semibold text-yellow-400 mb-2">Bank Transfer Required</h4>
                                        <p className="text-sm text-gray-300 mb-3">
                                            Please transfer ${order.total} to our bank account and upload the payment proof.
                                        </p>
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Upload Payment Proof
                                        </button>
                                    </div>
                                )}

                                {order.payment_proof && (
                                    <div className="mb-4">
                                        <h4 className="font-semibold mb-2">Payment Proof</h4>
                                        <img
                                            src={`http://localhost:8000${order.payment_proof}`}
                                            alt="Payment Proof"
                                            className="max-w-xs rounded-lg border border-slate-600"
                                        />
                                    </div>
                                )}

                                {order.timeline && order.timeline.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-2">Order Timeline</h4>
                                        <div className="space-y-2">
                                            {order.timeline.map((entry, index) => (
                                                <div key={index} className="text-sm text-gray-400">
                                                    <span className="font-medium">{entry.status}:</span> {entry.message}
                                                    <span className="ml-2 text-xs">
                                                        ({new Date(entry.created_at).toLocaleString()})
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Payment Proof Upload Modal */}
                {selectedOrder && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 max-w-md w-full"
                        >
                            <h3 className="text-xl font-semibold mb-4">Upload Payment Proof</h3>
                            <p className="text-gray-300 mb-4">
                                Order #{selectedOrder.id} - Amount: ${selectedOrder.total}
                            </p>

                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Payment Receipt/Screenshot</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setPaymentProof(e.target.files[0])}
                                    className="w-full text-sm text-gray-300 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 focus:border-cyan-400 focus:ring-cyan-400"
                                />
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => handlePaymentProofUpload(selectedOrder.id)}
                                    className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                >
                                    Upload
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedOrder(null);
                                        setPaymentProof(null);
                                    }}
                                    className="flex-1 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Orders;