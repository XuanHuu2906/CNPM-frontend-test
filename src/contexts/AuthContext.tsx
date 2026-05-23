import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '../types';
import apiClient from '../services/apiClient';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

const mapBackendRoleToFrontend = (backendRole: string): string => {
  switch (backendRole) {
    case 'STUDENT': return 'SINH_VIEN';
    case 'TEACHER': return 'GIANG_VIEN';
    case 'ACADEMIC_DEPT': return 'PHONG_DAO_TAO';
    case 'ADMIN': return 'ADMIN';
    default: return backendRole;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await apiClient.get('/users/profile');
        const profileData = res.data.data;
        // Translate backend role to frontend format
        if (profileData?.role) {
          profileData.role = mapBackendRoleToFrontend(profileData.role);
        }
        setUser(profileData);
        localStorage.setItem('user', JSON.stringify(profileData));
      } catch (error) {
        console.error("Failed to fetch user data", error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  // Listen for 401 from any API call (handled by apiClient interceptor)
  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = (newToken: string, userData: any) => {
    const translatedUser = {
      ...userData,
      role: mapBackendRoleToFrontend(userData.role)
    };

    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(translatedUser));
    setToken(newToken);
    setUser(translatedUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
