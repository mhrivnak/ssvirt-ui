import { api } from '../api';
import type {
  VDC,
  VDCAdminQueryParams,
  CreateVDCRequest,
  UpdateVDCRequest,
  VCloudPaginatedResponse,
} from '../../types';

/**
 * VDC Admin Service for VMware Cloud Director CloudAPI
 * System Administrator access only
 */
export class VDCAdminService {
  /**
   * Get all VDCs for an organization with pagination
   */
  static async getVDCs(
    orgId: string,
    params?: VDCAdminQueryParams
  ): Promise<VCloudPaginatedResponse<VDC>> {
    const response = await api.get<VCloudPaginatedResponse<VDC>>(
      `/admin/org/${encodeURIComponent(orgId)}/vdcs`,
      { params }
    );
    return response.data;
  }

  /**
   * Get a single VDC by ID
   */
  static async getVDC(orgId: string, vdcId: string): Promise<VDC> {
    const response = await api.get<VDC>(
      `/admin/org/${encodeURIComponent(orgId)}/vdcs/${encodeURIComponent(vdcId)}`
    );
    return response.data;
  }

  /**
   * Create a new VDC
   */
  static async createVDC(orgId: string, data: CreateVDCRequest): Promise<VDC> {
    const response = await api.post<VDC>(
      `/admin/org/${encodeURIComponent(orgId)}/vdcs`,
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
    const response = await api.put<VDC>(
      `/admin/org/${encodeURIComponent(orgId)}/vdcs/${encodeURIComponent(vdcId)}`,
      data
    );
    return response.data;
  }

  /**
   * Delete a VDC
   */
  static async deleteVDC(orgId: string, vdcId: string): Promise<void> {
    await api.delete(
      `/admin/org/${encodeURIComponent(orgId)}/vdcs/${encodeURIComponent(vdcId)}`
    );
  }
}
