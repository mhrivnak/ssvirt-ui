import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { CatalogService } from '../services';
import { QUERY_KEYS } from '../types';
import { logger } from '../utils/logger';
import type {
  CatalogQueryParams,
  CreateCatalogRequest,
  UpdateCatalogRequest,
  CatalogItemQueryParams,
} from '../types';

/**
 * Hook to fetch all catalogs with CloudAPI
 */
export const useCatalogs = (params?: CatalogQueryParams) => {
  // Serialize params to ensure stable queryKey
  const serializedParams = useMemo(() => {
    return params ? JSON.stringify(params) : '';
  }, [params]);

  return useQuery({
    queryKey: [...QUERY_KEYS.catalogs, serializedParams],
    queryFn: () => CatalogService.getCatalogs(params),
    enabled: true,
  });
};

/**
 * Hook to fetch a single catalog by URN
 */
export const useCatalog = (catalogId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.catalog(catalogId),
    queryFn: () => CatalogService.getCatalog(catalogId),
    enabled: !!catalogId,
  });
};

/**
 * Hook to create a new catalog
 */
export const useCreateCatalog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCatalogRequest) =>
      CatalogService.createCatalog(data),
    onSuccess: () => {
      // Invalidate catalogs list
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.catalogs,
      });
    },
    onError: (error) => {
      logger.error('Failed to create catalog:', error);
    },
  });
};

/**
 * Hook to update a catalog
 */
export const useUpdateCatalog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      catalogId,
      data,
    }: {
      catalogId: string;
      data: UpdateCatalogRequest;
    }) => CatalogService.updateCatalog(catalogId, data),
    onSuccess: (response, variables) => {
      // Update the specific catalog in cache
      queryClient.setQueryData(
        QUERY_KEYS.catalog(variables.catalogId),
        response
      );

      // Invalidate catalogs list
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.catalogs,
      });
    },
    onError: (error) => {
      logger.error('Failed to update catalog:', error);
    },
  });
};

/**
 * Hook to delete a catalog
 */
export const useDeleteCatalog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (catalogId: string) => CatalogService.deleteCatalog(catalogId),
    onSuccess: (_, catalogId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: QUERY_KEYS.catalog(catalogId) });

      // Invalidate catalogs list
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.catalogs,
      });
    },
    onError: (error) => {
      logger.error('Failed to delete catalog:', error);
    },
  });
};

/**
 * Hook to fetch catalog items with pagination
 */
export const useCatalogItems = (
  catalogId: string,
  params?: CatalogItemQueryParams
) => {
  return useQuery({
    queryKey: QUERY_KEYS.catalogItems(catalogId, params),
    queryFn: () => CatalogService.getCatalogItems(catalogId, params),
    enabled: !!catalogId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};

/**
 * Hook to fetch a single catalog item by URN
 */
export const useCatalogItem = (catalogId: string, itemId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.catalogItem(catalogId, itemId),
    queryFn: () => CatalogService.getCatalogItem(catalogId, itemId),
    enabled: !!catalogId && !!itemId,
    staleTime: 15 * 60 * 1000, // 15 minutes - template specs change infrequently
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};
