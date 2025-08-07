import { api } from './api';
import type {
  VDC,
  VDCQueryParams,
  CreateVDCRequest,
  UpdateVDCRequest,
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
}
