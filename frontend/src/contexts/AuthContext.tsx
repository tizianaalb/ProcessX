import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { User, LoginData, RegisterData } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const storedToken = localStorage.getItem('auth_token');
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    const tokenExpiration = localStorage.getItem('tokenExpiration');

    // Check if Remember Me was enabled and token hasn't expired
    if (storedToken) {
      // If Remember Me is enabled, check expiration
      if (rememberMe && tokenExpiration) {
        const expirationDate = new Date(tokenExpiration);
        const now = new Date();

        // If token has expired, clear it
        if (now > expirationDate) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('tokenExpiration');
          setToken(null);
          setLoading(false);
          return;
        }
      }

      setToken(storedToken);
      // Verify token and get user data
      api
        .getCurrentUser()
        .then((response) => {
          setUser(response.user);
        })
        .catch(() => {
          // Token invalid, clear it
          localStorage.removeItem('auth_token');
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('tokenExpiration');
          setToken(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (data: LoginData) => {
    try {
      const response = await api.login(data);
      localStorage.setItem('auth_token', response.token);
      setToken(response.token);
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await api.register(data);
      localStorage.setItem('auth_token', response.token);
      setToken(response.token);
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('tokenExpiration');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
