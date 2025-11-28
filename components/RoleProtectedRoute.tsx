import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface RoleProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: UserRole[];
  redirectPath?: string;
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ children, allowedRoles, redirectPath = '/' }) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="p-10 text-center text-slate-400">Checking access...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    if (redirectPath && redirectPath !== '/') {
      return <Navigate to={redirectPath} replace state={{ from: location.pathname, requiredRoles: allowedRoles }} />;
    }
    return <Navigate to="/access-denied" replace state={{ from: location.pathname, requiredRoles: allowedRoles }} />;
  }

  return children;
};

export default RoleProtectedRoute;
