'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { apiFetch } from './api';
import { useRouter } from 'next/navigation';

interface ProUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ProContext {
  type: 'owner' | 'staff';
  professionalId: string;
  businessName: string;
  memberId: string | null;
  roleName: string;
  permissions: string[];
}

interface AuthContextType {
  user: ProUser | null;
  token: string | null;
  proContext: ProContext | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ProUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [proContext, setProContext] = useState<ProContext | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchProContext = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: ProContext }>('/api/pro/me');
      setProContext(res.data);
      localStorage.setItem('pro_context', JSON.stringify(res.data));
    } catch {
      // User might not have a pro profile
      setProContext(null);
    }
  }, []);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('pro_token');
      const savedUser = localStorage.getItem('pro_user');
      const savedContext = localStorage.getItem('pro_context');
      if (savedToken && savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.id) {
          setToken(savedToken);
          setUser(parsed);
          if (savedContext) {
            try { setProContext(JSON.parse(savedContext)); } catch {}
          }
          // Refresh pro context in background
          setTimeout(() => fetchProContext(), 500);
        } else {
          localStorage.removeItem('pro_token');
          localStorage.removeItem('pro_user');
          localStorage.removeItem('pro_context');
        }
      }
    } catch {
      localStorage.removeItem('pro_token');
      localStorage.removeItem('pro_user');
      localStorage.removeItem('pro_context');
    }
    setLoading(false);
  }, [fetchProContext]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<{ data: { user: ProUser; tokens: { accessToken: string } } }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const { user: loggedUser, tokens } = res.data;
    localStorage.setItem('pro_token', tokens.accessToken);
    localStorage.setItem('pro_user', JSON.stringify(loggedUser));
    setToken(tokens.accessToken);
    setUser(loggedUser);

    // Fetch pro context
    await fetchProContext();

    router.push('/');
  }, [router, fetchProContext]);

  const logout = useCallback(() => {
    localStorage.removeItem('pro_token');
    localStorage.removeItem('pro_user');
    localStorage.removeItem('pro_context');
    setToken(null);
    setUser(null);
    setProContext(null);
    router.push('/login');
  }, [router]);

  const hasPermission = useCallback((permission: string) => {
    if (!proContext) return false;
    if (proContext.permissions.includes('*')) return true;
    return proContext.permissions.includes(permission);
  }, [proContext]);

  const hasAnyPermission = useCallback((permissions: string[]) => {
    if (!proContext) return false;
    if (proContext.permissions.includes('*')) return true;
    return permissions.some((p) => proContext.permissions.includes(p));
  }, [proContext]);

  return (
    <AuthContext.Provider value={{ user, token, proContext, loading, login, logout, hasPermission, hasAnyPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
