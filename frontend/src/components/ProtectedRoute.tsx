import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Store the attempted URL for redirecting after login
    localStorage.setItem('redirectPath', location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}; 