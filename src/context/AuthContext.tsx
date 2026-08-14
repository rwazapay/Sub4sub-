import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { apiClient } from '../services/api';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';

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
  const getInitialUser = (): User | null => {
    try {
      const stored = localStorage.getItem('subloop_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const [user, setUser] = useState<User | null>(getInitialUser);
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
        localStorage.setItem('subloop_user', JSON.stringify(res.data.data.user));
      } else {
        logout();
      }
    } catch (err: any) {
      // If 401 Unauthorized from server, log out. If network error, preserve cached user
      if (err.response && err.response.status === 401) {
        logout();
      } else {
        const cached = getInitialUser();
        if (cached) {
          setUser(cached);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetchUser();

    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.email && !localStorage.getItem('subloop_token')) {
        const fallbackUser: User = {
          id: `usr_${firebaseUser.uid}`,
          username: (firebaseUser.displayName || firebaseUser.email.split('@')[0]).toLowerCase().replace(/[^a-z0-9_]/g, ''),
          displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          email: firebaseUser.email,
          country: 'Rwanda',
          role: 'user',
          status: 'active',
          avatar: firebaseUser.photoURL || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
          bio: `Passionate creator growing with the community`,
          creatorCategory: 'Technology',
          credits: 250,
          totalCreditsEarned: 250,
          totalCreditsSpent: 0,
          level: 1,
          reputation: 80,
          referralCode: `SUB-CREATOR`,
          referralCount: 0,
          referralRewardsEarned: 0,
          streakDays: 1,
          dailyRewardClaimedToday: false,
          dailyDiscoveryCountToday: 0,
          riskScore: 0,
          isPro: false,
          createdAt: new Date().toISOString(),
        };

        const fallbackToken = `g_auth_token_${firebaseUser.uid}_${Date.now()}`;
        login(fallbackToken, fallbackUser);

        try {
          const res = await apiClient.post('/auth/google', {
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            picture: firebaseUser.photoURL || fallbackUser.avatar,
            googleId: firebaseUser.uid,
          });
          if (res.data.success) {
            login(res.data.data.token, res.data.data.user);
          }
        } catch (err) {
          console.warn('Firebase Auth state sync notice (using local session):', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem('subloop_token', newToken);
    localStorage.setItem('subloop_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('subloop_token');
    localStorage.removeItem('subloop_user');
    setToken(null);
    setUser(null);
    firebaseSignOut(auth).catch(() => {});
  };

  const updateUser = (updatedUser: User) => {
    localStorage.setItem('subloop_user', JSON.stringify(updatedUser));
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
