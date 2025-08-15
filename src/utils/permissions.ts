import type { User, UserPermissions, EntityRef } from '../types';
import { ROLE_NAMES } from '../types';

/**
 * Permission checking utilities for VMware Cloud Director-compatible user roles
 */
export class PermissionChecker {
  /**
   * Check if user has System Administrator role
   */
  static isSystemAdmin(user: User): boolean {
    return (
      user.roleEntityRefs?.some(
        (role) => role.name === ROLE_NAMES.SYSTEM_ADMIN
      ) ?? false
    );
  }

  /**
   * Check if user has Organization Administrator role
   * @param user User to check
   * @param orgId Optional organization ID to check against user's org
   */
  static isOrgAdmin(user: User, orgId?: string): boolean {
    const hasOrgAdminRole =
      user.roleEntityRefs?.some((role) => role.name === ROLE_NAMES.ORG_ADMIN) ??
      false;

    if (!orgId) return hasOrgAdminRole;
    return hasOrgAdminRole && user.orgEntityRef?.id === orgId;
  }

  /**
   * Check if user has vApp User role
   */
  static isVAppUser(user: User): boolean {
    return (
      user.roleEntityRefs?.some((role) => role.name === ROLE_NAMES.VAPP_USER) ??
      false
    );
  }

  /**
   * Check if user can create organizations (System Admin only)
   */
  static canCreateOrganizations(user: User): boolean {
    return this.isSystemAdmin(user);
  }

  /**
   * Check if user can manage users
   * @param user User to check
   * @param targetOrgId Optional organization ID to check permissions for
   */
  static canManageUsers(user: User, targetOrgId?: string): boolean {
    if (this.isSystemAdmin(user)) return true;
    if (targetOrgId) {
      return this.isOrgAdmin(user, targetOrgId);
    }
    return false;
  }

  /**
   * Check if user can manage system-level settings
   */
  static canManageSystem(user: User): boolean {
    return this.isSystemAdmin(user);
  }

  /**
   * Check if user can access organizations page
   */
  static canAccessOrganizations(user: User): boolean {
    return this.isSystemAdmin(user) || this.isOrgAdmin(user);
  }

  /**
   * Check if user can manage a specific organization
   */
  static canManageOrganization(user: User, orgId: string): boolean {
    if (this.isSystemAdmin(user)) return true;
    return this.isOrgAdmin(user, orgId);
  }

  /**
   * Check if user has any administrative role
   */
  static isAdmin(user: User): boolean {
    return this.isSystemAdmin(user) || this.isOrgAdmin(user);
  }

  /**
   * Get user's role names as an array
   */
  static getUserRoleNames(user: User): string[] {
    return user.roleEntityRefs?.map((role) => role.name) ?? [];
  }

  /**
   * Get user's highest privilege role
   */
  static getHighestRole(user: User): EntityRef | null {
    const roles = user.roleEntityRefs;

    if (!roles) return null;

    // Priority order: System Admin > Org Admin > vApp User
    const systemAdmin = roles.find(
      (role) => role.name === ROLE_NAMES.SYSTEM_ADMIN
    );
    if (systemAdmin) return systemAdmin;

    const orgAdmin = roles.find((role) => role.name === ROLE_NAMES.ORG_ADMIN);
    if (orgAdmin) return orgAdmin;

    const vappUser = roles.find((role) => role.name === ROLE_NAMES.VAPP_USER);
    if (vappUser) return vappUser;

    return roles[0] || null;
  }

  /**
   * Get comprehensive user permissions object
   */
  static getUserPermissions(user: User): UserPermissions {
    const isSystemAdmin = this.canManageSystem(user);
    const isOrgAdmin = this.isOrgAdmin(user);
    return {
      canCreateOrganizations: this.canCreateOrganizations(user),
      canManageUsers: this.canManageUsers(user),
      canManageSystem: isSystemAdmin,
      canManageOrganizations: isSystemAdmin,
      canViewVDCs: true, // All authenticated users can view VDCs
      canManageVDCs: isSystemAdmin,
      canCreateVApps: isSystemAdmin || isOrgAdmin, // System Admins and Org Admins can create vApps
      // System admins get empty array to indicate access to all orgs
      accessibleOrganizations: isSystemAdmin
        ? []
        : user.orgEntityRef
          ? [user.orgEntityRef]
          : [],
      canManageOrganization: (orgId: string) =>
        this.canManageOrganization(user, orgId),
    };
  }

  /**
   * Check if user can perform action on target user
   * @param actor User performing the action
   * @param target User being acted upon
   * @param action Type of action being performed
   */
  static canActOnUser(
    actor: User,
    target: User,
    action: 'view' | 'edit' | 'delete' | 'change_role'
  ): boolean {
    // System admins can do anything
    if (this.isSystemAdmin(actor)) return true;

    // Users can view themselves
    if (action === 'view' && actor.id === target.id) return true;

    // Users can edit their own basic profile
    if (action === 'edit' && actor.id === target.id) return true;

    // Org admins can manage users in their org
    if (
      this.isOrgAdmin(actor) &&
      actor.orgEntityRef?.id === target.orgEntityRef?.id
    ) {
      // Org admins cannot delete or change roles of other org admins or system admins
      if (
        (action === 'delete' || action === 'change_role') &&
        (this.isOrgAdmin(target) || this.isSystemAdmin(target))
      ) {
        return false;
      }
      return true;
    }

    return false;
  }
}
