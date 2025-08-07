import { api } from './api';
import type {
  VM,
  VMQueryParams,
  CreateVMRequest,
  UpdateVMRequest,
  VMPowerOperation,
  ApiResponse,
  PaginatedResponse,
} from '../types';

export class VMService {
  /**
   * Get all VMs with optional pagination and filtering
   */
  static async getVMs(params?: VMQueryParams): Promise<PaginatedResponse<VM>> {
    const response = await api.get<PaginatedResponse<VM>>('/api/v1/vms', {
      params,
    });
    return response.data;
  }

  /**
   * Get VMs by VDC ID
   */
  static async getVMsByVDC(
    vdcId: string,
    params?: VMQueryParams
  ): Promise<PaginatedResponse<VM>> {
    const response = await api.get<PaginatedResponse<VM>>(
      `/api/v1/vdcs/${vdcId}/vms`,
      {
        params,
      }
    );
    return response.data;
  }

  /**
   * Get a single VM by ID
   */
  static async getVM(id: string): Promise<ApiResponse<VM>> {
    const response = await api.get<ApiResponse<VM>>(`/api/v1/vms/${id}`);
    return response.data;
  }

  /**
   * Create a new VM
   */
  static async createVM(data: CreateVMRequest): Promise<ApiResponse<VM>> {
    const response = await api.post<ApiResponse<VM>>('/api/v1/vms', data);
    return response.data;
  }

  /**
   * Update an existing VM
   */
  static async updateVM(data: UpdateVMRequest): Promise<ApiResponse<VM>> {
    const { id, ...updateData } = data;
    const response = await api.put<ApiResponse<VM>>(
      `/api/v1/vms/${id}`,
      updateData
    );
    return response.data;
  }

  /**
   * Delete a VM
   */
  static async deleteVM(id: string): Promise<ApiResponse<null>> {
    const response = await api.delete<ApiResponse<null>>(`/api/v1/vms/${id}`);
    return response.data;
  }

  /**
   * Power on a VM
   */
  static async powerOnVM(id: string): Promise<ApiResponse<VMPowerOperation>> {
    const response = await api.post<ApiResponse<VMPowerOperation>>(
      `/api/v1/vms/${id}/power-on`
    );
    return response.data;
  }

  /**
   * Power off a VM
   */
  static async powerOffVM(id: string): Promise<ApiResponse<VMPowerOperation>> {
    const response = await api.post<ApiResponse<VMPowerOperation>>(
      `/api/v1/vms/${id}/power-off`
    );
    return response.data;
  }

  /**
   * Reboot a VM
   */
  static async rebootVM(id: string): Promise<ApiResponse<VMPowerOperation>> {
    const response = await api.post<ApiResponse<VMPowerOperation>>(
      `/api/v1/vms/${id}/reboot`
    );
    return response.data;
  }

  /**
   * Suspend a VM
   */
  static async suspendVM(id: string): Promise<ApiResponse<VMPowerOperation>> {
    const response = await api.post<ApiResponse<VMPowerOperation>>(
      `/api/v1/vms/${id}/suspend`
    );
    return response.data;
  }

  /**
   * Reset a VM
   */
  static async resetVM(id: string): Promise<ApiResponse<VMPowerOperation>> {
    const response = await api.post<ApiResponse<VMPowerOperation>>(
      `/api/v1/vms/${id}/reset`
    );
    return response.data;
  }

  /**
   * Get VM power operation status
   */
  static async getVMPowerOperation(
    vmId: string,
    operationId: string
  ): Promise<ApiResponse<VMPowerOperation>> {
    const response = await api.get<ApiResponse<VMPowerOperation>>(
      `/api/v1/vms/${vmId}/operations/${operationId}`
    );
    return response.data;
  }
}
