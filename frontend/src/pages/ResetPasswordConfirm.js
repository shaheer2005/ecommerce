import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const ResetPasswordConfirm = () => {
    const [searchParams] = useSearchParams();
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [uidb64, setUidb64] = useState('');
    const [token, setToken] = useState('');
    const { addToast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        setUidb64(searchParams.get('uidb64') || '');
        setToken(searchParams.get('token') || '');
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:8000/api/users/password_reset/confirm/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ uidb64, token, new_password: newPassword })
            });
            const data = await response.json();
            if (response.ok) {
                setMessage(data.detail);
                addToast('Password reset successfully. Please login.', 'success');
                setTimeout(() => navigate('/login'), 1500);
            } else {
                setError(data.detail || 'Password reset failed.');
                addToast(data.detail || 'Password reset failed.', 'error');
            }
        } catch (err) {
            setError('Password reset failed.');
            addToast('Password reset failed.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
                    animate={{ y: [0, 50, 0], x: [0, 30, 0] }}
                    transition={{ duration: 8, repeat: Infinity }}
                />
            </div>

            <motion.div className="relative z-10 w-full max-w-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <div className="bg-slate-900/50 border border-purple-500/30 rounded-2xl p-8 backdrop-blur-sm">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold mb-2 text-white">Set New Password</h1>
                        <p className="text-gray-400">Enter a new password to finish resetting your account.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {message && (
                            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-200 text-sm">
                                {message}
                            </div>
                        )}
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-200 text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-white mb-2">New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                                placeholder="Enter a new password"
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !uidb64 || !token}
                            className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-gray-400 text-sm">
                        <p>
                            Already have your new password?{' '}
                            <button type="button" onClick={() => navigate('/login')} className="text-cyan-400 hover:text-cyan-300 font-semibold">
                                Sign In
                            </button>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ResetPasswordConfirm;
