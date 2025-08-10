import { api } from '../api';
import type {
  VCloudPaginatedResponse,
  VDC,
  CatalogItem,
  InstantiateTemplateRequest,
  VApp,
  VMCloudAPI,
  VMHardwareSection,
} from '../../types';

/**
 * CloudAPI VM Service - Handles VM lifecycle using VMware Cloud Director CloudAPI endpoints
 * This service implements the vApp-based VM creation workflow with template instantiation
 */
export class VMService {
  /**
   * List VDCs accessible to current user
   * Uses CloudAPI to get VDCs with proper organization filtering via JWT
   */
  static async getVDCs(): Promise<VCloudPaginatedResponse<VDC>> {
    const response = await api.get<VCloudPaginatedResponse<VDC>>(
      '/cloudapi/1.0.0/vdcs'
    );
    return response.data;
  }

  /**
   * List catalog items (templates) for a specific catalog
   * @param catalogId The catalog URN or ID
   * @param params Optional pagination parameters
   * @param options Optional request options including AbortSignal
   */
  static async getCatalogItems(
    catalogId: string,
    params?: { page?: number; pageSize?: number },
    options?: { signal?: AbortSignal }
  ): Promise<VCloudPaginatedResponse<CatalogItem>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.pageSize)
      queryParams.set('pageSize', params.pageSize.toString());

    const url = `/cloudapi/1.0.0/catalogs/${encodeURIComponent(catalogId)}/catalogItems${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await api.get<VCloudPaginatedResponse<CatalogItem>>(url, {
      signal: options?.signal,
    });
    return response.data;
  }

  /**
   * Create VM by instantiating template
   * This creates a vApp containing the VM from the specified template
   * @param vdcId The VDC URN where the vApp will be created
   * @param request Template instantiation configuration
   */
  static async instantiateTemplate(
    vdcId: string,
    request: InstantiateTemplateRequest
  ): Promise<VCloudPaginatedResponse<VApp>> {
    const response = await api.post<VCloudPaginatedResponse<VApp>>(
      `/cloudapi/1.0.0/vdcs/${encodeURIComponent(vdcId)}/actions/instantiateTemplate`,
      request
    );
    return response.data;
  }

  /**
   * Get vApp details and status
   * Used for monitoring the creation progress and getting container information
   * @param vappId The vApp URN
   */
  static async getVApp(vappId: string): Promise<VApp> {
    const response = await api.get<VApp>(
      `/cloudapi/1.0.0/vapps/${encodeURIComponent(vappId)}`
    );
    return response.data;
  }

  /**
   * Get VM details
   * Provides detailed information about a specific VM within a vApp
   * @param vmId The VM URN
   */
  static async getVM(vmId: string): Promise<VMCloudAPI> {
    const response = await api.get<VMCloudAPI>(
      `/cloudapi/1.0.0/vms/${encodeURIComponent(vmId)}`
    );
    return response.data;
  }

  /**
   * Get VM hardware configuration
   * Returns detailed hardware specifications including CPU, memory, and virtual devices
   * @param vmId The VM URN
   */
  static async getVMHardware(vmId: string): Promise<VMHardwareSection> {
    const response = await api.get<VMHardwareSection>(
      `/cloudapi/1.0.0/vms/${encodeURIComponent(vmId)}/virtualHardwareSection`
    );
    return response.data;
  }

  /**
   * List all vApps accessible to the current user
   * Used for VM management and overview pages
   */
  static async getVApps(): Promise<VCloudPaginatedResponse<VApp>> {
    const response = await api.get<VCloudPaginatedResponse<VApp>>(
      '/cloudapi/1.0.0/vapps'
    );
    return response.data;
  }

  /**
   * List all VMs accessible to the current user
   * Provides organization-wide VM visibility
   */
  static async getVMs(): Promise<VCloudPaginatedResponse<VMCloudAPI>> {
    const response = await api.get<VCloudPaginatedResponse<VMCloudAPI>>(
      '/cloudapi/1.0.0/vms'
    );
    return response.data;
  }

  /**
   * Power on a VM
   * @param vmId The VM URN
   */
  static async powerOnVM(vmId: string): Promise<void> {
    await api.post(
      `/cloudapi/1.0.0/vms/${encodeURIComponent(vmId)}/actions/powerOn`
    );
  }

  /**
   * Power off a VM
   * @param vmId The VM URN
   */
  static async powerOffVM(vmId: string): Promise<void> {
    await api.post(
      `/cloudapi/1.0.0/vms/${encodeURIComponent(vmId)}/actions/powerOff`
    );
  }

  /**
   * Reboot a VM
   * @param vmId The VM URN
   */
  static async rebootVM(vmId: string): Promise<void> {
    await api.post(
      `/cloudapi/1.0.0/vms/${encodeURIComponent(vmId)}/actions/reboot`
    );
  }

  /**
   * Suspend a VM
   * @param vmId The VM URN
   */
  static async suspendVM(vmId: string): Promise<void> {
    await api.post(
      `/cloudapi/1.0.0/vms/${encodeURIComponent(vmId)}/actions/suspend`
    );
  }

  /**
   * Reset a VM
   * @param vmId The VM URN
   */
  static async resetVM(vmId: string): Promise<void> {
    await api.post(
      `/cloudapi/1.0.0/vms/${encodeURIComponent(vmId)}/actions/reset`
    );
  }

  /**
   * Delete a vApp (and all contained VMs)
   * @param vappId The vApp URN
   */
  static async deleteVApp(vappId: string): Promise<void> {
    await api.delete(`/cloudapi/1.0.0/vapps/${encodeURIComponent(vappId)}`);
  }

  /**
   * Delete a VM from its vApp
   * @param vmId The VM URN
   */
  static async deleteVM(vmId: string): Promise<void> {
    await api.delete(`/cloudapi/1.0.0/vms/${encodeURIComponent(vmId)}`);
  }
}
