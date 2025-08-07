import { createContext } from 'react';
import type { User } from '../types';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, expiresAt: string, user: User) => void;
  logout: () => void;
  refreshUser: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
