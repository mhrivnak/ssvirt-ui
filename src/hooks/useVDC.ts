import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { VDCService } from '../services';
import { QUERY_KEYS } from '../types';
import { useUserPermissions } from './usePermissions';
import type {
  VDCApiQueryParams,
  VDCQueryParams,
  CreateVDCRequest,
  UpdateVDCRequest,
} from '../types';

/**
 * Hook to fetch VDCs with automatic API routing
 * For admins: requires orgId parameter and uses admin API
 * For regular users: uses public API with organization scope
 */
export const useVDCs = (
  orgIdOrParams?: string | VDCApiQueryParams,
  adminParams?: VDCQueryParams
) => {
  const { data: userPermissions } = useUserPermissions();

  // Serialize params to ensure stable queryKey
  const serializedParams = useMemo(() => {
    const params =
      adminParams ||
      (typeof orgIdOrParams !== 'string' ? orgIdOrParams : undefined);
    return params ? JSON.stringify(params) : '';
  }, [orgIdOrParams, adminParams]);

  // For admin users, extract orgId
  const orgId = typeof orgIdOrParams === 'string' ? orgIdOrParams : '';
  const queryKey =
    userPermissions?.canManageSystem && orgId
      ? [...QUERY_KEYS.vdcsByOrg(orgId), serializedParams]
      : [...QUERY_KEYS.vdcs, serializedParams];

  return useQuery({
    queryKey,
    queryFn: async () => {
      try {
        return await VDCService.getVDCs(orgIdOrParams, adminParams);
      } catch (error) {
        // Handle permission errors gracefully
        if (error instanceof Error && error.message.includes('permission')) {
          throw new Error('You do not have permission to view VDCs');
        }
        throw error;
      }
    },
    enabled:
      userPermissions?.canViewVDCs &&
      (userPermissions?.canManageSystem ? !!orgId : true),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: (failureCount, error) => {
      // Don't retry permission errors
      if (error instanceof Error && error.message.includes('permission')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

/**
 * Hook to fetch a single VDC with automatic API routing
 * For admins: requires orgId parameter and uses admin API
 * For regular users: uses public API with VDC URN
 */
export const useVDC = (vdcIdOrOrgId: string, vdcId?: string) => {
  const { data: userPermissions } = useUserPermissions();

  // Determine the actual VDC ID for cache key
  const actualVdcId = vdcId || vdcIdOrOrgId;

  return useQuery({
    queryKey: QUERY_KEYS.vdc(actualVdcId),
    queryFn: async () => {
      try {
        return await VDCService.getVDC(vdcIdOrOrgId, vdcId);
      } catch (error) {
        // Handle permission errors gracefully
        if (error instanceof Error && error.message.includes('permission')) {
          throw new Error('You do not have permission to view this VDC');
        }
        throw error;
      }
    },
    enabled: !!actualVdcId && (userPermissions?.canViewVDCs ?? false),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
    retry: (failureCount, error) => {
      // Don't retry permission errors
      if (error instanceof Error && error.message.includes('permission')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

/**
 * Hook to fetch VDCs for current user's organization(s) (public API)
 */
export const useOrganizationVDCs = (params?: VDCApiQueryParams) => {
  // Serialize params to ensure stable queryKey
  const serializedParams = useMemo(() => {
    return params ? JSON.stringify(params) : '';
  }, [params]);

  return useQuery({
    queryKey: [...QUERY_KEYS.vdcs, 'organization', serializedParams],
    queryFn: () => VDCService.getVDCs(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
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
