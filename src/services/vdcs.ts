import { api } from './api';
import type {
  VDC,
  VDCQueryParams,
  CreateVDCRequest,
  UpdateVDCRequest,
  VDCUser,
  InviteVDCUserRequest,
  UpdateVDCUserRoleRequest,
  ApiResponse,
  PaginatedResponse,
} from '../types';

export class VDCService {
  /**
   * Get all VDCs with optional pagination and filtering
   */
  static async getVDCs(
    params?: VDCQueryParams
  ): Promise<PaginatedResponse<VDC>> {
    const response = await api.get<PaginatedResponse<VDC>>('/api/v1/vdcs', {
      params,
    });
    return response.data;
  }

  /**
   * Get VDCs by organization ID
   */
  static async getVDCsByOrganization(
    organizationId: string,
    params?: VDCQueryParams
  ): Promise<PaginatedResponse<VDC>> {
    const response = await api.get<PaginatedResponse<VDC>>(
      `/api/v1/organizations/${organizationId}/vdcs`,
      { params }
    );
    return response.data;
  }

  /**
   * Get a single VDC by ID
   */
  static async getVDC(id: string): Promise<ApiResponse<VDC>> {
    const response = await api.get<ApiResponse<VDC>>(`/api/v1/vdcs/${id}`);
    return response.data;
  }

  /**
   * Create a new VDC
   */
  static async createVDC(data: CreateVDCRequest): Promise<ApiResponse<VDC>> {
    const response = await api.post<ApiResponse<VDC>>('/api/v1/vdcs', data);
    return response.data;
  }

  /**
   * Update an existing VDC
   */
  static async updateVDC(data: UpdateVDCRequest): Promise<ApiResponse<VDC>> {
    const { id, ...updateData } = data;
    const response = await api.put<ApiResponse<VDC>>(
      `/api/v1/vdcs/${id}`,
      updateData
    );
    return response.data;
  }

  /**
   * Delete a VDC
   */
  static async deleteVDC(id: string): Promise<ApiResponse<null>> {
    const response = await api.delete<ApiResponse<null>>(`/api/v1/vdcs/${id}`);
    return response.data;
  }

  /**
   * Enable/disable a VDC
   */
  static async toggleVDCStatus(
    id: string,
    enabled: boolean
  ): Promise<ApiResponse<VDC>> {
    const response = await api.patch<ApiResponse<VDC>>(`/api/v1/vdcs/${id}`, {
      enabled,
    });
    return response.data;
  }

  /**
   * Get users for a VDC
   */
  static async getVDCUsers(id: string): Promise<PaginatedResponse<VDCUser>> {
    const response = await api.get<PaginatedResponse<VDCUser>>(
      `/api/v1/vdcs/${id}/users`
    );
    return response.data;
  }

  /**
   * Invite a user to a VDC
   */
  static async inviteUserToVDC(
    vdcId: string,
    data: InviteVDCUserRequest
  ): Promise<ApiResponse<VDCUser>> {
    const response = await api.post<ApiResponse<VDCUser>>(
      `/api/v1/vdcs/${vdcId}/users/invite`,
      data
    );
    return response.data;
  }

  /**
   * Update a user's role in a VDC
   */
  static async updateVDCUserRole(
    vdcId: string,
    data: UpdateVDCUserRoleRequest
  ): Promise<ApiResponse<VDCUser>> {
    const response = await api.put<ApiResponse<VDCUser>>(
      `/api/v1/vdcs/${vdcId}/users/${data.user_id}/role`,
      { role: data.role }
    );
    return response.data;
  }

  /**
   * Remove a user from a VDC
   */
  static async removeUserFromVDC(
    vdcId: string,
    userId: string
  ): Promise<ApiResponse<null>> {
    const response = await api.delete<ApiResponse<null>>(
      `/api/v1/vdcs/${vdcId}/users/${userId}`
    );
    return response.data;
  }
}
