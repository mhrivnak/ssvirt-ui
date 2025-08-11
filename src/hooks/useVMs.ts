import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VMService } from '../services/cloudapi/VMService';
import { QUERY_KEYS } from '../types';
import type {
  VMQueryParams,
  CreateVMRequest,
  UpdateVMRequest,
  VCloudPaginatedResponse,
  VMCloudAPI,
  PaginatedResponse,
  VM,
} from '../types';

/**
 * Transform CloudAPI VM data to legacy format for backward compatibility
 */
const transformVMData = (cloudApiVM: VMCloudAPI): VM => {
  return {
    id: cloudApiVM.id,
    name: cloudApiVM.name,
    vapp_id: cloudApiVM.vapp?.id || '',
    vapp_name: cloudApiVM.vapp?.name || '',
    vm_name: cloudApiVM.name,
    namespace: cloudApiVM.org?.name || '',
    status: cloudApiVM.status,
    cpu_count:
      cloudApiVM.virtualHardwareSection?.items.find(
        (item) => item.resourceType === 3
      )?.virtualQuantity || 1,
    memory_mb:
      cloudApiVM.virtualHardwareSection?.items.find(
        (item) => item.resourceType === 4
      )?.virtualQuantity || 1024,
    created_at: cloudApiVM.createdDate,
    updated_at: cloudApiVM.lastModifiedDate,
    vdc_id: cloudApiVM.vdc?.id || '',
    vdc_name: cloudApiVM.vdc?.name || '',
    org_id: cloudApiVM.org?.id || '',
    org_name: cloudApiVM.org?.name || '',
  };
};

/**
 * Transform CloudAPI paginated response to legacy format
 */
const transformPaginatedResponse = (
  cloudApiResponse: VCloudPaginatedResponse<VMCloudAPI>
): PaginatedResponse<VM> => {
  return {
    success: true,
    data: cloudApiResponse.values.map(transformVMData),
    pagination: {
      page: cloudApiResponse.page,
      per_page: cloudApiResponse.pageSize,
      total_pages: cloudApiResponse.pageCount,
      total: cloudApiResponse.resultTotal,
    },
  };
};

/**
 * Hook to fetch all VMs
 */
export const useVMs = (params?: VMQueryParams) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.vms, params],
    queryFn: async () => {
      const cloudApiResponse = await VMService.getVMs();
      return transformPaginatedResponse(cloudApiResponse);
    },
    enabled: true,
  });
};

/**
 * Hook to fetch VMs by VDC - CloudAPI doesn't support VDC-specific filtering
 * This is implemented by filtering the main VM list
 */
export const useVMsByVDC = (vdcId: string, params?: VMQueryParams) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.vmsByVdc(vdcId), params],
    queryFn: async () => {
      const cloudApiResponse = await VMService.getVMs();
      const transformedResponse = transformPaginatedResponse(cloudApiResponse);
      // Filter by VDC ID
      const filteredVMs = transformedResponse.data.filter(
        (vm) => vm.vdc_id === vdcId
      );
      return {
        ...transformedResponse,
        data: filteredVMs,
        pagination: {
          ...transformedResponse.pagination,
          total: filteredVMs.length,
          total_pages: Math.ceil(
            filteredVMs.length / transformedResponse.pagination.per_page
          ),
        },
      };
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

/**
 * Hook to reboot a VM
 */
export const useRebootVM = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => VMService.rebootVM(id),
    onSuccess: (_, vmId) => {
      // Invalidate VM data to refresh status
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vm(vmId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vms });
    },
    onError: (error) => {
      console.error('Failed to reboot VM:', error);
    },
  });
};

/**
 * Hook to suspend a VM
 */
export const useSuspendVM = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => VMService.suspendVM(id),
    onSuccess: (_, vmId) => {
      // Invalidate VM data to refresh status
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vm(vmId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vms });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardStats });
    },
    onError: (error) => {
      console.error('Failed to suspend VM:', error);
    },
  });
};

/**
 * Hook to reset a VM
 */
export const useResetVM = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => VMService.resetVM(id),
    onSuccess: (_, vmId) => {
      // Invalidate VM data to refresh status
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vm(vmId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vms });
    },
    onError: (error) => {
      console.error('Failed to reset VM:', error);
    },
  });
};

// Note: CloudAPI doesn't support bulk operations
// Bulk operations would need to be implemented by iterating over individual VMs
// This functionality has been removed to focus on core VM management
