import React from 'react';
import type { RoleCapabilities } from '../types';
import { ROLE_NAMES } from '../types';

export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  requiredRoles?: string[];
  requiredCapabilities?: (keyof RoleCapabilities)[];
  layout?: 'default' | 'minimal';
  exact?: boolean;
}

/**
 * Check if a role name matches a known role pattern (case-insensitive, flexible)
 */
const matchesRole = (roleName: string, expectedRole: string): boolean => {
  // Direct match
  if (roleName === expectedRole) return true;

  // Case insensitive match
  if (roleName.toLowerCase() === expectedRole.toLowerCase()) return true;

  // Check for common variations (remove spaces, punctuation)
  const normalizedRole = roleName.toLowerCase().replace(/[^a-z]/g, '');
  const normalizedExpected = expectedRole.toLowerCase().replace(/[^a-z]/g, '');

  return normalizedRole === normalizedExpected;
};

/**
 * Check if user has required roles for a route
 */
export const hasRequiredRoles = (
  userRoles: string[],
  requiredRoles?: string[]
): boolean => {
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  return requiredRoles.some((requiredRole) =>
    userRoles.some((userRole) => matchesRole(userRole, requiredRole))
  );
};

/**
 * Check if user has required capabilities for a route
 */
export const hasRequiredCapabilities = (
  capabilities: RoleCapabilities,
  requiredCapabilities?: (keyof RoleCapabilities)[]
): boolean => {
  if (!requiredCapabilities || requiredCapabilities.length === 0) {
    return true;
  }

  return requiredCapabilities.every((capability) => capabilities[capability]);
};

/**
 * Check if user can access a route
 */
export const canAccessRoute = (
  route: RouteConfig,
  userRoles: string[],
  capabilities: RoleCapabilities
): boolean => {
  const hasRoles = hasRequiredRoles(userRoles, route.requiredRoles);
  const hasCapabilities = hasRequiredCapabilities(
    capabilities,
    route.requiredCapabilities
  );

  return hasRoles && hasCapabilities;
};

/**
 * Get default route for user based on their highest priority role
 */
export const getDefaultRouteForUser = (userRoles: string[]): string => {
  if (userRoles.includes(ROLE_NAMES.SYSTEM_ADMIN)) {
    return '/dashboard';
  }

  if (userRoles.includes(ROLE_NAMES.ORG_ADMIN)) {
    return '/dashboard';
  }

  if (userRoles.includes(ROLE_NAMES.VAPP_USER)) {
    return '/dashboard';
  }

  // Fallback
  return '/dashboard';
};

/**
 * Role-based route configurations
 */
export const roleBasedRoutes: RouteConfig[] = [
  // Dashboard - all authenticated users
  {
    path: '/dashboard',
    component: React.lazy(() =>
      import('../pages/dashboard/RoleBasedDashboard').then((m) => ({
        default: m.RoleBasedDashboard,
      }))
    ),
  },

  // System Admin routes
  {
    path: '/admin/*',
    component: React.lazy(() => import('../pages/admin/AdminRoutes')),
    requiredRoles: [ROLE_NAMES.SYSTEM_ADMIN],
  },
  {
    path: '/organizations',
    component: React.lazy(() => import('../pages/organizations/Organizations')),
    requiredCapabilities: ['canManageOrganizations'],
  },
  {
    path: '/organizations/:id',
    component: React.lazy(
      () => import('../pages/organizations/OrganizationDetail')
    ),
    requiredCapabilities: ['canManageOrganizations'],
  },

  // Organization Admin routes
  {
    path: '/vdcs',
    component: React.lazy(() => import('../pages/vdcs/VDCs')),
    requiredCapabilities: ['canManageOrganizations'],
  },
  {
    path: '/vdcs/create',
    component: React.lazy(() => import('../pages/vdcs/VDCForm')),
    requiredCapabilities: ['canManageSystem'],
  },
  {
    path: '/vdcs/:id/edit',
    component: React.lazy(() => import('../pages/vdcs/VDCForm')),
    requiredCapabilities: ['canManageSystem'],
  },
  {
    path: '/vdcs/:id',
    component: React.lazy(() => import('../pages/vdcs/VDCDetail')),
    requiredCapabilities: ['canManageOrganizations'],
  },
  {
    path: '/org-users',
    component: React.lazy(
      () => import('../pages/organizations/OrganizationUsers')
    ),
    requiredCapabilities: ['canManageUsers'],
  },

  // Shared routes (multiple roles)
  {
    path: '/vms',
    component: React.lazy(() => import('../pages/vms/VMs')),
    requiredCapabilities: ['canManageVMs'],
  },
  {
    path: '/vms/:id',
    component: React.lazy(() => import('../pages/vms/VMDetail')),
    requiredCapabilities: ['canManageVMs'],
  },
  {
    path: '/vapps/:id',
    component: React.lazy(() => import('../pages/vapps/VAppDetail')),
    requiredCapabilities: ['canManageVMs'],
  },

  // vApp User specific routes
  {
    path: '/my-vms',
    component: React.lazy(() => import('../pages/vms/UserVMs')),
    requiredRoles: [
      ROLE_NAMES.VAPP_USER,
      ROLE_NAMES.ORG_ADMIN,
      ROLE_NAMES.SYSTEM_ADMIN,
    ],
  },

  // Catalogs (available to org admins and vApp users)
  {
    path: '/catalogs',
    component: React.lazy(() => import('../pages/catalogs/Catalogs')),
    requiredRoles: [ROLE_NAMES.ORG_ADMIN, ROLE_NAMES.VAPP_USER],
  },
  {
    path: '/catalogs/:id',
    component: React.lazy(() => import('../pages/catalogs/CatalogDetail')),
    requiredRoles: [ROLE_NAMES.ORG_ADMIN, ROLE_NAMES.VAPP_USER],
  },

  // Profile (all authenticated users)
  {
    path: '/profile',
    component: React.lazy(() => import('../pages/profile/UserProfile')),
  },

  // Debug route for testing
  {
    path: '/debug',
    component: React.lazy(() => import('../pages/debug/DebugRoute')),
  },

  // Reports (system and org admins)
  {
    path: '/reports/*',
    component: React.lazy(() => import('../pages/monitoring/MonitoringRoutes')),
    requiredCapabilities: ['canViewReports'],
  },
];

/**
 * Filter routes based on user capabilities
 */
export const getAccessibleRoutes = (
  userRoles: string[],
  capabilities: RoleCapabilities
): RouteConfig[] => {
  return roleBasedRoutes.filter((route) =>
    canAccessRoute(route, userRoles, capabilities)
  );
};
