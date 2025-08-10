import { VDCAdminService } from './VDCAdminService';
import { VDCPublicService } from './VDCPublicService';
import { AuthService } from '../api';
import type {
  VDC,
  VDCApiQueryParams,
  VDCPublicQueryParams,
  VDCAdminQueryParams,
  CreateVDCRequest,
  UpdateVDCRequest,
  VCloudPaginatedResponse,
  UserPermissions,
} from '../../types';

/**
 * Unified VDC Service with intelligent routing
 * Automatically routes to appropriate API based on user permissions
 */
export class VDCService {
  // Permission caching to prevent redundant calls
  private static permissionsCache: UserPermissions | null = null;
  private static permissionsCacheAt: number = 0;
  private static readonly PERMISSIONS_TTL_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Get current user permissions for API routing decisions with caching
   */
  private static async getUserPermissions(): Promise<UserPermissions> {
    // Check if cached permissions exist and are fresh
    const now = Date.now();
    if (
      this.permissionsCache &&
      this.permissionsCacheAt &&
      now - this.permissionsCacheAt < this.PERMISSIONS_TTL_MS
    ) {
      return this.permissionsCache;
    }

    try {
      const permissions = await AuthService.getCurrentUserPermissions();
      // Update cache
      this.permissionsCache = permissions;
      this.permissionsCacheAt = now;
      return permissions;
    } catch (error) {
      console.error('Error getting user permissions:', error);
      // Default to minimal permissions - fail closed
      return {
        canCreateOrganizations: false,
        canManageUsers: false,
        canManageSystem: false,
        canManageOrganizations: false,
        canViewVDCs: false, // Fail closed - no access by default
        canManageVDCs: false,
        accessibleOrganizations: [],
      };
    }
  }

  /**
   * Invalidate the permissions cache - useful for testing or when permissions change
   */
  static invalidatePermissionsCache(): void {
    this.permissionsCache = null;
    this.permissionsCacheAt = 0;
  }

  /**
   * Get VDCs with automatic API routing based on user permissions
   * For admins: requires orgId parameter and uses admin API
   * For regular users: uses public API with organization scope
   */
  static async getVDCs(
    orgIdOrParams?: string | VDCApiQueryParams,
    adminParams?: VDCAdminQueryParams
  ): Promise<VCloudPaginatedResponse<VDC>> {
    const userPermissions = await this.getUserPermissions();

    // Explicit permission check to prevent unauthorized access
    if (!userPermissions.canViewVDCs) {
      throw new Error('You do not have permission to view VDCs');
    }

    if (userPermissions.canManageSystem) {
      // Admin user - use admin API
      const orgId = typeof orgIdOrParams === 'string' ? orgIdOrParams : '';
      const params =
        adminParams ||
        (typeof orgIdOrParams !== 'string'
          ? (orgIdOrParams as VDCAdminQueryParams)
          : undefined);

      if (!orgId) {
        throw new Error('Organization ID is required for admin access');
      }

      return VDCAdminService.getVDCs(orgId, params);
    } else {
      // Regular user - use public API
      const params =
        typeof orgIdOrParams !== 'string'
          ? (orgIdOrParams as VDCPublicQueryParams)
          : undefined;
      return VDCPublicService.getVDCs(params);
    }
  }

  /**
   * Get a single VDC for regular users using public API
   */
  static async getVDC(vdcUrn: string): Promise<VDC>;
  /**
   * Get a single VDC for admin users using admin API
   */
  static async getVDC(orgId: string, vdcId: string): Promise<VDC>;
  /**
   * Get a single VDC with automatic API routing
   * For admins: requires both orgId and vdcId parameters
   * For regular users: uses public API with VDC URN only
   */
  static async getVDC(vdcIdOrOrgId: string, vdcId?: string): Promise<VDC> {
    const userPermissions = await this.getUserPermissions();

    // Explicit permission check to prevent unauthorized access
    if (!userPermissions.canViewVDCs) {
      throw new Error('You do not have permission to view VDCs');
    }

    if (userPermissions.canManageSystem) {
      // Admin user - must provide both orgId and vdcId, no fallback
      if (!vdcId) {
        throw new Error(
          'Admin users must provide both organization ID and VDC ID'
        );
      }
      return VDCAdminService.getVDC(vdcIdOrOrgId, vdcId);
    } else {
      // Regular user - only accepts single VDC URN parameter
      if (vdcId) {
        throw new Error('Regular users can only access VDCs by URN');
      }
      return VDCPublicService.getVDC(vdcIdOrOrgId);
    }
  }

  /**
   * Create a new VDC (admin only)
   */
  static async createVDC(orgId: string, data: CreateVDCRequest): Promise<VDC> {
    const userPermissions = await this.getUserPermissions();

    if (!userPermissions.canManageSystem) {
      throw new Error('Insufficient permissions to create VDCs');
    }

    return VDCAdminService.createVDC(orgId, data);
  }

  /**
   * Update an existing VDC (admin only)
   */
  static async updateVDC(
    orgId: string,
    vdcId: string,
    data: UpdateVDCRequest
  ): Promise<VDC> {
    const userPermissions = await this.getUserPermissions();

    if (!userPermissions.canManageSystem) {
      throw new Error('Insufficient permissions to update VDCs');
    }

    return VDCAdminService.updateVDC(orgId, vdcId, data);
  }

  /**
   * Delete a VDC (admin only)
   */
  static async deleteVDC(orgId: string, vdcId: string): Promise<void> {
    const userPermissions = await this.getUserPermissions();

    if (!userPermissions.canManageSystem) {
      throw new Error('Insufficient permissions to delete VDCs');
    }

    return VDCAdminService.deleteVDC(orgId, vdcId);
  }

  /**
   * Get user permissions (exposed for use in components)
   */
  static async getCurrentUserPermissions(): Promise<UserPermissions> {
    return this.getUserPermissions();
  }
}
