import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import apiClient from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const currentUser = await apiClient.getCurrentUser();
      setUser(currentUser);
      setIsAuthenticated(!!currentUser);
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    setError(null);
    setLoading(true);
    try {
      const { user } = await apiClient.login(email, password);
      setUser(user);
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function register(email: string, password: string, name: string, role: string) {
    setError(null);
    setLoading(true);
    try {
      const { user } = await apiClient.register(email, password, name, role);
      setUser(user);
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true);
    try {
      await apiClient.logout();
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}