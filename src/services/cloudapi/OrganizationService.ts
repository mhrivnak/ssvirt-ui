import axios from 'axios';
import { cloudApi } from '../api';
import type {
  ApiResponse,
  VCloudPaginatedResponse,
  Organization,
  OrganizationQueryParams,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  User,
} from '../../types';

/**
 * CloudAPI Organization Service - VMware Cloud Director compatible endpoints
 */
export class CloudApiOrganizationService {
  /**
   * Get all organizations with optional query parameters
   */
  static async getOrganizations(
    params?: OrganizationQueryParams
  ): Promise<VCloudPaginatedResponse<Organization>> {
    try {
      const response = await cloudApi.get<
        VCloudPaginatedResponse<Organization>
      >('/1.0.0/orgs', { params });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message || 'Failed to fetch organizations';
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * Get a specific organization by ID (URN format)
   */
  static async getOrganization(id: string): Promise<ApiResponse<Organization>> {
    try {
      const response = await cloudApi.get<ApiResponse<Organization>>(
        `/1.0.0/orgs/${encodeURIComponent(id)}`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message || 'Failed to fetch organization';
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * Create a new organization (System Administrator only)
   */
  static async createOrganization(
    orgData: CreateOrganizationRequest
  ): Promise<ApiResponse<Organization>> {
    try {
      const response = await cloudApi.post<ApiResponse<Organization>>(
        '/1.0.0/orgs',
        {
          name: orgData.name,
          displayName: orgData.displayName || orgData.name,
          description: orgData.description || '',
          isEnabled: orgData.isEnabled ?? true,
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message || 'Failed to create organization';
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * Update an existing organization
   */
  static async updateOrganization(
    orgData: UpdateOrganizationRequest
  ): Promise<ApiResponse<Organization>> {
    try {
      const updateData: Partial<Organization> = {};

      if (orgData.name) updateData.name = orgData.name;
      if (orgData.displayName) updateData.displayName = orgData.displayName;
      if (orgData.description !== undefined)
        updateData.description = orgData.description;
      if (orgData.isEnabled !== undefined)
        updateData.isEnabled = orgData.isEnabled;

      const response = await cloudApi.put<ApiResponse<Organization>>(
        `/1.0.0/orgs/${encodeURIComponent(orgData.id)}`,
        updateData
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message || 'Failed to update organization';
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * Delete an organization (System Administrator only)
   */
  static async deleteOrganization(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await cloudApi.delete<ApiResponse<void>>(
        `/1.0.0/orgs/${encodeURIComponent(id)}`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message || 'Failed to delete organization';
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * Enable or disable an organization
   */
  static async toggleOrganizationStatus(
    id: string,
    enabled: boolean
  ): Promise<ApiResponse<Organization>> {
    try {
      const response = await cloudApi.patch<ApiResponse<Organization>>(
        `/1.0.0/orgs/${encodeURIComponent(id)}`,
        { isEnabled: enabled }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message ||
          'Failed to toggle organization status';
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * Get users in an organization
   */
  static async getOrganizationUsers(
    orgId: string
  ): Promise<VCloudPaginatedResponse<User>> {
    try {
      const response = await cloudApi.get<VCloudPaginatedResponse<User>>(
        `/1.0.0/orgs/${encodeURIComponent(orgId)}/users`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message || 'Failed to fetch organization users';
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * Add user to organization
   */
  static async addUserToOrganization(
    orgId: string,
    userId: string
  ): Promise<ApiResponse<void>> {
    try {
      const response = await cloudApi.post<ApiResponse<void>>(
        `/1.0.0/orgs/${encodeURIComponent(orgId)}/users`,
        { userId }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message || 'Failed to add user to organization';
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * Remove user from organization
   */
  static async removeUserFromOrganization(
    orgId: string,
    userId: string
  ): Promise<ApiResponse<void>> {
    try {
      const response = await cloudApi.delete<ApiResponse<void>>(
        `/1.0.0/orgs/${encodeURIComponent(orgId)}/users/${encodeURIComponent(userId)}`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message ||
          'Failed to remove user from organization';
        throw new Error(message);
      }
      throw error;
    }
  }
}

// Export alias for backward compatibility
export const OrganizationService = CloudApiOrganizationService;
