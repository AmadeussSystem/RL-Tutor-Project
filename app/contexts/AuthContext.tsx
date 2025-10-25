'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, TokenResponse, Student } from '@/app/api/client';

interface AuthContextType {
    user: string | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    register: (email: string, username: string, password: string, fullName?: string) => Promise<void>;
    logout: () => void;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load user from localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('username');
        const storedToken = localStorage.getItem('token');

        if (storedUser && storedToken) {
            setUser(storedUser);
            setToken(storedToken);
        }

        setIsLoading(false);
    }, []);

    const login = async (username: string, password: string) => {
        try {
            setError(null);
            setIsLoading(true);

            const response = await api.login({ username, password });

            localStorage.setItem('username', username);
            localStorage.setItem('token', response.access_token);

            // Store token expiration (24 hours from now - matches backend default)
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);
            localStorage.setItem('tokenExpiresAt', expiresAt.toISOString());

            setUser(username);
            setToken(response.access_token);
        } catch (err: any) {
            setError(err.message || 'Login failed');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (
        email: string,
        username: string,
        password: string,
        fullName?: string
    ) => {
        try {
            setError(null);
            setIsLoading(true);

            const response = await api.register({
                email,
                username,
                password,
                full_name: fullName,
            });

            localStorage.setItem('username', username);
            localStorage.setItem('token', response.access_token);

            // Store token expiration (24 hours from now - matches backend default)
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);
            localStorage.setItem('tokenExpiresAt', expiresAt.toISOString());

            setUser(username);
            setToken(response.access_token);
        } catch (err: any) {
            setError(err.message || 'Registration failed');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('username');
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiresAt');
        setUser(null);
        setToken(null);
        setError(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!user,
                isLoading,
                login,
                register,
                logout,
                error,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
