import type {
  VMCloudAPI,
  VM,
  VCloudPaginatedResponse,
  PaginatedResponse,
} from '../types';

/**
 * Transform CloudAPI VM data to legacy format for backward compatibility
 */
export const transformVMData = (cloudApiVM: VMCloudAPI): VM => {
  return {
    id: cloudApiVM.id,
    name: cloudApiVM.name,
    vapp_id: cloudApiVM.vapp?.id || '',
    vapp_name: cloudApiVM.vapp?.name || '',
    vm_name: cloudApiVM.name,
    namespace: cloudApiVM.org?.name || '',
    status: cloudApiVM.status,
    cpu_count: cloudApiVM.hardware?.numCpus || 1,
    memory_mb: cloudApiVM.hardware?.memoryMB || 1024,
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
export const transformPaginatedResponse = (
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
