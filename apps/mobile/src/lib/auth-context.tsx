import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiFetch, getToken, setToken, removeToken, AuthError } from './api-client';
import { API_ENDPOINTS } from '../constants/api';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const refreshUser = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setState({ user: null, isLoading: false, isAuthenticated: false });
        return;
      }
      const user = await apiFetch<User>(API_ENDPOINTS.profile);
      setState({ user, isLoading: false, isAuthenticated: true });
    } catch (error) {
      if (error instanceof AuthError) {
        await removeToken();
      }
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiFetch<{ token?: string }>(API_ENDPOINTS.login, {
      method: 'POST',
      body: { email, pass: password },
    });

    // The API sets a cookie — we also store the JWT for mobile use
    if (response.token) {
      await setToken(response.token);
    }

    await refreshUser();
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      await apiFetch(API_ENDPOINTS.logout, { method: 'POST' });
    } catch {
      // Ignore errors on logout
    }
    await removeToken();
    setState({ user: null, isLoading: false, isAuthenticated: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
