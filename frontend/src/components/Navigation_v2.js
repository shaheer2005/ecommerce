import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navigation = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const { getTotalItems } = useCart();
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();
    const cartCount = getTotalItems();

    const handleLogout = () => {
        logout();
        navigate('/');
        setMenuOpen(false);
    };

    return ( <
        motion.header className = "relative z-50 backdrop-blur-sm bg-black/20 border-b border-purple-500/20 sticky top-0"
        initial = {
            { opacity: 0, y: -20 } }
        animate = {
            { opacity: 1, y: 0 } }
        transition = {
            { duration: 0.8 } } >
        <
        div className = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4" >
        <
        div className = "flex items-center justify-between" > { /* Logo */ } <
        Link to = "/"
        className = "flex items-center space-x-3" >
        <
        motion.div className = "w-10 h-10 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center"
        whileHover = {
            { scale: 1.1, rotate: 5 } }
        whileTap = {
            { scale: 0.95 } } >
        <
        span className = "text-white font-bold text-lg" > ✨ < /span> <
        /motion.div> <
        h1 className = "text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent" >
        Premium Shop <
        /h1> <
        /Link>

        { /* Desktop Navigation */ } <
        div className = "hidden md:flex items-center space-x-6" >
        <
        Link to = "/"
        className = "text-gray-300 hover:text-cyan-400 transition" >
        Home <
        /Link> {
            isAuthenticated && ( <
                >
                <
                Link to = "/cart"
                className = "relative text-gray-300 hover:text-cyan-400 transition flex items-center space-x-2" >
                <
                span > Cart < /span> {
                    cartCount > 0 && ( <
                        motion.span className = "absolute -top-2 -right-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full"
                        initial = {
                            { scale: 0 } }
                        animate = {
                            { scale: 1 } } >
                        { cartCount } <
                        /motion.span>
                    )
                } <
                /Link> <
                Link to = "/wishlist"
                className = "text-gray-300 hover:text-cyan-400 transition" >
                Wishlist <
                /Link> <
                Link to = "/profile"
                className = "text-gray-300 hover:text-cyan-400 transition" >
                Profile <
                /Link> <
                />
            )
        } <
        /div>

        { /* Auth Buttons */ } <
        div className = "flex items-center space-x-4" > {
            isAuthenticated ? ( <
                motion.div className = "flex items-center space-x-4"
                initial = {
                    { opacity: 0, x: 20 } }
                animate = {
                    { opacity: 1, x: 0 } } >
                <
                span className = "text-sm text-gray-400 hidden sm:inline" >
                Welcome, < span className = "text-cyan-400 font-semibold" > { user ? .username } < /span> <
                /span> <
                motion.button onClick = { handleLogout }
                className = "px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all"
                whileHover = {
                    { scale: 1.05 } }
                whileTap = {
                    { scale: 0.95 } } >
                Logout <
                /motion.button> <
                /motion.div>
            ) : ( <
                motion.div className = "flex items-center space-x-3"
                initial = {
                    { opacity: 0, x: 20 } }
                animate = {
                    { opacity: 1, x: 0 } } >
                <
                Link to = "/login"
                className = "px-4 py-2 text-white border border-purple-500/50 rounded-lg hover:bg-purple-500/10 transition" >
                Login <
                /Link> <
                Link to = "/register"
                className = "px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all" >
                Sign Up <
                /Link> <
                /motion.div>
            )
        }

        { /* Mobile Menu Button */ } <
        motion.button onClick = {
            () => setMenuOpen(!menuOpen) }
        className = "md:hidden p-2 text-cyan-400"
        whileTap = {
            { scale: 0.95 } } >
        <
        svg className = "w-6 h-6"
        fill = "none"
        stroke = "currentColor"
        viewBox = "0 0 24 24" >
        <
        path strokeLinecap = "round"
        strokeLinejoin = "round"
        strokeWidth = { 2 }
        d = "M4 6h16M4 12h16M4 18h16" / >
        <
        /svg> <
        /motion.button> <
        /div> <
        /div>

        { /* Mobile Menu */ } <
        AnimatePresence > {
            menuOpen && ( <
                motion.div className = "md:hidden mt-4 space-y-3"
                initial = {
                    { opacity: 0, y: -10 } }
                animate = {
                    { opacity: 1, y: 0 } }
                exit = {
                    { opacity: 0, y: -10 } } >
                <
                Link to = "/"
                onClick = {
                    () => setMenuOpen(false) }
                className = "block text-gray-300 hover:text-cyan-400 py-2" >
                Home <
                /Link> {
                    isAuthenticated && ( <
                        >
                        <
                        Link to = "/cart"
                        onClick = {
                            () => setMenuOpen(false) }
                        className = "block text-gray-300 hover:text-cyan-400 py-2" >
                        Cart { cartCount > 0 && `(${cartCount})` } <
                        /Link> <
                        Link to = "/wishlist"
                        onClick = {
                            () => setMenuOpen(false) }
                        className = "block text-gray-300 hover:text-cyan-400 py-2" >
                        Wishlist <
                        /Link> <
                        Link to = "/profile"
                        onClick = {
                            () => setMenuOpen(false) }
                        className = "block text-gray-300 hover:text-cyan-400 py-2" >
                        Profile <
                        /Link> <
                        />
                    )
                } <
                /motion.div>
            )
        } <
        /AnimatePresence> <
        /div> <
        /motion.header>
    );
};

export default Navigation;