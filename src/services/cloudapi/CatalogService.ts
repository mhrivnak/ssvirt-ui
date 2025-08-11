import { cloudApi } from '../api';
import { API_ENDPOINTS } from '../../utils/constants';
import type {
  Catalog,
  CatalogQueryParams,
  CreateCatalogRequest,
  UpdateCatalogRequest,
  VCloudPaginatedResponse,
  CatalogItem,
  CatalogItemQueryParams,
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
    const response = await cloudApi.get<VCloudPaginatedResponse<Catalog>>(
      API_ENDPOINTS.CLOUDAPI.CATALOGS,
      { params }
    );
    return response.data;
  }

  /**
   * Get a single catalog by URN
   * GET /cloudapi/1.0.0/catalogs/{catalogUrn}
   */
  static async getCatalog(catalogId: string): Promise<Catalog> {
    const response = await cloudApi.get<Catalog>(
      API_ENDPOINTS.CLOUDAPI.CATALOG_BY_ID(catalogId)
    );
    return response.data;
  }

  /**
   * Create a new catalog
   * POST /cloudapi/1.0.0/catalogs
   */
  static async createCatalog(data: CreateCatalogRequest): Promise<Catalog> {
    const response = await cloudApi.post<Catalog>(
      API_ENDPOINTS.CLOUDAPI.CATALOGS,
      data
    );
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
    const response = await cloudApi.put<Catalog>(
      API_ENDPOINTS.CLOUDAPI.CATALOG_BY_ID(catalogId),
      data
    );
    return response.data;
  }

  /**
   * Delete a catalog
   * DELETE /cloudapi/1.0.0/catalogs/{catalogUrn}
   */
  static async deleteCatalog(catalogId: string): Promise<void> {
    await cloudApi.delete(API_ENDPOINTS.CLOUDAPI.CATALOG_BY_ID(catalogId));
  }

  /**
   * Get catalog items with pagination
   * GET /cloudapi/1.0.0/catalogs/{catalogUrn}/catalogItems
   */
  static async getCatalogItems(
    catalogId: string,
    params?: CatalogItemQueryParams
  ): Promise<VCloudPaginatedResponse<CatalogItem>> {
    const response = await cloudApi.get<VCloudPaginatedResponse<CatalogItem>>(
      API_ENDPOINTS.CLOUDAPI.CATALOG_ITEMS(catalogId),
      { params }
    );
    return response.data;
  }

  /**
   * Get a single catalog item by URN
   * GET /cloudapi/1.0.0/catalogs/{catalogUrn}/catalogItems/{itemUrn}
   */
  static async getCatalogItem(
    catalogId: string,
    itemId: string
  ): Promise<CatalogItem> {
    const response = await cloudApi.get<CatalogItem>(
      `${API_ENDPOINTS.CLOUDAPI.CATALOG_ITEMS(catalogId)}/${encodeURIComponent(itemId)}`
    );
    return response.data;
  }
}
