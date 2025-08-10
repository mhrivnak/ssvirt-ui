import { api } from '../api';
import type {
  VDC,
  VDCPublicQueryParams,
  VCloudPaginatedResponse,
} from '../../types';

/**
 * VDC Public Service for VMware Cloud Director CloudAPI
 * Organization-scoped access for regular users
 */
export class VDCPublicService {
  /**
   * Get VDCs accessible to current user's organization(s) with pagination
   * GET /cloudapi/1.0.0/vdcs
   */
  static async getVDCs(
    params?: VDCPublicQueryParams
  ): Promise<VCloudPaginatedResponse<VDC>> {
    const response = await api.get<VCloudPaginatedResponse<VDC>>(
      '/cloudapi/1.0.0/vdcs',
      { params }
    );
    return response.data;
  }

  /**
   * Get a single VDC by URN
   * GET /cloudapi/1.0.0/vdcs/{vdc_urn}
   */
  static async getVDC(vdcId: string): Promise<VDC> {
    const response = await api.get<VDC>(
      `/cloudapi/1.0.0/vdcs/${encodeURIComponent(vdcId)}`
    );
    return response.data;
  }
}
