import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900 py-16 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <motion.div className="text-center mb-16"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                        Profile
                    </h1>
                    <p className="text-gray-400">Manage your account</p>
                </motion.div>

                {/* Profile Card */}
                <motion.div className="bg-slate-900/50 border border-purple-500/30 rounded-2xl p-12"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* User Avatar & Name */}
                    <motion.div className="text-center mb-8"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <div className="bg-slate-900/50 border border-purple-500/30 rounded-xl p-8">
                            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full mb-4 flex items-center justify-center mx-auto">
                                <span className="text-3xl">??</span>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">
                                {user?.username}
                            </h2>
                            <p className="text-gray-400 mb-4">
                                {user?.email}
                            </p>
                            <div className="space-y-2 text-sm text-gray-400">
                                <p>Account Status: <span className="text-green-400">Active</span></p>
                                <p>Member Since: <span className="text-cyan-400">2024</span></p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Navigation Links */}
                    <motion.div className="space-y-4 mb-8"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        <Link to="/cart" className="block p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 transition text-cyan-400 font-semibold">
                            View Cart
                        </Link>
                        <Link to="/wishlist" className="block p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 transition text-cyan-400 font-semibold">
                            View Wishlist
                        </Link>
                        {user?.is_staff && (
                            <>
                                <Link to="/admin/dashboard" className="block p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/20 transition text-white font-semibold">
                                    Admin Dashboard
                                </Link>
                                <Link to="/admin/orders" className="block p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/20 transition text-white font-semibold">
                                    Admin Order Dashboard
                                </Link>
                            </>
                        )}
                    </motion.div>

                    {/* Logout Button */}
                    <motion.button onClick={handleLogout}
                        className="w-full py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-500 text-white font-bold hover:shadow-lg hover:shadow-red-500/50 transition-all"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        Logout
                    </motion.button>
                </motion.div>
            </div>
        </div>
    );
};

export default Profile;
