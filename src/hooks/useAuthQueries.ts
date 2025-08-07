import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthService } from '../services/api';
import { useAuth } from './useAuth';
import type { LoginRequest } from '../types';

// Query keys for React Query
export const AUTH_QUERY_KEYS = {
  session: ['auth', 'session'],
  userProfile: ['auth', 'userProfile'],
} as const;

/**
 * Login mutation hook
 */
export const useLoginMutation = () => {
  const { login } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => AuthService.login(credentials),
    onSuccess: (data) => {
      // Store token and user data in auth context
      login(data.token, data.expires_at, data.user);
      
      // Invalidate and refetch auth-related queries
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.session });
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.userProfile });
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });
};

/**
 * Logout mutation hook
 */
export const useLogoutMutation = () => {
  const { logout } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => AuthService.logout(),
    onSuccess: () => {
      // Clear auth context
      logout();
      
      // Clear all cached data
      queryClient.clear();
    },
    onError: (error) => {
      console.error('Logout error:', error);
      // Still logout locally even if server request fails
      logout();
      queryClient.clear();
    },
  });
};

/**
 * Session validation query hook
 */
export const useSessionQuery = () => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: AUTH_QUERY_KEYS.session,
    queryFn: () => AuthService.getSession(),
    enabled: isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * User profile query hook
 */
export const useUserProfileQuery = () => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: AUTH_QUERY_KEYS.userProfile,
    queryFn: () => AuthService.getUserProfile(),
    enabled: isAuthenticated,
    retry: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Update user profile mutation hook
 */
export const useUpdateUserProfileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: AuthService.updateUserProfile,
    onSuccess: (data) => {
      // Update the cached user profile data
      queryClient.setQueryData(AUTH_QUERY_KEYS.userProfile, data);
      
      // Invalidate session to update user data in auth context
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.session });
    },
    onError: (error) => {
      console.error('Failed to update user profile:', error);
    },
  });
};