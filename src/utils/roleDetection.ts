import type { SessionResponse, RoleCapabilities } from '../types';
import { ROLE_NAMES } from '../types';

/**
 * Check if a role name matches a known role pattern
 */
function matchesRole(roleName: string, expectedRole: string): boolean {
  // Direct match
  if (roleName === expectedRole) return true;
  
  // Case insensitive match
  if (roleName.toLowerCase() === expectedRole.toLowerCase()) return true;
  
  // Check for common variations
  const normalizedRole = roleName.toLowerCase().replace(/[^a-z]/g, '');
  const normalizedExpected = expectedRole.toLowerCase().replace(/[^a-z]/g, '');
  
  return normalizedRole === normalizedExpected;
}

/**
 * Check if user has a specific role type
 */
function hasRoleType(roles: string[], roleType: string): boolean {
  return roles.some(role => matchesRole(role, roleType));
}

/**
 * Determine user capabilities based on VMware Cloud Director session response
 */
export function determineUserCapabilities(
  sessionResponse: SessionResponse
): RoleCapabilities {
  const roles = sessionResponse.roles;
  
  // Debug logging to help identify role format issues
  console.log('🔍 Session roles:', roles);
  console.log('🔍 Expected role constants:', ROLE_NAMES);

  const isSystemAdmin = hasRoleType(roles, ROLE_NAMES.SYSTEM_ADMIN);
  const isOrgAdmin = hasRoleType(roles, ROLE_NAMES.ORG_ADMIN);
  const isVappUser = hasRoleType(roles, ROLE_NAMES.VAPP_USER);

  console.log('🔍 Role matches:', { isSystemAdmin, isOrgAdmin, isVappUser });

  return {
    canManageSystem: isSystemAdmin,
    canManageOrganizations: isSystemAdmin || isOrgAdmin,
    canCreateOrganizations: isSystemAdmin,
    canManageUsers: isSystemAdmin || isOrgAdmin,
    canManageVMs: isSystemAdmin || isOrgAdmin || isVappUser,
    canViewReports: isSystemAdmin || isOrgAdmin,
    primaryOrganization: sessionResponse.org.id,
    operatingOrganization: sessionResponse.operatingOrg?.id,
  };
}

/**
 * Get the highest priority role for initial role selection
 */
export function getHighestPriorityRole(roles: string[]): string {
  const priorityOrder = [
    ROLE_NAMES.SYSTEM_ADMIN,
    ROLE_NAMES.ORG_ADMIN,
    ROLE_NAMES.VAPP_USER,
  ];
  
  // Find the highest priority role that matches
  for (const expectedRole of priorityOrder) {
    if (hasRoleType(roles, expectedRole)) {
      // Return the actual role name from the session, not the constant
      return roles.find(role => matchesRole(role, expectedRole)) || expectedRole;
    }
  }
  
  return roles[0] || '';
}

/**
 * Get role description for UI display
 */
export function getRoleDescription(role: string): string {
  switch (role) {
    case ROLE_NAMES.SYSTEM_ADMIN:
      return 'Full system administration and organization management';
    case ROLE_NAMES.ORG_ADMIN:
      return 'Organization and resource management';
    case ROLE_NAMES.VAPP_USER:
      return 'Virtual machine and application management';
    default:
      return 'Standard user access';
  }
}

/**
 * Get role icon component name for UI display
 */
export function getRoleIconName(role: string): string {
  switch (role) {
    case ROLE_NAMES.SYSTEM_ADMIN:
      return 'CogIcon';
    case ROLE_NAMES.ORG_ADMIN:
      return 'BuildingIcon';
    case ROLE_NAMES.VAPP_USER:
      return 'VirtualMachineIcon';
    default:
      return 'UserIcon';
  }
}
