import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { VDCService } from '../services/cloudapi/VDCService';
import { QUERY_KEYS } from '../types';
import { useRole } from './useRole';
import type {
  VDCQueryParams,
  CreateVDCRequest,
  UpdateVDCRequest,
} from '../types';

/**
 * Hook to fetch VDCs for an organization (System Admin only)
 */
export const useVDCs = (orgId: string, params?: VDCQueryParams) => {
  const { capabilities } = useRole();

  // Serialize params to ensure stable queryKey
  const serializedParams = useMemo(() => {
    return params ? JSON.stringify(params) : '';
  }, [params]);

  return useQuery({
    queryKey: [...QUERY_KEYS.vdcsByOrg(orgId), serializedParams],
    queryFn: () => VDCService.getVDCs(orgId, params),
    enabled: !!orgId && capabilities.canManageSystem,
  });
};

/**
 * Hook to fetch a single VDC (System Admin only)
 */
export const useVDC = (orgId: string, vdcId: string) => {
  const { capabilities } = useRole();

  return useQuery({
    queryKey: QUERY_KEYS.vdc(vdcId),
    queryFn: () => VDCService.getVDC(orgId, vdcId),
    enabled: !!orgId && !!vdcId && capabilities.canManageSystem,
  });
};

/**
 * Hook to create a new VDC (System Admin only)
 */
export const useCreateVDC = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, data }: { orgId: string; data: CreateVDCRequest }) =>
      VDCService.createVDC(orgId, data),
    onSuccess: (_, variables) => {
      // Invalidate VDCs list for the organization
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.vdcsByOrg(variables.orgId),
      });
    },
    onError: (error) => {
      console.error('Failed to create VDC:', error);
    },
  });
};

/**
 * Hook to update a VDC (System Admin only)
 */
export const useUpdateVDC = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orgId,
      vdcId,
      data,
    }: {
      orgId: string;
      vdcId: string;
      data: UpdateVDCRequest;
    }) => VDCService.updateVDC(orgId, vdcId, data),
    onSuccess: (response, variables) => {
      // Update the specific VDC in cache
      queryClient.setQueryData(QUERY_KEYS.vdc(variables.vdcId), response);

      // Invalidate VDCs list for the organization
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.vdcsByOrg(variables.orgId),
      });
    },
    onError: (error) => {
      console.error('Failed to update VDC:', error);
    },
  });
};

/**
 * Hook to delete a VDC (System Admin only)
 */
export const useDeleteVDC = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, vdcId }: { orgId: string; vdcId: string }) =>
      VDCService.deleteVDC(orgId, vdcId),
    onSuccess: (_, variables) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: QUERY_KEYS.vdc(variables.vdcId) });

      // Invalidate VDCs list for the organization
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.vdcsByOrg(variables.orgId),
      });

      // Invalidate VMs that might be associated with this VDC
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.vmsByVdc(variables.vdcId),
      });
    },
    onError: (error) => {
      console.error('Failed to delete VDC:', error);
    },
  });
};
