import { cloudApi } from './api';
import { API_ENDPOINTS } from '../utils/constants';
import type {
  Organization,
  OrganizationQueryParams,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  OrganizationUser,
  InviteUserRequest,
  UpdateUserRoleRequest,
  ApiResponse,
  PaginatedResponse,
} from '../types';

export class OrganizationService {
  /**
   * Get all organizations with optional pagination and filtering
   */
  static async getOrganizations(
    params?: OrganizationQueryParams
  ): Promise<PaginatedResponse<Organization>> {
    const response = await cloudApi.get<Organization[]>(
      API_ENDPOINTS.CLOUDAPI.ORGANIZATIONS,
      {
        params,
      }
    );
    // Convert array response to paginated format for compatibility
    return {
      data: response.data,
      total: response.data.length,
      page: 1,
      per_page: response.data.length,
      success: true
    };
  }

  /**
   * Get a single organization by ID
   */
  static async getOrganization(id: string): Promise<ApiResponse<Organization>> {
    const response = await cloudApi.get<Organization>(
      API_ENDPOINTS.CLOUDAPI.ORGANIZATION_BY_ID(id)
    );
    // Convert direct response to wrapped format for compatibility
    return {
      data: response.data,
      success: true,
      message: 'Organization retrieved successfully'
    };
  }

  /**
   * Create a new organization
   */
  static async createOrganization(
    data: CreateOrganizationRequest
  ): Promise<ApiResponse<Organization>> {
    const response = await cloudApi.post<Organization>(
      API_ENDPOINTS.CLOUDAPI.ORGANIZATIONS,
      data
    );
    // Convert direct response to wrapped format for compatibility
    return {
      data: response.data,
      success: true,
      message: 'Organization created successfully'
    };
  }

  /**
   * Update an existing organization
   */
  static async updateOrganization(
    data: UpdateOrganizationRequest
  ): Promise<ApiResponse<Organization>> {
    const { id, ...updateData } = data;
    const response = await cloudApi.put<Organization>(
      API_ENDPOINTS.CLOUDAPI.ORGANIZATION_BY_ID(id),
      updateData
    );
    // Convert direct response to wrapped format for compatibility
    return {
      data: response.data,
      success: true,
      message: 'Organization updated successfully'
    };
  }

  /**
   * Delete an organization
   */
  static async deleteOrganization(id: string): Promise<ApiResponse<null>> {
    await cloudApi.delete(
      API_ENDPOINTS.CLOUDAPI.ORGANIZATION_BY_ID(id)
    );
    // CloudAPI delete returns no content, create success response
    return {
      data: null,
      success: true,
      message: 'Organization deleted successfully'
    };
  }

  /**
   * Enable/disable an organization
   */
  static async toggleOrganizationStatus(
    id: string,
    enabled: boolean
  ): Promise<ApiResponse<Organization>> {
    const response = await cloudApi.patch<Organization>(
      API_ENDPOINTS.CLOUDAPI.ORGANIZATION_BY_ID(id),
      { isEnabled: enabled }
    );
    // Convert direct response to wrapped format for compatibility
    return {
      data: response.data,
      success: true,
      message: `Organization ${enabled ? 'enabled' : 'disabled'} successfully`
    };
  }

  /**
   * Get users for an organization
   */
  static async getOrganizationUsers(
    id: string
  ): Promise<PaginatedResponse<OrganizationUser>> {
    // Get users filtered by organization - VMware Cloud Director uses global users API with filtering
    const response = await cloudApi.get<OrganizationUser[]>(
      API_ENDPOINTS.CLOUDAPI.USERS,
      {
        params: {
          filter: `orgEntityRef.id==${encodeURIComponent(id)}`
        }
      }
    );
    // Convert array response to paginated format for compatibility
    return {
      data: response.data,
      total: response.data.length,
      page: 1,
      per_page: response.data.length,
      success: true
    };
  }

  /**
   * Invite a user to an organization
   */
  static async inviteUserToOrganization(
    organizationId: string,
    data: InviteUserRequest
  ): Promise<ApiResponse<OrganizationUser>> {
    // Create user with organization reference - VMware Cloud Director approach
    const response = await cloudApi.post<OrganizationUser>(
      API_ENDPOINTS.CLOUDAPI.USERS,
      {
        ...data,
        orgEntityRef: {
          id: organizationId,
          name: data.organizationName || 'Organization'
        }
      }
    );
    // Convert direct response to wrapped format for compatibility
    return {
      data: response.data,
      success: true,
      message: 'User invited to organization successfully'
    };
  }

  /**
   * Update a user's role in an organization
   */
  static async updateOrganizationUserRole(
    organizationId: string,
    data: UpdateUserRoleRequest
  ): Promise<ApiResponse<OrganizationUser>> {
    // Update user role - VMware Cloud Director uses user ID directly
    const response = await cloudApi.put<OrganizationUser>(
      API_ENDPOINTS.CLOUDAPI.USER_BY_ID(data.user_id),
      {
        roleEntityRefs: [{
          id: data.role,
          name: data.roleName || 'Role'
        }]
      }
    );
    // Convert direct response to wrapped format for compatibility
    return {
      data: response.data,
      success: true,
      message: 'User role updated successfully'
    };
  }

  /**
   * Remove a user from an organization
   */
  static async removeUserFromOrganization(
    organizationId: string,
    userId: string
  ): Promise<ApiResponse<null>> {
    // Remove user from organization - VMware Cloud Director approach
    await cloudApi.delete(
      API_ENDPOINTS.CLOUDAPI.USER_BY_ID(userId)
    );
    // CloudAPI delete returns no content, create success response
    return {
      data: null,
      success: true,
      message: 'User removed from organization successfully'
    };
  }
}
