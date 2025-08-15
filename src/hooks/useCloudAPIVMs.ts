import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VMService } from '../services/cloudapi/VMService';
import { QUERY_KEYS } from '../types';
import type {
  InstantiateTemplateRequest,
  CatalogItem,
  VCloudPaginatedResponse,
  VApp,
} from '../types';

/**
 * Hook to get accessible VDCs for VM creation
 */
export const useVMVDCs = () => {
  return useQuery({
    queryKey: QUERY_KEYS.vmVdcs,
    queryFn: () => VMService.getVDCs(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to get catalog items (templates) for VM creation
 */
export const useCatalogItems = (catalogId?: string) => {
  return useQuery<VCloudPaginatedResponse<CatalogItem>>({
    queryKey: QUERY_KEYS.catalogItems(catalogId || ''),
    queryFn: ({ signal }) =>
      VMService.getCatalogItems(catalogId!, undefined, { signal }),
    enabled: !!catalogId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Hook to get catalog items from all available catalogs
 */
export const useAllCatalogItems = (
  catalogs: Array<{ id: string; name: string }>
) => {
  return useQuery({
    queryKey: QUERY_KEYS.allCatalogItems(catalogs.map((c) => c.id)),
    queryFn: async ({ signal }) => {
      const results = await Promise.all(
        catalogs.map(async (catalog) => {
          try {
            // Fetch all pages of catalog items for this catalog
            let allItems: (CatalogItem & {
              catalog_id: string;
              catalog_name: string;
            })[] = [];
            let page = 1;
            let hasMore = true;

            while (hasMore) {
              const response = await VMService.getCatalogItems(
                catalog.id,
                {
                  page,
                  pageSize: 100,
                },
                { signal }
              );
              const pageItems = response.values.map((item) => ({
                ...item,
                catalog_id: catalog.id,
                catalog_name: catalog.name,
              }));

              allItems = allItems.concat(pageItems);

              // Check if there are more pages
              hasMore = response.pageCount > page;
              page++;
            }

            return allItems;
          } catch (error) {
            console.warn(
              `Failed to load catalog items for catalog ${catalog.name}:`,
              error
            );
            return [];
          }
        })
      );
      return results.flat();
    },
    enabled: catalogs.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Hook to create VM via template instantiation
 */
export const useInstantiateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      vdcId,
      request,
    }: {
      vdcId: string;
      request: InstantiateTemplateRequest;
    }) => VMService.instantiateTemplate(vdcId, request),

    onSuccess: (response) => {
      // Invalidate relevant caches
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cloudApiVMs });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vapps });

      // Cache the new vApp
      if (response.id) {
        queryClient.setQueryData(QUERY_KEYS.vapp(response.id), response);
      }
    },

    onError: (error) => {
      console.error('Failed to instantiate template:', error);
    },
  });
};

/**
 * Hook to monitor vApp status during creation
 */
export const useVAppStatus = (vappId?: string) => {
  return useQuery<VApp>({
    queryKey: QUERY_KEYS.vapp(vappId || ''),
    queryFn: () => VMService.getVApp(vappId!),
    enabled: !!vappId,
    staleTime: 0, // Always fetch fresh data for status monitoring
    refetchInterval: (query) => {
      // Poll every 2 seconds if status is INSTANTIATING or UNKNOWN
      const vappData = query.state.data;
      const status = vappData?.status;
      if (status === 'INSTANTIATING' || status === 'UNKNOWN') {
        return 2000;
      }
      // Otherwise, stop polling
      return false;
    },
  });
};

/**
 * Hook to get VM details
 */
export const useVMDetails = (vmId?: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.cloudApiVM(vmId || ''),
    queryFn: () => VMService.getVM(vmId!),
    enabled: !!vmId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get VM hardware configuration
 */
export const useVMHardware = (vmId?: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.vmHardware(vmId || ''),
    queryFn: () => VMService.getVMHardware(vmId!),
    enabled: !!vmId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to get all VMs using CloudAPI
 */
export const useCloudAPIVMs = () => {
  return useQuery({
    queryKey: QUERY_KEYS.cloudApiVMs,
    queryFn: () => VMService.getVMs(),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get all vApps using CloudAPI
 * Note: This hook is deprecated. Use useVAppsByVDC from useVApps.ts instead
 * since vApps are VDC-scoped resources.
 */
export const useVApps = () => {
  return useQuery({
    queryKey: QUERY_KEYS.vapps,
    queryFn: () => Promise.resolve({ values: [] }), // Return empty result since global vApps don't exist
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to power on VM
 */
export const usePowerOnVM = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vmId: string) => VMService.powerOnVM(vmId),
    onSuccess: (_, vmId) => {
      // Invalidate VM and vApp queries to refresh status
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cloudApiVM(vmId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cloudApiVMs });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vapps });
    },
  });
};

/**
 * Hook to power off VM
 */
export const usePowerOffVM = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vmId: string) => VMService.powerOffVM(vmId),
    onSuccess: (_, vmId) => {
      // Invalidate VM and vApp queries to refresh status
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cloudApiVM(vmId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cloudApiVMs });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vapps });
    },
  });
};

/**
 * Hook to delete vApp
 */
export const useDeleteVApp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vappId: string) => VMService.deleteVApp(vappId),
    onSuccess: () => {
      // Invalidate all VM and vApp queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cloudApiVMs });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vapps });
    },
  });
};

/**
 * Hook to delete VM
 */
export const useDeleteVM = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vmId: string) => VMService.deleteVM(vmId),
    onSuccess: (_, vmId) => {
      // Invalidate all VM and vApp queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cloudApiVMs });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vapps });
      // Remove the specific VM detail cache
      queryClient.removeQueries({ queryKey: QUERY_KEYS.cloudApiVM(vmId) });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.vmHardware(vmId) });
    },
  });
};
