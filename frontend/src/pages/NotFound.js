import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFound = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900 text-white flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-xl text-center bg-slate-900/70 border border-purple-500/30 rounded-3xl p-10 shadow-2xl"
            >
                <h1 className="text-6xl font-bold mb-4">404</h1>
                <p className="text-xl text-gray-300 mb-6">Page not found. The page you are looking for does not exist.</p>
                <Link
                    to="/"
                    className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/40 transition-all"
                >
                    Go back to Home
                </Link>
            </motion.div>
        </div>
    );
};

export default NotFound;
