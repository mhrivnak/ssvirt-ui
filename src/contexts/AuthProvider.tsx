import React, { useEffect, useState } from 'react';
import type { User } from '../types';
import { AuthContext, type AuthContextType } from './AuthContext';
import { 
  storeToken, 
  removeStoredToken, 
  isAuthenticated as checkIsAuthenticated,
  getCurrentUser
} from '../utils/auth';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize authentication state from stored token
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const authenticated = checkIsAuthenticated();
        setIsAuthenticated(authenticated);
        
        if (authenticated) {
          const currentUser = getCurrentUser();
          setUser(currentUser as User | null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (token: string, expiresAt: string, userData: User) => {
    try {
      storeToken(token, expiresAt);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = () => {
    try {
      removeStoredToken();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const refreshUser = () => {
    try {
      if (checkIsAuthenticated()) {
        const currentUser = getCurrentUser();
        setUser(currentUser as User | null);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      logout();
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

