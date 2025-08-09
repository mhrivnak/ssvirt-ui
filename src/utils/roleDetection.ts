import type { SessionResponse, RoleCapabilities } from '../types';
import { ROLE_NAMES } from '../types';

/**
 * Determine user capabilities based on VMware Cloud Director session response
 */
export function determineUserCapabilities(
  sessionResponse: SessionResponse
): RoleCapabilities {
  const roles = sessionResponse.roles;

  return {
    canManageSystem: roles.includes(ROLE_NAMES.SYSTEM_ADMIN),
    canManageOrganizations:
      roles.includes(ROLE_NAMES.SYSTEM_ADMIN) ||
      roles.includes(ROLE_NAMES.ORG_ADMIN),
    canCreateOrganizations: roles.includes(ROLE_NAMES.SYSTEM_ADMIN),
    canManageUsers:
      roles.includes(ROLE_NAMES.SYSTEM_ADMIN) ||
      roles.includes(ROLE_NAMES.ORG_ADMIN),
    canManageVMs: roles.some((role) =>
      [
        ROLE_NAMES.SYSTEM_ADMIN,
        ROLE_NAMES.ORG_ADMIN,
        ROLE_NAMES.VAPP_USER,
      ].includes(role)
    ),
    canViewReports:
      roles.includes(ROLE_NAMES.SYSTEM_ADMIN) ||
      roles.includes(ROLE_NAMES.ORG_ADMIN),
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
  return priorityOrder.find((role) => roles.includes(role)) || roles[0];
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
