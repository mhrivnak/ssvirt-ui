import { useQuery } from '@tanstack/react-query';
import { CatalogService } from '../services';
import { QUERY_KEYS } from '../types';
import type { CatalogQueryParams } from '../types';

/**
 * Hook to fetch all catalogs
 */
export const useCatalogs = (params?: CatalogQueryParams) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.catalogs, params],
    queryFn: () => CatalogService.getCatalogs(params),
    enabled: true,
  });
};

/**
 * Hook to fetch a single catalog
 */
export const useCatalog = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.catalog(id),
    queryFn: () => CatalogService.getCatalog(id),
    enabled: !!id,
  });
};

/**
 * Hook to fetch catalog items for a specific catalog
 */
export const useCatalogItems = (
  catalogId: string,
  params?: CatalogQueryParams
) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.catalogItems(catalogId), params],
    queryFn: () => CatalogService.getCatalogItems(catalogId, params),
    enabled: !!catalogId,
  });
};

/**
 * Hook to fetch all catalog items across all catalogs
 */
export const useAllCatalogItems = (params?: CatalogQueryParams) => {
  return useQuery({
    queryKey: ['catalog-items', params],
    queryFn: () => CatalogService.getAllCatalogItems(params),
    enabled: true,
  });
};
