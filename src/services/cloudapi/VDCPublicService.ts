import { cloudApi } from '../api';
import { API_ENDPOINTS } from '../../utils/constants';
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
    const response = await cloudApi.get<VCloudPaginatedResponse<VDC>>(
      API_ENDPOINTS.CLOUDAPI.VDCS,
      { params }
    );
    return response.data;
  }

  /**
   * Get a single VDC by URN
   * GET /cloudapi/1.0.0/vdcs/{vdc_urn}
   */
  static async getVDC(vdcId: string): Promise<VDC> {
    const response = await cloudApi.get<VDC>(
      API_ENDPOINTS.CLOUDAPI.VDC_BY_ID(vdcId)
    );
    return response.data;
  }
}
