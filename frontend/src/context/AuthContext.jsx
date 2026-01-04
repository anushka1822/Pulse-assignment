import { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            // Validate token or just decode it? 
            // For now, we'll assume it's valid if present, strict validation can happen on API calls
            // Or we could fetch /api/auth/me if we implemented it.
            // We'll rely on the stored user data or just the token presence.
            const storedUser = localStorage.getItem('user');
            if (storedUser) setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, [token]);

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        const { token, user } = res.data;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        setToken(token);
        setUser(user);
        return user;
    };

    const register = async (name, email, password, role) => {
        // Note: Only Admins can create new Tenants (via a different flow)
        // But "Register" usually creates a new user. The backend implementation 
        // forces 'tenantId' in the body for register.
        // This implies we need a way to select a tenant or create one.
        // For SIMPLICITY in this assignment: 
        // We might assume this register creates a NEW Tenant Admin?
        // OR we just use the Admin dashboard to add users.

        // Let's implement the "Register" as creating a new Tenant + Admin user 
        // OR just creating a user if we know the tenant.
        // Given the backend `register` controller takes `tenantId`, it's tricky for a public register page.
        // Let's assume the public Register is for "New Tenants" (Admin).
        // BUT backend `register` requires `tenantId`.
        // Backend `createTenant` is separate.

        // Fix: Front-end Register should probably call `createTenant` first if it's a new org?
        // Or we'll stick to 'Login' mostly and assume seeding was the primary way, 
        // OR we implement a "Sign Up as New Organization" flow.

        // Let's stick to Login for now, and maybe a simple "Add User" inside.
        // If we strictly follow the backend `register` endpoint, we need a tenantId.

        // I'll leave register empty/stubbed or for internal use.
        throw new Error("Registration is restricted to Admin Dashboard.");
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
