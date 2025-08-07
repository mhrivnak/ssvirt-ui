import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VMService } from '../services';
import { QUERY_KEYS } from '../types';
import type { VMQueryParams, CreateVMRequest, UpdateVMRequest } from '../types';

/**
 * Hook to fetch all VMs
 */
export const useVMs = (params?: VMQueryParams) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.vms, params],
    queryFn: () => VMService.getVMs(params),
    enabled: true,
  });
};

/**
 * Hook to fetch VMs by VDC
 */
export const useVMsByVDC = (vdcId: string, params?: VMQueryParams) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.vmsByVdc(vdcId), params],
    queryFn: () => VMService.getVMsByVDC(vdcId, params),
    enabled: !!vdcId,
  });
};

/**
 * Hook to fetch a single VM
 */
export const useVM = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.vm(id),
    queryFn: () => VMService.getVM(id),
    enabled: !!id,
  });
};

/**
 * Hook to create a new VM
 */
export const useCreateVM = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateVMRequest) => VMService.createVM(data),
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
 */
export const useUpdateVM = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateVMRequest) => VMService.updateVM(data),
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
