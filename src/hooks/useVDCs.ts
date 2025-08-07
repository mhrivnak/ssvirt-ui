import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VDCService } from '../services';
import { QUERY_KEYS } from '../types';
import type {
  VDCQueryParams,
  CreateVDCRequest,
  UpdateVDCRequest,
} from '../types';

/**
 * Hook to fetch all VDCs
 */
export const useVDCs = (params?: VDCQueryParams) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.vdcs, params],
    queryFn: () => VDCService.getVDCs(params),
    enabled: true,
  });
};

/**
 * Hook to fetch VDCs by organization
 */
export const useVDCsByOrganization = (
  organizationId: string,
  params?: VDCQueryParams
) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.vdcsByOrg(organizationId), params],
    queryFn: () => VDCService.getVDCsByOrganization(organizationId, params),
    enabled: !!organizationId,
  });
};

/**
 * Hook to fetch a single VDC
 */
export const useVDC = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.vdc(id),
    queryFn: () => VDCService.getVDC(id),
    enabled: !!id,
  });
};

/**
 * Hook to create a new VDC
 */
export const useCreateVDC = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateVDCRequest) => VDCService.createVDC(data),
    onSuccess: (_, variables) => {
      // Invalidate VDCs list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vdcs });

      // Invalidate VDCs for the specific organization
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.vdcsByOrg(variables.organization_id),
      });
    },
    onError: (error) => {
      console.error('Failed to create VDC:', error);
    },
  });
};

/**
 * Hook to update a VDC
 */
export const useUpdateVDC = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateVDCRequest) => VDCService.updateVDC(data),
    onSuccess: (response, variables) => {
      // Update the specific VDC in cache
      queryClient.setQueryData(QUERY_KEYS.vdc(variables.id), response);

      // Invalidate VDCs list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vdcs });

      // Invalidate VDCs for the specific organization if provided
      if (variables.organization_id) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.vdcsByOrg(variables.organization_id),
        });
      }
    },
    onError: (error) => {
      console.error('Failed to update VDC:', error);
    },
  });
};

/**
 * Hook to delete a VDC
 */
export const useDeleteVDC = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => VDCService.deleteVDC(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: QUERY_KEYS.vdc(deletedId) });

      // Invalidate VDCs list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vdcs });

      // Invalidate VMs that might be associated with this VDC
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.vmsByVdc(deletedId),
      });
    },
    onError: (error) => {
      console.error('Failed to delete VDC:', error);
    },
  });
};

/**
 * Hook to toggle VDC status (enable/disable)
 */
export const useToggleVDCStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      VDCService.toggleVDCStatus(id, enabled),
    onSuccess: (response, variables) => {
      // Update the specific VDC in cache
      queryClient.setQueryData(QUERY_KEYS.vdc(variables.id), response);

      // Invalidate VDCs list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vdcs });
    },
    onError: (error) => {
      console.error('Failed to toggle VDC status:', error);
    },
  });
};
