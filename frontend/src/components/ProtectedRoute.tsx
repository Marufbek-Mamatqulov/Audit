import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/redux';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'manager' | 'user';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAppSelector(state => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // If user doesn't have required role, redirect to their appropriate dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
