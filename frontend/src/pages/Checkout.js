import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Checkout = () => {
    const { cartItems, getTotalPrice, clearCart } = useCart();
    const { token } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const [shippingInfo, setShippingInfo] = useState({
        shipping_name: '',
        shipping_email: '',
        shipping_phone: '',
        shipping_address: '',
        shipping_city: '',
        shipping_state: '',
        shipping_zip: '',
        shipping_country: ''
    });
    const [paymentMethod, setPaymentMethod] = useState('stripe');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const subtotal = getTotalPrice();
    const shippingCost = 10.0;
    const tax = parseFloat((subtotal * 0.08).toFixed(2));
    const total = parseFloat((subtotal + shippingCost + tax).toFixed(2));

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setShippingInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckout = async (event) => {
        event.preventDefault();
        setError('');

        if (cartItems.length === 0) {
            addToast('Your cart is empty. Add items before checking out.', 'warning');
            return;
        }

        const requiredFields = ['shipping_name', 'shipping_email', 'shipping_address', 'shipping_city', 'shipping_state', 'shipping_zip', 'shipping_country'];
        if (paymentMethod === 'easypaisa') {
            requiredFields.push('shipping_phone');
        }

        const missingField = requiredFields.find((field) => !shippingInfo[field]?.trim());
        if (missingField) {
            setError('Please fill in all required shipping fields before checkout.');
            return;
        }

        setLoading(true);

        try {
            if (!token) {
                setError('Please log in before checking out.');
                return;
            }

            const response = await fetch('http://localhost:8000/api/purchases/checkout/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({
                    ...shippingInfo,
                    payment_method: paymentMethod
                })
            });

            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                const text = await response.text();
                throw new Error(text || 'Checkout failed. Please try again.');
            }

            if (!response.ok) {
                setError(data?.error || `Checkout failed. (${response.status})`);
                return;
            }

            if (paymentMethod === 'bank_transfer') {
                addToast('Order created! Please complete the bank transfer.', 'success');
                clearCart();
                navigate('/orders');
                return;
            }

            if (data.checkout_url) {
                window.location.href = data.checkout_url;
                return;
            }

            addToast('Checkout completed successfully.', 'success');
            clearCart();
            navigate('/');
        } catch (err) {
            console.error('Checkout error:', err);
            setError('Unable to complete checkout. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900 text-white">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
                    animate={{ y: [0, 50, 0] }}
                    transition={{ duration: 8, repeat: Infinity }}
                />
                <motion.div
                    className="absolute bottom-20 right-10 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
                    animate={{ y: [0, -50, 0] }}
                    transition={{ duration: 8, repeat: Infinity }}
                />
            </div>

            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-5xl font-bold text-white mb-4">Checkout</h1>
                    <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                        Complete your order with shipping details and payment. Review your cart and submit to start checkout.
                    </p>
                </motion.div>

                <div className="grid gap-8 lg:grid-cols-3">
                    <section className="lg:col-span-2 space-y-6">
                        <div className="bg-slate-900/60 border border-purple-500/30 rounded-3xl p-8 shadow-xl">
                            <h2 className="text-2xl font-semibold mb-4">Shipping Information</h2>

                            <form onSubmit={handleCheckout} className="space-y-4">
                                {/* Payment Method Selection */}
                                <div className="bg-slate-800/50 border border-cyan-500/30 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
                                    <div className="space-y-3">
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="stripe"
                                                checked={paymentMethod === 'stripe'}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                className="text-cyan-400 focus:ring-cyan-400"
                                            />
                                            <div>
                                                <span className="font-medium">Credit/Debit Card (Stripe)</span>
                                                <p className="text-sm text-gray-400">Pay securely with your card</p>
                                            </div>
                                        </label>
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="bank_transfer"
                                                checked={paymentMethod === 'bank_transfer'}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                className="text-cyan-400 focus:ring-cyan-400"
                                            />
                                            <div>
                                                <span className="font-medium">Bank Transfer</span>
                                                <p className="text-sm text-gray-400">Transfer money directly to our bank account</p>
                                            </div>
                                        </label>
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="easypaisa"
                                                checked={paymentMethod === 'easypaisa'}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                className="text-cyan-400 focus:ring-cyan-400"
                                            />
                                            <div>
                                                <span className="font-medium">EasyPaisa</span>
                                                <p className="text-sm text-gray-400">Pay using EasyPaisa mobile wallet</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <label className="block">
                                        <span className="text-sm text-gray-300">Full Name</span>
                                        <input
                                            name="shipping_name"
                                            type="text"
                                            value={shippingInfo.shipping_name}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-cyan-400 focus:ring-cyan-400"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="text-sm text-gray-300">Email</span>
                                        <input
                                            name="shipping_email"
                                            type="email"
                                            value={shippingInfo.shipping_email}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-cyan-400 focus:ring-cyan-400"
                                        />
                                    </label>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <label className="block">
                                        <span className="text-sm text-gray-300">Phone Number</span>
                                        <input
                                            name="shipping_phone"
                                            type="text"
                                            value={shippingInfo.shipping_phone}
                                            onChange={handleInputChange}
                                            placeholder="Required for EasyPaisa"
                                            className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-cyan-400 focus:ring-cyan-400"
                                        />
                                    </label>
                                    <div className="block" />
                                </div>

                                <label className="block">
                                    <span className="text-sm text-gray-300">Address</span>
                                    <textarea
                                        name="shipping_address"
                                        value={shippingInfo.shipping_address}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-cyan-400 focus:ring-cyan-400"
                                    />
                                </label>

                                <div className="grid gap-4 md:grid-cols-3">
                                    <label className="block">
                                        <span className="text-sm text-gray-300">City</span>
                                        <input
                                            name="shipping_city"
                                            type="text"
                                            value={shippingInfo.shipping_city}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-cyan-400 focus:ring-cyan-400"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="text-sm text-gray-300">State</span>
                                        <input
                                            name="shipping_state"
                                            type="text"
                                            value={shippingInfo.shipping_state}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-cyan-400 focus:ring-cyan-400"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="text-sm text-gray-300">ZIP Code</span>
                                        <input
                                            name="shipping_zip"
                                            type="text"
                                            value={shippingInfo.shipping_zip}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-cyan-400 focus:ring-cyan-400"
                                        />
                                    </label>
                                </div>

                                <label className="block">
                                    <span className="text-sm text-gray-300">Country</span>
                                    <input
                                        name="shipping_country"
                                        type="text"
                                        value={shippingInfo.shipping_country}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-cyan-400 focus:ring-cyan-400"
                                    />
                                </label>

                                {paymentMethod === 'easypaisa' && (
                                    <p className="text-sm text-cyan-200 mb-3">
                                        EasyPaisa orders require a phone number. You will be redirected to the EasyPaisa payment flow after checkout.
                                    </p>
                                )}
                                {paymentMethod === 'bank_transfer' && (
                                    <p className="text-sm text-yellow-200 mb-3">
                                        You will receive bank transfer instructions by email after submitting your order.
                                    </p>
                                )}
                                {error && <p className="text-sm text-red-400">{error}</p>}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="inline-flex w-full justify-center rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {loading ? 'Processing...' : 'Proceed to Payment'}
                                </button>
                            </form>
                        </div>
                    </section>

                    <aside className="space-y-6">
                        <div className="bg-slate-900/60 border border-purple-500/30 rounded-3xl p-8 shadow-xl">
                            <h2 className="text-2xl font-semibold mb-4">Order Summary</h2>
                            {cartItems.length === 0 ? (
                                <p className="text-gray-400">Your cart is empty.</p>
                            ) : (
                                <div className="space-y-4">
                                    {cartItems.map((item) => (
                                        <div key={`${item.product.id}-${item.size}-${item.color}`} className="rounded-3xl bg-slate-950/70 p-4">
                                            <div className="flex items-start gap-4">
                                                <div className="h-16 w-16 overflow-hidden rounded-2xl bg-slate-800">
                                                    {item.product.image ? (
                                                        <img
                                                            src={item.product.image.startsWith('http') ? item.product.image : `http://localhost:8000${item.product.image}`}
                                                            alt={item.product.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full items-center justify-center text-gray-500">No Image</div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-base font-semibold text-white">{item.product.name}</h3>
                                                    {(() => {
                                        const productPrice = Number(item.product.price || 0);
                                        return (
                                            <>
                                                <p className="text-sm text-gray-400">{item.quantity} × ${productPrice.toFixed(2)}</p>
                                                {item.size && <p className="text-sm text-gray-500">Size: {item.size}</p>}
                                                {item.color && <p className="text-sm text-gray-500">Color: {item.color}</p>}
                                            </>
                                        );
                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="space-y-2 border-t border-slate-800 pt-4 text-sm text-gray-300">
                                        <div className="flex justify-between">
                                            <span>Subtotal</span>
                                            <span>${subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Shipping</span>
                                            <span>${shippingCost.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Tax</span>
                                            <span>${tax.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-lg font-semibold text-white pt-3">
                                            <span>Total</span>
                                            <span>${total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
};

export default Checkout;
