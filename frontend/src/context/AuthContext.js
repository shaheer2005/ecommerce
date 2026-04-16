import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('authToken'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
            setToken(storedToken);
            fetchUserProfile(storedToken);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUserProfile = async(authToken) => {
        try {
            const response = await fetch('http://localhost:8000/api/users/profile/', {
                headers: {
                    'Authorization': `Token ${authToken}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setUser(data);
            } else {
                localStorage.removeItem('authToken');
                setToken(null);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            localStorage.removeItem('authToken');
            setToken(null);
        } finally {
            setLoading(false);
        }
    };

    const register = async(username, email, password) => {
        try {
            const response = await fetch('http://localhost:8000/api/users/register/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            if (response.ok) {
                return { success: true };
            } else {
                const error = await response.json();
                return { success: false, error };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const login = async(username, password) => {
        try {
            const response = await fetch('http://localhost:8000/api/users/login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            if (response.ok) {
                const data = await response.json();
                const authToken = data.token;
                localStorage.setItem('authToken', authToken);
                setToken(authToken);
                await fetchUserProfile(authToken);
                return { success: true };
            } else {
                const error = await response.json();
                return { success: false, error };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, register, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};
