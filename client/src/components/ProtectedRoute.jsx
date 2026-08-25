import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute — wraps dashboard pages.
 * Redirects to /login if no valid token exists in localStorage.
 */
export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('mchicks_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
