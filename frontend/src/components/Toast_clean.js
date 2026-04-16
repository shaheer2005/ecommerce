import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../context/ToastContext';

const Toast = () => {
    const { toasts, removeToast } = useToast();

    return ( <
        div className = "fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none" >
        <
        AnimatePresence > {
            toasts.map(toast => ( <
                motion.div key = { toast.id }
                initial = {
                    { opacity: 0, y: 20, x: 100 } }
                animate = {
                    { opacity: 1, y: 0, x: 0 } }
                exit = {
                    { opacity: 0, y: -20, x: 100 } }
                className = { `px-4 py-3 rounded-lg text-white font-semibold pointer-events-auto cursor-pointer ${
                            toast.type === 'success'
                                ? 'bg-green-500/80 backdrop-blur-sm'
                                : toast.type === 'error'
                                ? 'bg-red-500/80 backdrop-blur-sm'
                                : toast.type === 'info'
                                ? 'bg-blue-500/80 backdrop-blur-sm'
                                : 'bg-gray-500/80 backdrop-blur-sm'
                        }` }
                onClick = {
                    () => removeToast(toast.id) } >
                { toast.message } <
                /motion.div>
            ))
        } <
        /AnimatePresence> <
        /div>
    );
};

export default Toast;