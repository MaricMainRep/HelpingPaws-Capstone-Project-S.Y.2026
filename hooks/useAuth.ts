import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });
  const router = useRouter();

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  async function checkAuthStatus() {
    try {
      const userId = getCookie('user_id');
      const userRole = getCookie('user_role');

      if (userId && userRole) {
        // In a real app, fetch user data from server
        setAuth({
          user: {
            id: parseInt(userId),
            email: '',
            name: '',
            role: userRole as any,
            is_active: true,
            created_at: '',
            updated_at: '',
          },
          loading: false,
          error: null,
        });
      } else {
        setAuth((prev) => ({ ...prev, loading: false }));
      }
    } catch (err) {
      setAuth((prev) => ({
        ...prev,
        loading: false,
        error: 'Failed to check auth status',
      }));
    }
  }

  const register = useCallback(
    async (
      email: string,
      password: string,
      name: string,
      role: 'ADMIN' | 'STAFF' | 'PET_OWNER'
    ) => {
      try {
        setAuth((prev) => ({ ...prev, error: null }));

        const response = await fetch(`${API_URL}/api/auth/register/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name, role }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Registration failed');
        }

        setAuth({
          user: data.user,
          loading: false,
          error: null,
        });

        router.push('/dashboard');
        return { success: true, error: null };
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Registration failed';
        setAuth((prev) => ({ ...prev, error }));
        return { success: false, error };
      }
    },
    [router]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        setAuth((prev) => ({ ...prev, error: null }));

        const response = await fetch(`${API_URL}/api/auth/login/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Login failed');
        }

        setAuth({
          user: data.user,
          loading: false,
          error: null,
        });

        router.push('/dashboard');
        return { success: true, error: null };
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Login failed';
        setAuth((prev) => ({ ...prev, error }));
        return { success: false, error };
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout/`, { method: 'POST' });
      setAuth({ user: null, loading: false, error: null });
      router.push('/login');
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Logout failed';
      setAuth((prev) => ({ ...prev, error }));
    }
  }, [router]);

  return {
    ...auth,
    register,
    login,
    logout,
    isAuthenticated: !!auth.user,
  };
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}
