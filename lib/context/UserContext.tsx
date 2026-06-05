'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@/lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface UserContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try cookie auth first
    fetch(`${API_URL}/api/auth/me/`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        } else {
          // Fallback: check localStorage for token
          const token = localStorage.getItem('auth_token');
          const userId = localStorage.getItem('user_id');
          const userRole = localStorage.getItem('user_role');
          
          if (token && userId && userRole) {
            setUser({ 
              id: parseInt(userId), 
              role: userRole as any, 
              name: '', 
              email: '', 
              is_active: true,
              created_at: '',
              updated_at: ''
            } as any);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout/`, { method: 'POST', credentials: 'include' });
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_role');
      setUser(null);
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    
    const res = await fetch(`${API_URL}/api/users/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, ...updates }),
      credentials: 'include',
    });

    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
    } else {
      throw new Error('Failed to update profile');
    }
  };

  return (
    <UserContext.Provider value={{ user, loading, logout, updateProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
