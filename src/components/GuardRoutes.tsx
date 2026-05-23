import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Role } from '../types';

export const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const RoleRoute = ({ children, roles }: { children: React.ReactNode; roles: Role[] }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }

  if (!user || !roles.includes(user.role)) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center text-center p-4">
        <h1 className="text-4xl font-bold text-destructive mb-2">403 Forbidden</h1>
        <p className="text-muted-foreground mb-4">Bạn không có quyền truy cập trang này.</p>
        <button 
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};
