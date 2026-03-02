'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { shouldUseMockMode, setAppMode, getAppMode } from './config/app-mode';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'agent' | 'customer';
  tenantId?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithUserData: (userData: any, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  mockMode: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [mockMode, setMockMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('user');
    const storedMode = getAppMode();

    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setMockMode(storedMode === 'mock');
    }
    setLoading(false);
  }, []);

  const loginWithUserData = (userData: any, token: string) => {
    const realUser: User = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      tenantId: userData.tenantId,
    };

    localStorage.setItem('user', JSON.stringify(realUser));
    localStorage.setItem('token', token);
    setAppMode('real');
    setUser(realUser);
    setMockMode(false);
  };

  const login = async (email: string, password: string) => {
    try {
      // Call the login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok && result.user) {
        loginWithUserData(result.user, result.token);
      } else {
        throw new Error(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setAppMode('real');
    setUser(null);
    setMockMode(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      loginWithUserData,
      logout,
      isAuthenticated: !!user,
      mockMode,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    console.error('useAuth must be used within AuthProvider. Make sure your component is wrapped with AuthProvider.');
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
