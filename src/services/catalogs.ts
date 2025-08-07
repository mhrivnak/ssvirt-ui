import { api } from './api';
import type {
  Catalog,
  CatalogItem,
  CatalogQueryParams,
  ApiResponse,
  PaginatedResponse,
} from '../types';

export class CatalogService {
  /**
   * Get all catalogs with optional pagination and filtering
   */
  static async getCatalogs(
    params?: CatalogQueryParams
  ): Promise<PaginatedResponse<Catalog>> {
    const response = await api.get<PaginatedResponse<Catalog>>(
      '/api/v1/catalogs',
      {
        params,
      }
    );
    return response.data;
  }

  /**
   * Get a single catalog by ID
   */
  static async getCatalog(id: string): Promise<ApiResponse<Catalog>> {
    const response = await api.get<ApiResponse<Catalog>>(
      `/api/v1/catalogs/${id}`
    );
    return response.data;
  }

  /**
   * Get catalog items for a specific catalog
   */
  static async getCatalogItems(
    catalogId: string,
    params?: CatalogQueryParams
  ): Promise<PaginatedResponse<CatalogItem>> {
    const response = await api.get<PaginatedResponse<CatalogItem>>(
      `/api/v1/catalogs/${catalogId}/items`,
      { params }
    );
    return response.data;
  }

  /**
   * Get a single catalog item by ID
   */
  static async getCatalogItem(
    catalogId: string,
    itemId: string
  ): Promise<ApiResponse<CatalogItem>> {
    const response = await api.get<ApiResponse<CatalogItem>>(
      `/api/v1/catalogs/${catalogId}/items/${itemId}`
    );
    return response.data;
  }

  /**
   * Get all catalog items across all catalogs
   */
  static async getAllCatalogItems(
    params?: CatalogQueryParams
  ): Promise<PaginatedResponse<CatalogItem>> {
    const response = await api.get<PaginatedResponse<CatalogItem>>(
      '/api/v1/catalog-items',
      { params }
    );
    return response.data;
  }
}
