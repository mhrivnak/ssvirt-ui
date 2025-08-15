import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VMService } from '../services/cloudapi/VMService';
import { VAppService } from '../services/cloudapi/VAppService';
import { QUERY_KEYS } from '../types';
import type { CreateVAppFromTemplateRequest } from '../types';

/**
 * Hook to fetch vApps for a specific VDC
 * Since vApps are scoped to VDCs, this replaces the global getVApps
 */
export const useVApps = (vdcId: string) => {
  return useQuery({
    queryKey: ['vapps', vdcId],
    queryFn: () => VMService.getVAppsByVDC(vdcId),
    enabled: !!vdcId,
  });
};

/**
 * Hook to fetch a single vApp by ID
 */
export const useVApp = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.vapp(id),
    queryFn: () => VMService.getVApp(id),
    enabled: !!id,
  });
};

/**
 * Hook to fetch vApps grouped by VDC
 * Returns a structure that groups vApps by their VDC for easy display
 * Note: This fetches all VDCs first, then gets vApps for each VDC
 */
export const useVAppsByVDC = () => {
  return useQuery({
    queryKey: ['vapps-by-vdc'],
    queryFn: async () => {
      // First get all VDCs
      const vdcsResponse = await VMService.getVDCs();

      // Then get vApps for each VDC in parallel
      const vAppPromises = vdcsResponse.values.map(async (vdc) => {
        try {
          const vAppsResponse = await VMService.getVAppsByVDC(vdc.id);
          return {
            vdc,
            vApps: vAppsResponse.values,
          };
        } catch (error) {
          // If a VDC has no vApps or there's an error, return empty vApps array
          console.warn(`Failed to fetch vApps for VDC ${vdc.id}:`, error);
          return {
            vdc,
            vApps: [],
          };
        }
      });

      const vAppsByVDC = await Promise.all(vAppPromises);

      // Calculate totals
      const totalVApps = vAppsByVDC.reduce(
        (sum, vdcGroup) => sum + vdcGroup.vApps.length,
        0
      );

      return {
        vAppsByVDC,
        totalVApps,
        totalVDCs: vdcsResponse.resultTotal,
      };
    },
    enabled: true,
  });
};

/**
 * Hook to fetch vApps for a specific VDC using the VDC-specific endpoint
 * This is an alias for useVApps for backward compatibility
 */
export const useVAppsByVDCId = (vdcId: string) => {
  return useVApps(vdcId);
};

/**
 * Hook to delete a vApp
 */
export const useDeleteVApp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => VMService.deleteVApp(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: QUERY_KEYS.vapp(deletedId) });

      // Invalidate vApps lists
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vapps });
      queryClient.invalidateQueries({ queryKey: ['vapps-by-vdc'] });
      queryClient.invalidateQueries({ queryKey: ['vapps-by-vdc-id'] });

      // Invalidate dashboard stats as vApp count changed
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });
    },
    onError: (error) => {
      console.error('Failed to delete vApp:', error);
    },
  });
};

/**
 * Hook to create a vApp from a catalog template
 */
export const useCreateVApp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      vdcId,
      request,
    }: {
      vdcId: string;
      request: CreateVAppFromTemplateRequest;
    }) => VAppService.createFromTemplate(vdcId, request),
    onSuccess: (newVApp, variables) => {
      // Invalidate vApps lists to show the new vApp
      queryClient.invalidateQueries({ queryKey: ['vapps', variables.vdcId] });
      queryClient.invalidateQueries({ queryKey: ['vapps-by-vdc'] });
      queryClient.invalidateQueries({ queryKey: ['vapps-by-vdc-id'] });

      // Invalidate dashboard stats as vApp count changed
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });

      // Add the new vApp to cache for immediate access
      queryClient.setQueryData(QUERY_KEYS.vapp(newVApp.id), newVApp);
    },
    onError: (error) => {
      console.error('Failed to create vApp:', error);
    },
  });
};

/**
 * Hook to validate vApp name uniqueness within a VDC
 */
export const useVAppNameValidation = (vdcId: string, name: string) => {
  return useQuery({
    queryKey: ['vapp-name-validation', vdcId, name],
    queryFn: () => VAppService.validateVAppName(vdcId, name),
    enabled: !!vdcId && !!name && name.trim().length > 0,
    staleTime: 5000, // Cache for 5 seconds to avoid excessive API calls
  });
};
