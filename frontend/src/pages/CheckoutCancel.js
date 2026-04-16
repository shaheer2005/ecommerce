import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const CheckoutCancel = () => {
    useEffect(() => {
        document.title = 'Checkout Cancelled | E-Shop Deluxe';
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', 'Your checkout was cancelled. You can return to your cart or continue shopping at E-Shop Deluxe.');
        }
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900 text-white flex items-center justify-center px-4 py-16">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl w-full rounded-3xl border border-red-500/20 bg-slate-900/90 p-10 shadow-2xl"
            >
                <div className="text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 text-red-300 text-4xl">
                        ✕
                    </div>
                    <h1 className="text-4xl font-bold mb-4">Checkout Cancelled</h1>
                    <p className="text-gray-300 leading-relaxed mb-8">
                        It looks like your checkout was not completed. You can return to your cart to review your order or continue browsing products.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Link
                            to="/cart"
                            className="inline-flex items-center justify-center rounded-full bg-red-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-red-400 transition"
                        >
                            Return to Cart
                        </Link>
                        <Link
                            to="/"
                            className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:border-red-400 hover:text-red-300 transition"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default CheckoutCancel;
