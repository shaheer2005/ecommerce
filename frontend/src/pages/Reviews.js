import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Reviews = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const { addToast } = useToast();

    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [rating, setRating] = useState(5);
    const [title, setTitle] = useState('');
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchProduct = useCallback(async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/catalog/products/${id}/`);
            if (!response.ok) {
                throw new Error('Unable to load product details.');
            }
            const data = await response.json();
            setProduct(data);
        } catch (err) {
            setError(err.message);
        }
    }, [id]);

    const fetchReviews = useCallback(async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/catalog/products/${id}/reviews/`);
            if (!response.ok) {
                throw new Error('Unable to load reviews.');
            }
            const data = await response.json();
            setReviews(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchProduct();
        fetchReviews();
    }, [fetchProduct, fetchReviews]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!token) {
            navigate('/login');
            return;
        }

        setSubmitLoading(true);
        setError(null);

        try {
            const response = await fetch(`http://localhost:8000/api/catalog/products/${id}/reviews/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Token ${token}`,
                },
                body: JSON.stringify({ rating, title, comment }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Unable to submit review.');
            }

            const newReview = await response.json();
            setReviews((prev) => [newReview, ...prev]);
            setTitle('');
            setComment('');
            setRating(5);
            addToast('Review submitted successfully.', 'success');
        } catch (err) {
            setError(err.message);
            addToast(err.message, 'error');
        } finally {
            setSubmitLoading(false);
        }
    };

    const renderStars = (value) => (
        <div className="flex text-yellow-400">{[...Array(5)].map((_, index) => (
            <span key={index} className={index < value ? 'text-yellow-400' : 'text-gray-600'}>
                ★
            </span>
        ))}</div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
                    animate={{ y: [0, 50, 0] }}
                    transition={{ duration: 8, repeat: Infinity }}
                />
            </div>

            <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-5xl font-bold text-white mb-3">Product Reviews</h1>
                        <p className="text-gray-400 max-w-2xl">
                            Share your experience and read what others are saying about this product.
                        </p>
                    </div>
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition"
                    >
                        Back to Shop
                    </Link>
                </div>

                {error && (
                    <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
                        {error}
                    </div>
                )}

                <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
                    <section className="space-y-6">
                        <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h2 className="text-2xl font-semibold text-white">{product?.name || 'Loading product...'}</h2>
                                    <p className="text-gray-400 mt-1">{product?.category_name || ''}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-400">Average Rating</div>
                                    <div className="text-3xl font-bold text-white">
                                        {product ? product.rating.toFixed(1) : '—'}
                                    </div>
                                </div>
                            </div>
                            {product?.image && (
                                <img
                                    src={product.image.startsWith('http') ? product.image : `http://localhost:8000${product.image}`}
                                    alt={product.name}
                                    className="mt-6 h-64 w-full rounded-3xl object-cover"
                                />
                            )}
                        </div>

                        <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
                            <div className="mb-5 flex items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-xl font-semibold text-white">Write a review</h3>
                                    <p className="text-gray-500 text-sm">Help other shoppers by sharing your experience.</p>
                                </div>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <label className="block text-sm font-semibold text-gray-300">Rating</label>
                                <select
                                    value={rating}
                                    onChange={(e) => setRating(Number(e.target.value))}
                                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
                                >
                                    {[5, 4, 3, 2, 1].map((value) => (
                                        <option key={value} value={value}>
                                            {value} star{value !== 1 && 's'}
                                        </option>
                                    ))}
                                </select>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-300">Title</label>
                                    <input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Short summary"
                                        className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-300">Comment</label>
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        rows={5}
                                        placeholder="Write your review here..."
                                        className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitLoading}
                                    className="inline-flex items-center justify-center rounded-2xl bg-purple-600 px-6 py-3 text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {submitLoading ? 'Submitting...' : 'Submit review'}
                                </button>
                            </form>
                        </div>
                    </section>

                    <section className="space-y-6">
                        <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-semibold text-white">Recent reviews</h3>
                                    <p className="text-gray-500 text-sm">{reviews.length} review{reviews.length === 1 ? '' : 's'}</p>
                                </div>
                            </div>

                            {loading ? (
                                <div className="text-gray-400">Loading reviews...</div>
                            ) : reviews.length === 0 ? (
                                <div className="text-gray-400">No reviews yet. Be the first to rate this product.</div>
                            ) : (
                                <div className="space-y-4">
                                    {reviews.map((review) => (
                                        <div key={review.id} className="rounded-3xl border border-white/10 bg-slate-900 p-5">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <div className="text-sm font-semibold text-white">{review.user}</div>
                                                    <div className="text-gray-400 text-sm">{new Date(review.created_at).toLocaleDateString()}</div>
                                                </div>
                                                {renderStars(review.rating)}
                                            </div>
                                            {review.title && <h4 className="mt-3 text-lg font-semibold text-white">{review.title}</h4>}
                                            {review.comment && <p className="mt-2 text-gray-300">{review.comment}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default Reviews;
