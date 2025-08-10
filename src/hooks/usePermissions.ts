import { useQuery } from '@tanstack/react-query';
import { AuthService } from '../services';
import { QUERY_KEYS } from '../types';

/**
 * Hook to get current user permissions for role-based access control
 */
export const useUserPermissions = () => {
  return useQuery({
    queryKey: QUERY_KEYS.userPermissions, // Use distinct query key for permissions
    queryFn: () => AuthService.getCurrentUserPermissions(),
    staleTime: 10 * 60 * 1000, // Cache permissions for 10 minutes
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
    retry: 1, // Only retry once on failure
  });
};

/**
 * Hook to check if current user is a system administrator
 */
export const useIsSystemAdmin = () => {
  const { data: permissions, isLoading } = useUserPermissions();

  return {
    isSystemAdmin: permissions?.canManageSystem ?? false,
    isLoading,
  };
};

/**
 * Hook to get user's accessible organizations
 */
export const useUserOrganizations = () => {
  const { data: permissions, isLoading } = useUserPermissions();

  return {
    organizations: permissions?.accessibleOrganizations ?? [],
    isLoading,
  };
};

/**
 * Hook to check if user can perform VDC operations
 */
export const useVDCPermissions = () => {
  const { data: permissions, isLoading } = useUserPermissions();

  return {
    canViewVDCs: permissions?.canViewVDCs ?? false,
    canManageVDCs: permissions?.canManageVDCs ?? false,
    isLoading,
  };
};
