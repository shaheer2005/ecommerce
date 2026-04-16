import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const Wishlist = () => {
    const { wishlistItems, removeFromWishlist, getTotalWishlistItems } = useWishlist();
    const { addToCart } = useCart();
    const { addToast } = useToast();

    const handleRemoveItem = (productId) => {
        removeFromWishlist(productId);
        addToast('Item removed from wishlist', 'info');
    };

    const handleAddToCart = (product) => {
        addToCart(product, 1, '', '');
        addToast(`${product.name} added to cart!`, 'success');
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.4 }
        }
    };

    return ( <
        div className = "min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900" > { /* Background */ } <
        div className = "fixed inset-0 overflow-hidden pointer-events-none" >
        <
        motion.div className = "absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        animate = {
            { y: [0, 50, 0] } }
        transition = {
            { duration: 8, repeat: Infinity } }
        /> <
        motion.div className = "absolute bottom-20 right-10 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        animate = {
            { y: [0, -50, 0] } }
        transition = {
            { duration: 8, repeat: Infinity } }
        /> <
        /div>

        <
        main className = "relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" > { /* Header */ } <
        motion.div className = "text-center mb-12"
        initial = {
            { opacity: 0, y: -30 } }
        animate = {
            { opacity: 1, y: 0 } }
        transition = {
            { duration: 0.8 } } >
        <
        h1 className = "text-5xl md:text-6xl font-bold mb-4" >
        <
        span className = "bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent" >
        My Wishlist <
        /span> <
        /h1> <
        p className = "text-gray-300 text-lg" > { getTotalWishlistItems() }
        items saved < /p> <
        /motion.div>

        { /* Items */ } {
            wishlistItems.length === 0 ? ( <
                motion.div className = "text-center py-16"
                initial = {
                    { opacity: 0 } }
                animate = {
                    { opacity: 1 } } >
                <
                p className = "text-gray-400 text-lg mb-6" > Your wishlist is empty < /p> <
                Link to = "/"
                className = "px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-purple-500/50" >
                Continue Shopping <
                /Link> <
                /motion.div>
            ) : ( <
                motion.div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                variants = { containerVariants }
                initial = "hidden"
                animate = "visible" >
                {
                    wishlistItems.map(product => ( <
                        motion.div key = { product.id }
                        className = "group cursor-pointer"
                        variants = { itemVariants }
                        whileHover = {
                            { y: -10 } } >
                        <
                        div className = "relative h-64 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-2xl overflow-hidden border border-purple-500/30 group-hover:border-cyan-500/50 transition-all duration-300 mb-4" > {
                            product.image ? ( <
                                motion.img src = { `http://localhost:8000${product.image}` }
                                alt = { product.name }
                                className = "w-full h-full object-cover"
                                whileHover = {
                                    { scale: 1.1 } }
                                />
                            ) : ( <
                                div className = "w-full h-full flex items-center justify-center text-gray-500 text-4xl" > â¤ï¸
                                <
                                /div>
                            )
                        } <
                        /div>

                        <
                        h3 className = "text-lg font-bold text-white group-hover:text-cyan-400 transition-colors mb-2" > { product.name } <
                        /h3>

                        <
                        div className = "flex items-center justify-between mb-4" >
                        <
                        div className = "text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent" >
                        $ { parseFloat(product.price).toFixed(2) } <
                        /div> <
                        /div>

                        <
                        div className = "flex gap-2" >
                        <
                        motion.button onClick = {
                            () => handleAddToCart(product) }
                        className = "flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg text-white font-semibold text-sm hover:shadow-lg hover:shadow-purple-500/50"
                        whileHover = {
                            { scale: 1.05 } }
                        whileTap = {
                            { scale: 0.95 } } >
                        Add to Cart <
                        /motion.button> <
                        motion.button onClick = {
                            () => handleRemoveItem(product.id) }
                        className = "px-4 py-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg text-red-400 font-semibold text-sm"
                        whileTap = {
                            { scale: 0.95 } } >
                        Remove <
                        /motion.button> <
                        /div> <
                        /motion.div>
                    ))
                } <
                /motion.div>
            )
        } <
        /main> <
        /div>
    );
};

export default Wishlist;
