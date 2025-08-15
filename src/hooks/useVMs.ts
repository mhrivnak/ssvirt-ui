import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VMService } from '../services/cloudapi/VMService';
import { QUERY_KEYS } from '../types';
import { transformVMData } from '../utils/vmTransformers';
import type {
  VMQueryParams,
  CreateVMRequest,
  UpdateVMRequest,
  PaginatedResponse,
  VM,
} from '../types';

/**
 * Hook to fetch all VMs with client-side filtering and pagination
 */
export const useVMs = (params?: VMQueryParams) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.vms, params],
    queryFn: async () => {
      const cloudApiResponse = await VMService.getVMs();
      let vms = cloudApiResponse.values.map(transformVMData);

      // Apply client-side filtering
      if (params?.vm_status) {
        vms = vms.filter((vm) => vm.status === params.vm_status);
      }
      if (params?.vdc_id) {
        vms = vms.filter((vm) => vm.vdc_id === params.vdc_id);
      }
      if (params?.search) {
        const searchLower = params.search.toLowerCase();
        vms = vms.filter(
          (vm) =>
            vm.name.toLowerCase().includes(searchLower) ||
            vm.vapp_name.toLowerCase().includes(searchLower) ||
            vm.namespace.toLowerCase().includes(searchLower)
        );
      }

      // Apply client-side pagination
      const page = params?.page || 1;
      const per_page = params?.per_page || 20;
      const total = vms.length;
      const total_pages = Math.ceil(total / per_page);
      const start = (page - 1) * per_page;
      const end = start + per_page;
      const paginatedVMs = vms.slice(start, end);

      return {
        success: true,
        data: paginatedVMs,
        pagination: {
          page,
          per_page,
          total,
          total_pages,
        },
      } as PaginatedResponse<VM>;
    },
    enabled: true,
  });
};

/**
 * Hook to fetch VMs by VDC with client-side filtering and pagination
 */
export const useVMsByVDC = (vdcId: string, params?: VMQueryParams) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.vmsByVdc(vdcId), params],
    queryFn: async () => {
      const cloudApiResponse = await VMService.getVMs();
      let vms = cloudApiResponse.values.map(transformVMData);

      // Filter by VDC ID
      vms = vms.filter((vm) => vm.vdc_id === vdcId);

      // Apply additional client-side filtering
      if (params?.vm_status) {
        vms = vms.filter((vm) => vm.status === params.vm_status);
      }
      if (params?.search) {
        const searchLower = params.search.toLowerCase();
        vms = vms.filter(
          (vm) =>
            vm.name.toLowerCase().includes(searchLower) ||
            vm.vapp_name.toLowerCase().includes(searchLower) ||
            vm.namespace.toLowerCase().includes(searchLower)
        );
      }

      // Apply client-side pagination
      const page = params?.page || 1;
      const per_page = params?.per_page || 20;
      const total = vms.length;
      const total_pages = Math.ceil(total / per_page);
      const start = (page - 1) * per_page;
      const end = start + per_page;
      const paginatedVMs = vms.slice(start, end);

      return {
        success: true,
        data: paginatedVMs,
        pagination: {
          page,
          per_page,
          total,
          total_pages,
        },
      } as PaginatedResponse<VM>;
    },
    enabled: !!vdcId,
  });
};

/**
 * Hook to fetch a single VM
 */
export const useVM = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.vm(id),
    queryFn: async () => {
      const cloudApiVM = await VMService.getVM(id);
      return transformVMData(cloudApiVM);
    },
    enabled: !!id,
  });
};

/**
 * Hook to create a new VM via template instantiation
 * CloudAPI uses vApp-based template instantiation instead of direct VM creation
 */
export const useCreateVM = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mutationFn: (_data: CreateVMRequest) => {
      // Note: This needs to be updated to use template instantiation
      // For now, throwing an error to indicate this needs implementation
      throw new Error(
        'VM creation via CloudAPI template instantiation not yet implemented'
      );
    },
    onSuccess: (_, variables) => {
      // Invalidate VMs list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vms });

      // Invalidate VMs for the specific VDC
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.vmsByVdc(variables.vdc_id),
      });

      // Invalidate dashboard stats as VM count changed
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });
    },
    onError: (error) => {
      console.error('Failed to create VM:', error);
    },
  });
};

/**
 * Hook to update a VM
 * CloudAPI doesn't support direct VM updates - this would need to be implemented
 * via specific hardware/configuration section updates
 */
export const useUpdateVM = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mutationFn: (_data: UpdateVMRequest) => {
      // Note: CloudAPI doesn't support generic VM updates
      // This would need to be implemented via specific section updates
      throw new Error('VM updates via CloudAPI not yet implemented');
    },
    onSuccess: (response, variables) => {
      // Update the specific VM in cache
      queryClient.setQueryData(QUERY_KEYS.vm(variables.id), response);

      // Invalidate VMs list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vms });
    },
    onError: (error) => {
      console.error('Failed to update VM:', error);
    },
  });
};

/**
 * Hook to delete a VM
 */
export const useDeleteVM = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => VMService.deleteVM(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: QUERY_KEYS.vm(deletedId) });

      // Invalidate VMs list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vms });

      // Invalidate VDC-specific VM queries for all VDCs
      queryClient.invalidateQueries({
        queryKey: ['vms', 'vdc'],
        type: 'all',
      });

      // Invalidate dashboard stats as VM count changed
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });
    },
    onError: (error) => {
      console.error('Failed to delete VM:', error);
    },
  });
};

/**
 * Hook to power on a VM
 */
export const usePowerOnVM = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => VMService.powerOnVM(id),
    onSuccess: (_, vmId) => {
      // Invalidate VM data to refresh status
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vm(vmId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vms });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });
    },
    onError: (error) => {
      console.error('Failed to power on VM:', error);
    },
  });
};

/**
 * Hook to power off a VM
 */
export const usePowerOffVM = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => VMService.powerOffVM(id),
    onSuccess: (_, vmId) => {
      // Invalidate VM data to refresh status
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vm(vmId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vms });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });
    },
    onError: (error) => {
      console.error('Failed to power off VM:', error);
    },
  });
};

// Note: CloudAPI doesn't support bulk operations
// Bulk operations would need to be implemented by iterating over individual VMs
// This functionality has been removed to focus on core VM management
