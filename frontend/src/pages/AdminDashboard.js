import React, { useEffect, useState, useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const API_BASE = 'http://localhost:8000/api/dashboard';

const AdminDashboard = () => {
    const { token, user, loading } = useAuth();
    const { addToast } = useToast();
    const [stats, setStats] = useState(null);
    const [topProducts, setTopProducts] = useState([]);
    const [orderStatus, setOrderStatus] = useState([]);
    const [customerAnalytics, setCustomerAnalytics] = useState(null);
    const [lowStock, setLowStock] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState(null);

    const fetchDashboardData = useCallback(async () => {
        setLoadingData(true);
        setError(null);

        if (!token) {
            setError('Authentication required.');
            setLoadingData(false);
            return;
        }

        try {
            const [statsRes, topProductsRes, statusRes, customerRes, lowStockRes] = await Promise.all([
                fetch(`${API_BASE}/stats/`, { headers: { Authorization: `Token ${token}` } }),
                fetch(`${API_BASE}/top-products/?limit=5`, { headers: { Authorization: `Token ${token}` } }),
                fetch(`${API_BASE}/order-status/`, { headers: { Authorization: `Token ${token}` } }),
                fetch(`${API_BASE}/customer-analytics/`, { headers: { Authorization: `Token ${token}` } }),
                fetch(`${API_BASE}/low-stock/?threshold=10`, { headers: { Authorization: `Token ${token}` } }),
            ]);

            if (!statsRes.ok) throw new Error('Unable to load dashboard statistics.');
            if (!topProductsRes.ok) throw new Error('Unable to load top products.');
            if (!statusRes.ok) throw new Error('Unable to load order status breakdown.');
            if (!customerRes.ok) throw new Error('Unable to load customer analytics.');
            if (!lowStockRes.ok) throw new Error('Unable to load low stock data.');

            const [statsData, topProductsData, statusData, customerData, lowStockData] = await Promise.all([
                statsRes.json(),
                topProductsRes.json(),
                statusRes.json(),
                customerRes.json(),
                lowStockRes.json(),
            ]);

            setStats(statsData);
            setTopProducts(topProductsData);
            setOrderStatus(statusData);
            setCustomerAnalytics(customerData);
            setLowStock(lowStockData);
        } catch (err) {
            console.error('Dashboard fetch error:', err);
            setError(err.message);
            addToast(err.message, 'error');
        } finally {
            setLoadingData(false);
        }
    }, [token, addToast]);

    useEffect(() => {
        if (token) {
            fetchDashboardData();
        } else {
            setLoadingData(false);
        }
    }, [token, fetchDashboardData]);

    if (loading || loadingData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-14 w-14 border-4 border-cyan-400/30 border-t-cyan-400 mx-auto mb-4"></div>
                    <p>Loading dashboard...</p>
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
                    <h1 className="text-5xl font-bold mb-3">Admin Dashboard</h1>
                    <p className="text-gray-400">Real-time sales and inventory metrics for your e-commerce store.</p>
                </motion.div>

                {error && (
                    <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-200 mb-8">
                        {error}
                    </div>
                )}

                {stats && (
                    <div className="grid gap-6 xl:grid-cols-4 mb-8">
                        {[
                            { label: 'Total Revenue', value: `$${parseFloat(stats.total_revenue || 0).toFixed(2)}` },
                            { label: 'Total Orders', value: stats.total_orders },
                            { label: 'Total Customers', value: stats.total_customers },
                            { label: 'Average Order Value', value: `$${parseFloat(stats.average_order_value || 0).toFixed(2)}` },
                        ].map((item) => (
                            <div key={item.label} className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-xl">
                                <p className="text-sm uppercase tracking-[0.2em] text-cyan-300 mb-3">{item.label}</p>
                                <p className="text-3xl font-semibold text-white">{item.value}</p>
                            </div>
                        ))}
                    </div>
                )}

                <div className="grid gap-6 xl:grid-cols-2 mb-8">
                    <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
                        <h2 className="text-2xl font-semibold text-white mb-4">Order Status Breakdown</h2>
                        <div className="space-y-4">
                            {orderStatus.length === 0 ? (
                                <p className="text-gray-400">No orders to display.</p>
                            ) : (
                                orderStatus.map((item) => {
                                    const percentage = parseFloat(item.percentage || 0).toFixed(1);
                                    return (
                                        <div key={item.status} className="space-y-2">
                                            <div className="flex items-center justify-between text-sm text-gray-300">
                                                <span>{item.status.replace('_', ' ').toUpperCase()}</span>
                                                <span>{item.count} orders • {percentage}%</span>
                                            </div>
                                            <div className="h-3 rounded-full bg-slate-900 overflow-hidden">
                                                <div className="h-full rounded-full bg-cyan-500" style={{ width: `${percentage}%` }} />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
                        <h2 className="text-2xl font-semibold text-white mb-4">Customer Analytics</h2>
                        {customerAnalytics ? (
                            <div className="grid gap-4">
                                <div className="rounded-2xl bg-slate-900/80 p-4">
                                    <p className="text-sm text-gray-400">New Customers This Month</p>
                                    <p className="text-2xl font-semibold text-white">{customerAnalytics.new_customers_this_month}</p>
                                </div>
                                <div className="rounded-2xl bg-slate-900/80 p-4">
                                    <p className="text-sm text-gray-400">Returning Customers</p>
                                    <p className="text-2xl font-semibold text-white">{customerAnalytics.returning_customers}</p>
                                </div>
                                <div className="rounded-2xl bg-slate-900/80 p-4">
                                    <p className="text-sm text-gray-400">Repeat Purchase Rate</p>
                                    <p className="text-2xl font-semibold text-white">{parseFloat(customerAnalytics.repeat_purchase_rate || 0).toFixed(1)}%</p>
                                </div>
                                <div className="rounded-2xl bg-slate-900/80 p-4">
                                    <p className="text-sm text-gray-400">Avg Customer Lifetime Value</p>
                                    <p className="text-2xl font-semibold text-white">${parseFloat(customerAnalytics.avg_customer_lifetime_value || 0).toFixed(2)}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-400">No customer analytics available.</p>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                    <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
                        <h2 className="text-2xl font-semibold text-white mb-4">Top Products</h2>
                        {topProducts.length === 0 ? (
                            <p className="text-gray-400">No top products data available.</p>
                        ) : (
                            <div className="space-y-4">
                                {topProducts.map((product) => (
                                    <div key={product.product_id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-white font-semibold">{product.product_name}</p>
                                                <p className="text-sm text-gray-400">Units sold: {product.units_sold}</p>
                                            </div>
                                            <p className="text-lg font-semibold text-cyan-300">${parseFloat(product.revenue || 0).toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
                        <h2 className="text-2xl font-semibold text-white mb-4">Low Stock Alerts</h2>
                        {lowStock.length === 0 ? (
                            <p className="text-gray-400">No low stock products found.</p>
                        ) : (
                            <div className="space-y-4">
                                {lowStock.map((item) => (
                                    <div key={item.product_id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                                        <div className="flex items-center justify-between gap-3 text-sm text-gray-300">
                                            <div>
                                                <p className="font-semibold text-white">{item.product_name}</p>
                                                <p>Threshold: {item.warning_threshold}</p>
                                            </div>
                                            <span className="rounded-full bg-red-500/10 px-3 py-1 text-red-300">{item.current_stock} left</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-10 text-right">
                    <Link to="/admin/orders" className="inline-flex items-center rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition">
                        Manage Orders
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
