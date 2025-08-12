import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VMService } from '../services/cloudapi/VMService';
import { cloudApi } from '../services/api';
import { QUERY_KEYS } from '../types';
import type { VCloudPaginatedResponse, VApp, VDC } from '../types';

/**
 * Hook to fetch all vApps
 */
export const useVApps = () => {
  return useQuery({
    queryKey: QUERY_KEYS.vapps,
    queryFn: () => VMService.getVApps(),
    enabled: true,
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
 */
export const useVAppsByVDC = () => {
  return useQuery({
    queryKey: ['vapps-by-vdc'],
    queryFn: async () => {
      // Get all vApps and VDCs in parallel
      const [vAppsResponse, vdcsResponse] = await Promise.all([
        VMService.getVApps(),
        VMService.getVDCs(),
      ]);

      // Group vApps by VDC
      const vAppsByVDC = new Map<string, { vdc: VDC; vApps: VApp[] }>();

      // Initialize all VDCs (even those without vApps)
      vdcsResponse.values.forEach((vdc) => {
        vAppsByVDC.set(vdc.id, {
          vdc,
          vApps: [],
        });
      });

      // Add vApps to their respective VDCs
      vAppsResponse.values.forEach((vApp) => {
        const vdcId = vApp.vdc?.id;
        if (vdcId && vAppsByVDC.has(vdcId)) {
          vAppsByVDC.get(vdcId)!.vApps.push(vApp);
        }
      });

      return {
        vAppsByVDC: Array.from(vAppsByVDC.values()),
        totalVApps: vAppsResponse.resultTotal,
        totalVDCs: vdcsResponse.resultTotal,
      };
    },
    enabled: true,
  });
};

/**
 * Hook to fetch vApps for a specific VDC using the VDC-specific endpoint
 */
export const useVAppsByVDCId = (vdcId: string) => {
  return useQuery({
    queryKey: ['vapps-by-vdc-id', vdcId],
    queryFn: async () => {
      // Use the VDC-specific endpoint for better performance
      const response = await cloudApi.get<VCloudPaginatedResponse<VApp>>(
        `/1.0.0/vdcs/${encodeURIComponent(vdcId)}/vapps`
      );
      return response.data;
    },
    enabled: !!vdcId,
  });
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
