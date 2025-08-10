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
  /**
   * Get current user permissions for API routing decisions
   */
  private static async getUserPermissions(): Promise<UserPermissions> {
    try {
      return await AuthService.getCurrentUserPermissions();
    } catch (error) {
      console.error('Error getting user permissions:', error);
      // Default to minimal permissions
      return {
        canCreateOrganizations: false,
        canManageUsers: false,
        canManageSystem: false,
        canManageOrganizations: false,
        canViewVDCs: true,
        canManageVDCs: false,
        accessibleOrganizations: [],
      };
    }
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
   * Get a single VDC with automatic API routing
   * For admins: requires orgId parameter and uses admin API
   * For regular users: uses public API with VDC URN
   */
  static async getVDC(vdcIdOrOrgId: string, vdcId?: string): Promise<VDC> {
    const userPermissions = await this.getUserPermissions();

    if (userPermissions.canManageSystem && vdcId) {
      // Admin user with both orgId and vdcId - use admin API
      return VDCAdminService.getVDC(vdcIdOrOrgId, vdcId);
    } else {
      // Regular user with VDC URN only - use public API
      const actualVdcId = vdcId || vdcIdOrOrgId;
      return VDCPublicService.getVDC(actualVdcId);
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
