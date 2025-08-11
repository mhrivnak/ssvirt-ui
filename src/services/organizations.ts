import { api } from './api';
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
    const response = await api.get<PaginatedResponse<Organization>>(
      '/v1/organizations',
      {
        params,
      }
    );
    return response.data;
  }

  /**
   * Get a single organization by ID
   */
  static async getOrganization(id: string): Promise<ApiResponse<Organization>> {
    const response = await api.get<ApiResponse<Organization>>(
      `/v1/organizations/${id}`
    );
    return response.data;
  }

  /**
   * Create a new organization
   */
  static async createOrganization(
    data: CreateOrganizationRequest
  ): Promise<ApiResponse<Organization>> {
    const response = await api.post<ApiResponse<Organization>>(
      '/v1/organizations',
      data
    );
    return response.data;
  }

  /**
   * Update an existing organization
   */
  static async updateOrganization(
    data: UpdateOrganizationRequest
  ): Promise<ApiResponse<Organization>> {
    const { id, ...updateData } = data;
    const response = await api.put<ApiResponse<Organization>>(
      `/v1/organizations/${id}`,
      updateData
    );
    return response.data;
  }

  /**
   * Delete an organization
   */
  static async deleteOrganization(id: string): Promise<ApiResponse<null>> {
    const response = await api.delete<ApiResponse<null>>(
      `/v1/organizations/${id}`
    );
    return response.data;
  }

  /**
   * Enable/disable an organization
   */
  static async toggleOrganizationStatus(
    id: string,
    enabled: boolean
  ): Promise<ApiResponse<Organization>> {
    const response = await api.patch<ApiResponse<Organization>>(
      `/v1/organizations/${id}`,
      { enabled }
    );
    return response.data;
  }

  /**
   * Get users for an organization
   */
  static async getOrganizationUsers(
    id: string
  ): Promise<PaginatedResponse<OrganizationUser>> {
    const response = await api.get<PaginatedResponse<OrganizationUser>>(
      `/v1/organizations/${id}/users`
    );
    return response.data;
  }

  /**
   * Invite a user to an organization
   */
  static async inviteUserToOrganization(
    organizationId: string,
    data: InviteUserRequest
  ): Promise<ApiResponse<OrganizationUser>> {
    const response = await api.post<ApiResponse<OrganizationUser>>(
      `/v1/organizations/${organizationId}/users/invite`,
      data
    );
    return response.data;
  }

  /**
   * Update a user's role in an organization
   */
  static async updateOrganizationUserRole(
    organizationId: string,
    data: UpdateUserRoleRequest
  ): Promise<ApiResponse<OrganizationUser>> {
    const response = await api.put<ApiResponse<OrganizationUser>>(
      `/v1/organizations/${organizationId}/users/${data.user_id}/role`,
      { role: data.role }
    );
    return response.data;
  }

  /**
   * Remove a user from an organization
   */
  static async removeUserFromOrganization(
    organizationId: string,
    userId: string
  ): Promise<ApiResponse<null>> {
    const response = await api.delete<ApiResponse<null>>(
      `/v1/organizations/${organizationId}/users/${userId}`
    );
    return response.data;
  }
}
