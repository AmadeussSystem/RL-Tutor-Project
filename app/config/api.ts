/**
 * API Configuration
 * Centralized API URL configuration for the frontend application
 */

// Get the API base URL from environment variable
// For production, this should be set in Vercel environment variables
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002';

// Full API base path including version
export const API_BASE = `${API_URL}/api/v1`;

// Helper function to get authorization headers
export const getAuthHeaders = (token?: string | null) => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
};

// Helper function to get token from localStorage (client-side only)
export const getStoredToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('token');
    }
    return null;
};
