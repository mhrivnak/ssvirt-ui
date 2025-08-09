import { cloudApi } from '../api';
import type {
  VDC,
  VDCQueryParams,
  CreateVDCRequest,
  UpdateVDCRequest,
  VCloudPaginatedResponse,
} from '../../types';

/**
 * VDC Service for VMware Cloud Director CloudAPI
 * System Administrator access only
 */
export class VDCService {
  /**
   * Get all VDCs for an organization with pagination
   */
  static async getVDCs(
    orgId: string,
    params?: VDCQueryParams
  ): Promise<VCloudPaginatedResponse<VDC>> {
    const response = await cloudApi.get<VCloudPaginatedResponse<VDC>>(
      `/api/admin/org/${orgId}/vdcs`,
      { params }
    );
    return response.data;
  }

  /**
   * Get a single VDC by ID
   */
  static async getVDC(orgId: string, vdcId: string): Promise<VDC> {
    const response = await cloudApi.get<VDC>(
      `/api/admin/org/${orgId}/vdcs/${vdcId}`
    );
    return response.data;
  }

  /**
   * Create a new VDC
   */
  static async createVDC(orgId: string, data: CreateVDCRequest): Promise<VDC> {
    const response = await cloudApi.post<VDC>(
      `/api/admin/org/${orgId}/vdcs`,
      data
    );
    return response.data;
  }

  /**
   * Update an existing VDC
   */
  static async updateVDC(
    orgId: string,
    vdcId: string,
    data: UpdateVDCRequest
  ): Promise<VDC> {
    const response = await cloudApi.put<VDC>(
      `/api/admin/org/${orgId}/vdcs/${vdcId}`,
      data
    );
    return response.data;
  }

  /**
   * Delete a VDC
   */
  static async deleteVDC(orgId: string, vdcId: string): Promise<void> {
    await cloudApi.delete(`/api/admin/org/${orgId}/vdcs/${vdcId}`);
  }
}
