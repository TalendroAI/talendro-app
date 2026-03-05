import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

/**
 * ProtectedRoute — wraps any route that requires authentication.
 * 
 * If the user is not authenticated, they are redirected to /auth/sign-in
 * with the current path saved as `?next=...` so they can be returned
 * after login.
 * 
 * While auth state is loading (initial localStorage restore), renders
 * a minimal loading screen to avoid flash-of-redirect.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#F9FAFB',
        fontFamily: 'sans-serif',
        color: '#9FA6B2',
        fontSize: '14px'
      }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/auth/sign-in?next=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  return children;
}
