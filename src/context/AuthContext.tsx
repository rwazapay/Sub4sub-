import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { apiClient } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  updateUser: (userData: User) => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('subloop_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refetchUser = async () => {
    const savedToken = localStorage.getItem('subloop_token');
    if (!savedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await apiClient.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.data.user);
      } else {
        logout();
      }
    } catch {
      // Unauthenticated or invalid token session reset
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetchUser();
  }, []);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem('subloop_token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('subloop_token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        updateUser,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
