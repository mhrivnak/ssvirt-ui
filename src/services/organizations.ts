import { api } from './api';
import type {
  Organization,
  OrganizationQueryParams,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
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
      '/api/v1/organizations',
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
      `/api/v1/organizations/${id}`
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
      '/api/v1/organizations',
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
      `/api/v1/organizations/${id}`,
      updateData
    );
    return response.data;
  }

  /**
   * Delete an organization
   */
  static async deleteOrganization(id: string): Promise<ApiResponse<null>> {
    const response = await api.delete<ApiResponse<null>>(
      `/api/v1/organizations/${id}`
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
      `/api/v1/organizations/${id}`,
      { enabled }
    );
    return response.data;
  }
}
