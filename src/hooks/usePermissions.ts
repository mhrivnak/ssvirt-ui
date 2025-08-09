import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { PermissionChecker } from '../utils/permissions';
import type { UserPermissions, EntityRef } from '../types';

/**
 * Hook to get comprehensive user permissions
 */
export const usePermissions = (): UserPermissions | null => {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) return null;
    return PermissionChecker.getUserPermissions(user);
  }, [user]);
};

/**
 * Hook to check if current user can create organizations
 */
export const useCanCreateOrganizations = (): boolean => {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) return false;
    return PermissionChecker.canCreateOrganizations(user);
  }, [user]);
};

/**
 * Hook to check if current user can manage users
 */
export const useCanManageUsers = (targetOrgId?: string): boolean => {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) return false;
    return PermissionChecker.canManageUsers(user, targetOrgId);
  }, [user, targetOrgId]);
};

/**
 * Hook to check if current user can manage system settings
 */
export const useCanManageSystem = (): boolean => {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) return false;
    return PermissionChecker.canManageSystem(user);
  }, [user]);
};

/**
 * Hook to check if current user can access organizations page
 */
export const useCanAccessOrganizations = (): boolean => {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) return false;
    return PermissionChecker.canAccessOrganizations(user);
  }, [user]);
};

/**
 * Hook to check if current user can manage a specific organization
 */
export const useCanManageOrganization = (orgId: string): boolean => {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user || !orgId) return false;
    return PermissionChecker.canManageOrganization(user, orgId);
  }, [user, orgId]);
};

/**
 * Hook to check if current user is a system administrator
 */
export const useIsSystemAdmin = (): boolean => {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) return false;
    return PermissionChecker.isSystemAdmin(user);
  }, [user]);
};

/**
 * Hook to check if current user is an organization administrator
 */
export const useIsOrgAdmin = (orgId?: string): boolean => {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) return false;
    return PermissionChecker.isOrgAdmin(user, orgId);
  }, [user, orgId]);
};

/**
 * Hook to check if current user has any administrative role
 */
export const useIsAdmin = (): boolean => {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) return false;
    return PermissionChecker.isAdmin(user);
  }, [user]);
};

/**
 * Hook to get current user's role names
 */
export const useUserRoleNames = (): string[] => {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) return [];
    return PermissionChecker.getUserRoleNames(user);
  }, [user]);
};

/**
 * Hook to get current user's highest privilege role
 */
export const useHighestRole = (): EntityRef | null => {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) return null;
    return PermissionChecker.getHighestRole(user);
  }, [user]);
};

/**
 * Hook to check if current user can perform action on target user
 */
export const useCanActOnUser = (
  targetUserId: string,
  action: 'view' | 'edit' | 'delete' | 'change_role'
): boolean => {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) return false;

    // For this hook, we need the target user object
    // In a real implementation, you might want to fetch the target user
    // or pass the target user object as a parameter
    // For now, we'll handle the simple case of self-actions
    if (action === 'view' || action === 'edit') {
      return user.id === targetUserId || PermissionChecker.isAdmin(user);
    }

    // For delete and change_role, only admins can act on others
    return user.id === targetUserId || PermissionChecker.isAdmin(user);
  }, [user, targetUserId, action]);
};

/**
 * Hook to get user's organization information
 */
export const useUserOrganization = (): EntityRef | null => {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) return null;
    return user.orgEntityRef;
  }, [user]);
};
