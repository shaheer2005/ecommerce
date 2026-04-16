import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const API_URL = 'http://localhost:8000/api/purchases/orders/';

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

const AdminOrders = () => {
    const { token, user, loading } = useAuth();
    const { addToast } = useToast();
    const [orders, setOrders] = useState([]);
    const [fetching, setFetching] = useState(true);
    const [shipDetails, setShipDetails] = useState({});
    const [actionLoading, setActionLoading] = useState({});
    const [selectedOrderIds, setSelectedOrderIds] = useState([]);
    const [bulkLoading, setBulkLoading] = useState(false);

    const fetchOrders = useCallback(async () => {
        setFetching(true);
        try {
            const response = await fetch(API_URL, {
                headers: {
                    'Authorization': `Token ${token}`
                }
            });
            const data = await response.json();
            setOrders(data.results || []);
        } catch (error) {
            console.error('Error fetching admin orders:', error);
            addToast('Failed to load admin orders', 'error');
        } finally {
            setFetching(false);
        }
    }, [token, addToast]);

    useEffect(() => {
        if (token) {
            fetchOrders();
        } else {
            setFetching(false);
        }
    }, [token, fetchOrders]);

    const updateShipDetails = (orderId, field, value) => {
        setShipDetails((prev) => ({
            ...prev,
            [orderId]: {
                ...prev[orderId],
                [field]: value,
            }
        }));
    };

    const toggleOrderSelection = (orderId) => {
        setSelectedOrderIds((prev) =>
            prev.includes(orderId)
                ? prev.filter((id) => id !== orderId)
                : [...prev, orderId]
        );
    };

    const selectAllOrders = () => {
        setSelectedOrderIds(orders.map((order) => order.id));
    };

    const clearOrderSelection = () => {
        setSelectedOrderIds([]);
    };

    const handleBulkAction = async (action) => {
        if (selectedOrderIds.length === 0) {
            addToast('Please select at least one order to perform this action.', 'warning');
            return;
        }

        setBulkLoading(true);

        try {
            const response = await fetch('http://localhost:8000/api/dashboard/bulk-actions/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({ action, order_ids: selectedOrderIds }),
            });

            if (response.ok) {
                const data = await response.json();
                if (action === 'bulk_export') {
                    const csvContent = [
                        ['Order ID', 'User', 'Status', 'Total', 'Created At'],
                        ...data.map((order) => [
                            order.order_id,
                            order.user,
                            order.status,
                            order.total,
                            order.created_at,
                        ]),
                    ]
                        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
                        .join('\r\n');

                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', 'order_export.csv');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    addToast('Order export downloaded.', 'success');
                } else {
                    addToast(data.message || 'Bulk action completed.', 'success');
                    fetchOrders();
                }
                clearOrderSelection();
            } else {
                const error = await response.json();
                addToast(error.error || error.detail || 'Failed to perform bulk action.', 'error');
            }
        } catch (error) {
            console.error('Bulk action failed:', error);
            addToast('Failed to perform bulk action.', 'error');
        } finally {
            setBulkLoading(false);
        }
    };

    const handleOrderAction = async (orderId, action, body = {}) => {
        setActionLoading((prev) => ({ ...prev, [orderId]: true }));

        try {
            const response = await fetch(`${API_URL}${orderId}/${action}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                addToast(`Order #${orderId} updated successfully.`, 'success');
                fetchOrders();
            } else {
                const error = await response.json();
                addToast(error.error || error.detail || 'Failed to update order.', 'error');
            }
        } catch (error) {
            console.error(`Error calling ${action} on order ${orderId}:`, error);
            addToast('Failed to update order.', 'error');
        } finally {
            setActionLoading((prev) => ({ ...prev, [orderId]: false }));
        }
    };

    const handleMarkShipped = async (orderId) => {
        const details = shipDetails[orderId] || {};
        const { tracking_number, shipping_carrier } = details;

        if (!tracking_number || !shipping_carrier) {
            addToast('Tracking number and carrier are required.', 'warning');
            return;
        }

        await handleOrderAction(orderId, 'mark_shipped', { tracking_number, shipping_carrier });
    };

    if (loading || fetching) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900 flex items-center justify-center text-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-14 w-14 border-4 border-cyan-400/30 border-t-cyan-400 mx-auto mb-4"></div>
                    <p>Loading admin orders...</p>
                </div>
            </div>
        );
    }

    if (!user?.is_staff) {
        return <Navigate to="/" />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900 text-white py-16 px-4">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-5xl font-bold text-white mb-4">Admin Orders</h1>
                    <p className="text-gray-300 text-lg">Manage orders, confirm payments, and ship orders.</p>
                </motion.div>

                {orders.length === 0 ? (
                    <div className="text-center py-20 border border-purple-500/20 rounded-3xl bg-slate-900/70">
                        <p className="text-gray-400 text-lg">No orders were found.</p>
                    </div>
                ) : (
                    <>
                        <div className="mb-8 rounded-3xl border border-purple-500/20 bg-slate-900/80 p-6 shadow-lg">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <p className="text-sm uppercase tracking-[0.2em] text-purple-300">Bulk Actions</p>
                                    <p className="text-gray-300 text-sm mt-1">
                                        Select orders to mark as processing or export order data.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={selectAllOrders}
                                        className="rounded-2xl bg-slate-800 border border-slate-700 px-4 py-2 text-sm text-gray-200 hover:bg-slate-700 transition"
                                    >
                                        Select All
                                    </button>
                                    <button
                                        type="button"
                                        onClick={clearOrderSelection}
                                        className="rounded-2xl bg-slate-800 border border-slate-700 px-4 py-2 text-sm text-gray-200 hover:bg-slate-700 transition"
                                    >
                                        Clear Selection
                                    </button>
                                </div>
                            </div>
                            {selectedOrderIds.length > 0 && (
                                <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <p className="text-sm text-gray-300">{selectedOrderIds.length} order(s) selected</p>
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handleBulkAction('mark_processing')}
                                            disabled={bulkLoading}
                                            className="rounded-2xl bg-green-500/20 border border-green-400/30 px-4 py-2 text-sm font-semibold text-green-200 hover:bg-green-500/30 transition"
                                        >
                                            Mark Selected as Processing
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleBulkAction('bulk_export')}
                                            disabled={bulkLoading}
                                            className="rounded-2xl bg-cyan-500/20 border border-cyan-400/30 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/30 transition"
                                        >
                                            Export Selected
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="space-y-6">
                        {orders.map((order) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-slate-900/80 border border-purple-500/20 rounded-3xl p-6 shadow-xl"
                            >
                                <div className="flex flex-col md:flex-row justify-between gap-4 mb-4 items-start md:items-center">
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedOrderIds.includes(order.id)}
                                            onChange={() => toggleOrderSelection(order.id)}
                                            className="h-5 w-5 rounded border-slate-500 bg-slate-800 text-cyan-400"
                                        />
                                        <div>
                                            <h2 className="text-2xl font-semibold">Order #{order.id}</h2>
                                            <p className="text-gray-400">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-semibold ${getStatusColor(order.status)}`}>
                                            {order.status.replace('_', ' ').toUpperCase()}
                                        </p>
                                        <p className="text-sm text-gray-400">Total: ${order.total}</p>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6 mb-4">
                                    <div>
                                        <h3 className="font-semibold mb-2">Customer</h3>
                                        <p className="text-sm text-gray-300">
                                            {order.user?.username} <span className="text-gray-500">({order.user?.email})</span>
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-2">Shipping</h3>
                                        <p className="text-sm text-gray-300">
                                            {order.shipping_name}<br />
                                            {order.shipping_address}<br />
                                            {order.shipping_city}, {order.shipping_state} {order.shipping_zip}<br />
                                            {order.shipping_country}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4 mb-4">
                                    <div className="space-y-2">
                                        <h3 className="font-semibold">Order Items</h3>
                                        {order.items.map((item) => (
                                            <div key={item.id} className="flex justify-between text-sm text-gray-300">
                                                <span>{item.product.name} ×{item.quantity}</span>
                                                <span>${item.total_price}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="space-y-3">
                                        {order.payment_proof && (
                                            <div>
                                                <h3 className="font-semibold">Payment Proof</h3>
                                                <img
                                                    src={`http://localhost:8000${order.payment_proof}`}
                                                    alt="Payment Proof"
                                                    className="max-w-full rounded-2xl border border-slate-700"
                                                />
                                            </div>
                                        )}
                                        {order.tracking_number && (
                                            <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/70 p-4">
                                                <p className="text-sm text-gray-300">Carrier: {order.shipping_carrier?.toUpperCase()}</p>
                                                <p className="text-sm text-gray-300">Tracking #: {order.tracking_number}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {order.timeline && order.timeline.length > 0 && (
                                    <div className="mb-4">
                                        <h3 className="font-semibold mb-2">Timeline</h3>
                                        <div className="space-y-2 text-sm text-gray-400">
                                            {order.timeline.map((entry) => (
                                                <div key={entry.id}>
                                                    <span className="font-semibold">{entry.status}:</span> {entry.message}
                                                    <span className="ml-2 text-xs text-gray-500">{new Date(entry.created_at).toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {(order.status === 'pending_payment' || order.status === 'payment_submitted') && (
                                        <div className="grid md:grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => handleOrderAction(order.id, 'verify_payment')}
                                                disabled={actionLoading[order.id]}
                                                className="rounded-2xl bg-green-500/20 border border-green-500/30 px-4 py-3 text-sm font-semibold text-green-300 hover:bg-green-500/30 transition"
                                            >
                                                Verify Payment
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleOrderAction(order.id, 'reject_payment')}
                                                disabled={actionLoading[order.id]}
                                                className="rounded-2xl bg-red-500/20 border border-red-500/30 px-4 py-3 text-sm font-semibold text-red-300 hover:bg-red-500/30 transition"
                                            >
                                                Reject Payment
                                            </button>
                                        </div>
                                    )}

                                    {(order.status === 'paid' || order.status === 'processing') && (
                                        <div className="grid gap-3">
                                            <div className="grid md:grid-cols-2 gap-3">
                                                <input
                                                    type="text"
                                                    placeholder="Tracking Number"
                                                    value={shipDetails[order.id]?.tracking_number || ''}
                                                    onChange={(e) => updateShipDetails(order.id, 'tracking_number', e.target.value)}
                                                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-gray-200"
                                                />
                                                <select
                                                    value={shipDetails[order.id]?.shipping_carrier || ''}
                                                    onChange={(e) => updateShipDetails(order.id, 'shipping_carrier', e.target.value)}
                                                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-gray-200"
                                                >
                                                    <option value="">Select carrier</option>
                                                    <option value="fedex">FedEx</option>
                                                    <option value="ups">UPS</option>
                                                    <option value="usps">USPS</option>
                                                    <option value="dhl">DHL</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleMarkShipped(order.id)}
                                                disabled={actionLoading[order.id]}
                                                className="rounded-2xl bg-cyan-500/20 border border-cyan-500/30 px-4 py-3 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/30 transition"
                                            >
                                                Mark as Shipped
                                            </button>
                                        </div>
                                    )}

                                    {order.status === 'shipped' && (
                                        <button
                                            type="button"
                                            onClick={() => handleOrderAction(order.id, 'mark_delivered')}
                                            disabled={actionLoading[order.id]}
                                            className="rounded-2xl bg-violet-500/20 border border-violet-500/30 px-4 py-3 text-sm font-semibold text-violet-200 hover:bg-violet-500/30 transition"
                                        >
                                            Mark as Delivered
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminOrders;
