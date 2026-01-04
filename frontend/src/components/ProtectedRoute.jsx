import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, token, loading } = useContext(AuthContext);

    if (loading) return <div>Loading...</div>;

    // Check token presence first
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // Check if user data is loaded (might be null immediately after login if not set)
    if (!user) {
        // If token exists but user is null, we might be reloading. 
        // AuthContext usually handles this in useEffect but there's a small window.
        // Assuming AuthContext handles persistence correctly.
        return <div>Loading User...</div>;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect if role is not allowed
        return <Navigate to={user.role === 'Admin' ? '/admin' : '/dashboard'} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
