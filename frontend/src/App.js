import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ToastProvider } from './context/ToastContext';
import Navigation from './components/Navigation';
import Toast from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import ResetPasswordConfirm from './pages/ResetPasswordConfirm';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Profile from './pages/Profile';
import Checkout from './pages/Checkout';
import ProductDetail from './pages/ProductDetail';
import Reviews from './pages/Reviews';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import AdminDashboard from './pages/AdminDashboard';
import AdminOrders from './pages/AdminOrders';
import CheckoutSuccess from './pages/CheckoutSuccess';
import CheckoutCancel from './pages/CheckoutCancel';
import NotFound from './pages/NotFound';

function App() {
    return (
        <Router>
            <AuthProvider>
                <CartProvider>
                    <WishlistProvider>
                        <ToastProvider>
                            <Navigation />
                            <Toast />
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route path="/reset-password" element={<ResetPassword />} />
                                <Route path="/reset-password-confirm" element={<ResetPasswordConfirm />} />
                                <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                                <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                                <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                                <Route path="/checkout/success" element={<CheckoutSuccess />} />
                                <Route path="/checkout/cancel" element={<CheckoutCancel />} />
                                <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                                <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
                                <Route path="/product/:id" element={<ProductDetail />} />
                                <Route path="/product/:id/reviews" element={<Reviews />} />
                                <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                                <Route path="/admin/orders" element={<ProtectedRoute><AdminOrders /></ProtectedRoute>} />
                                <Route path="*" element={<NotFound />} />
                            </Routes>
                            <footer className="bg-slate-950 text-gray-300 py-10 mt-8 border-t border-slate-800">
                                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between gap-6">
                                    <div>
                                        <h3 className="text-xl font-semibold text-white">E-Shop Deluxe</h3>
                                        <p className="mt-2 text-sm text-gray-400 max-w-md">
                                            Modern e-commerce experience with curated collections, fast checkout, and seamless browsing.
                                        </p>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <p><span className="font-semibold text-white">Contact</span>: support@eshopdeluxe.com</p>
                                        <p><span className="font-semibold text-white">Phone</span>: +1 (800) 123-4567</p>
                                        <p><span className="font-semibold text-white">Address</span>: 123 Commerce Blvd, Suite 400</p>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <p className="font-semibold text-white">Quick Links</p>
                                        <p>Shop</p>
                                        <p>My Account</p>
                                        <p>Support</p>
                                    </div>
                                </div>
                            </footer>
                        </ToastProvider>
                    </WishlistProvider>
                </CartProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
