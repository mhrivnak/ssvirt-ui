import { api } from '../api';
import type {
  Catalog,
  CatalogQueryParams,
  CreateCatalogRequest,
  UpdateCatalogRequest,
  VCloudPaginatedResponse,
} from '../../types';

/**
 * Catalog Service for VMware Cloud Director CloudAPI
 * Follows CloudAPI specification with URN-based identification
 */
export class CatalogService {
  /**
   * Get all catalogs with pagination
   * GET /cloudapi/1.0.0/catalogs
   */
  static async getCatalogs(
    params?: CatalogQueryParams
  ): Promise<VCloudPaginatedResponse<Catalog>> {
    const response = await api.get<VCloudPaginatedResponse<Catalog>>(
      '/cloudapi/1.0.0/catalogs',
      { params }
    );
    return response.data;
  }

  /**
   * Get a single catalog by URN
   * GET /cloudapi/1.0.0/catalogs/{catalogUrn}
   */
  static async getCatalog(catalogId: string): Promise<Catalog> {
    const response = await api.get<Catalog>(
      `/cloudapi/1.0.0/catalogs/${encodeURIComponent(catalogId)}`
    );
    return response.data;
  }

  /**
   * Create a new catalog
   * POST /cloudapi/1.0.0/catalogs
   */
  static async createCatalog(data: CreateCatalogRequest): Promise<Catalog> {
    const response = await api.post<Catalog>('/cloudapi/1.0.0/catalogs', data);
    return response.data;
  }

  /**
   * Update an existing catalog
   * PUT /cloudapi/1.0.0/catalogs/{catalogUrn}
   */
  static async updateCatalog(
    catalogId: string,
    data: UpdateCatalogRequest
  ): Promise<Catalog> {
    const response = await api.put<Catalog>(
      `/cloudapi/1.0.0/catalogs/${encodeURIComponent(catalogId)}`,
      data
    );
    return response.data;
  }

  /**
   * Delete a catalog
   * DELETE /cloudapi/1.0.0/catalogs/{catalogUrn}
   */
  static async deleteCatalog(catalogId: string): Promise<void> {
    await api.delete(
      `/cloudapi/1.0.0/catalogs/${encodeURIComponent(catalogId)}`
    );
  }
}
