// Core API types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
  details?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
  error?: string;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  details?: string;
  status?: number;
}

// Query and filter types
export interface PaginationParams {
  page?: number;
  per_page?: number;
}

export interface SortParams {
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  status?: string;
  organization_id?: string;
  enabled?: boolean;
}

// Authentication types
export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
}

// Organization user management types
export interface OrganizationUser extends User {
  role: 'admin' | 'user' | 'viewer';
  joined_at: string;
  last_active: string;
  status: 'active' | 'inactive' | 'invited';
}

export interface InviteUserRequest {
  email: string;
  role: 'admin' | 'user' | 'viewer';
}

export interface UpdateUserRoleRequest {
  user_id: string;
  role: 'admin' | 'user' | 'viewer';
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expires_at: string;
  user: User;
}

export interface SessionInfo {
  authenticated: boolean;
  user: User;
  expires_at: string;
}

// Organization types
export interface Organization {
  id: string;
  name: string;
  display_name: string;
  description: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// VDC types
export interface VDC {
  id: string;
  name: string;
  organization_id: string;
  namespace: string;
  allocation_model: string;
  cpu_limit: number;
  memory_limit_mb: number;
  storage_limit_mb: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// VM types
export interface VM {
  id: string;
  name: string;
  vapp_id: string;
  vapp_name: string;
  vm_name: string;
  namespace: string;
  status: VMStatus;
  cpu_count: number;
  memory_mb: number;
  created_at: string;
  updated_at: string;
  vdc_id: string;
  vdc_name: string;
  org_id: string;
  org_name: string;
}

export type VMStatus =
  | 'POWERED_ON'
  | 'POWERED_OFF'
  | 'SUSPENDED'
  | 'UNRESOLVED';

export interface VMPowerOperation {
  vm_id: string;
  action: string;
  status: VMStatus;
  message: string;
  timestamp: string;
  task?: {
    id: string;
    status: string;
    type: string;
  };
}

// Bulk operation types
export interface BulkVMPowerOperation {
  vm_ids: string[];
  action: string;
  operations: VMPowerOperation[];
  completed_count: number;
  failed_count: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface PowerOperationResult {
  vm_id: string;
  success: boolean;
  operation?: VMPowerOperation;
  error?: string;
}

// Catalog types
export interface Catalog {
  id: string;
  name: string;
  organization: string;
  description: string;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  os_type: string;
  vm_instance_type: string;
  cpu_count: number;
  memory_mb: number;
  disk_size_gb: number;
  catalog_id: string;
  created_at: string;
  updated_at: string;
}

// Dashboard types
export interface DashboardStats {
  total_vms: number;
  running_vms: number;
  stopped_vms: number;
  total_organizations: number;
  total_vdcs: number;
  total_catalogs: number;
}

export interface RecentActivity {
  id: string;
  type:
    | 'vm_created'
    | 'vm_powered_on'
    | 'vm_powered_off'
    | 'org_created'
    | 'vdc_created';
  description: string;
  user: string;
  timestamp: string;
  resource_id?: string;
  resource_name?: string;
}

// Query parameter types for each domain
export interface VMQueryParams
  extends PaginationParams,
    SortParams,
    FilterParams {
  vm_status?: VMStatus;
  vdc_id?: string;
}

export interface OrganizationQueryParams
  extends PaginationParams,
    SortParams,
    FilterParams {
  // Organization-specific filters
}

export interface VDCQueryParams
  extends PaginationParams,
    SortParams,
    FilterParams {
  // VDC-specific filters
  allocation_model?: string;
}

export interface CatalogQueryParams
  extends PaginationParams,
    SortParams,
    FilterParams {
  organization?: string;
  is_shared?: boolean;
}

// Request types for create/update operations
export interface CreateOrganizationRequest {
  name: string;
  display_name: string;
  description?: string;
  enabled?: boolean;
}

export interface UpdateOrganizationRequest
  extends Partial<CreateOrganizationRequest> {
  id: string;
}

export interface CreateVDCRequest {
  name: string;
  organization_id: string;
  allocation_model: string;
  cpu_limit: number;
  memory_limit_mb: number;
  storage_limit_mb: number;
  enabled?: boolean;
}

export interface UpdateVDCRequest extends Partial<CreateVDCRequest> {
  id: string;
}

export interface CreateVMRequest {
  name: string;
  vdc_id: string;
  catalog_item_id: string;
  cpu_count?: number;
  memory_mb?: number;
  description?: string;
  network_config?: VMNetworkConfig;
  storage_config?: VMStorageConfig;
  advanced_config?: VMAdvancedConfig;
}

// VM Creation Wizard types
export interface VMNetworkConfig {
  network_id?: string;
  ip_allocation_mode?: 'DHCP' | 'STATIC' | 'POOL';
  ip_address?: string;
  gateway?: string;
  subnet_mask?: string;
  dns_servers?: string[];
}

export interface VMStorageConfig {
  disk_size_gb?: number;
  storage_profile?: string;
  additional_disks?: AdditionalDisk[];
}

export interface AdditionalDisk {
  id: string;
  size_gb: number;
  storage_profile?: string;
  bus_type?: 'IDE' | 'SCSI' | 'SATA';
  bus_sub_type?: string;
}

export interface VMAdvancedConfig {
  cloud_init_enabled?: boolean;
  cloud_init_script?: string;
  guest_customization?: boolean;
  computer_name?: string;
  admin_password?: string;
  auto_logon?: boolean;
  time_zone?: string;
  custom_properties?: Record<string, string>;
}

export interface VMCreationTemplate {
  id: string;
  name: string;
  description: string;
  catalog_item_id: string;
  cpu_count: number;
  memory_mb: number;
  network_config?: VMNetworkConfig;
  storage_config?: VMStorageConfig;
  advanced_config?: VMAdvancedConfig;
  created_by: string;
  created_at: string;
  is_shared: boolean;
}

export interface VMCreationProgress {
  task_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress_percent: number;
  current_step: string;
  steps_completed: string[];
  estimated_completion: string;
  error_message?: string;
}

export interface UpdateVMRequest {
  id: string;
  name?: string;
  cpu_count?: number;
  memory_mb?: number;
}

// React Query keys
export const QUERY_KEYS = {
  // Auth
  session: ['auth', 'session'] as const,
  userProfile: ['auth', 'user'] as const,

  // Dashboard
  dashboardStats: ['dashboard', 'stats'] as const,
  recentActivity: ['dashboard', 'activity'] as const,

  // Organizations
  organizations: ['organizations'] as const,
  organization: (id: string) => ['organizations', id] as const,
  organizationUsers: (orgId: string) =>
    ['organizations', orgId, 'users'] as const,

  // VDCs
  vdcs: ['vdcs'] as const,
  vdc: (id: string) => ['vdcs', id] as const,
  vdcsByOrg: (orgId: string) => ['vdcs', 'organization', orgId] as const,

  // VMs
  vms: ['vms'] as const,
  vm: (id: string) => ['vms', id] as const,
  vmsByVdc: (vdcId: string) => ['vms', 'vdc', vdcId] as const,

  // Catalogs
  catalogs: ['catalogs'] as const,
  catalog: (id: string) => ['catalogs', id] as const,
  catalogItems: (catalogId: string) =>
    ['catalogs', catalogId, 'items'] as const,
} as const;
