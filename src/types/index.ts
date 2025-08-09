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

// VMware Cloud Director pagination envelope structure
export interface VCloudPaginatedResponse<T> {
  resultTotal: number;    // Total number of results across all pages
  pageCount: number;      // Total number of pages  
  page: number;           // Current page number
  pageSize: number;       // Number of results per page
  associations?: any[];   // Optional association metadata
  values: T[];            // Array of actual data objects
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

// Entity Reference System
export interface EntityRef {
  name: string;
  id: string; // URN format: urn:vcloud:type:uuid
}

// Authentication types
export interface User {
  id: string; // URN format: urn:vcloud:user:uuid
  username: string;
  fullName: string;
  description?: string;
  email: string;
  roleEntityRefs: EntityRef[]; // Array of role references
  orgEntityRef: EntityRef; // Organization reference
  deployedVmQuota: number;
  storedVmQuota: number;
  nameInSource?: string;
  enabled: boolean;
  isGroupRole: boolean;
  providerType: string;
  locked: boolean;
  stranded: boolean;
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

// User profile management types
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  date_format: string;
  time_format: '12h' | '24h';
  notifications: {
    email: boolean;
    browser: boolean;
    vm_state_changes: boolean;
    system_maintenance: boolean;
  };
  default_items_per_page: number;
  auto_refresh_interval: number;
}

export interface UpdatePreferencesRequest {
  preferences: Partial<UserPreferences>;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface SecuritySetting {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  last_used: string;
}

export interface UpdateSecuritySettingRequest {
  setting_id: string;
  enabled: boolean;
}

// VDC user management types
export interface VDCUser extends User {
  role: 'admin' | 'user' | 'viewer';
  joined_at: string;
  last_active: string;
  status: 'active' | 'inactive' | 'invited';
}

export interface InviteVDCUserRequest {
  email: string;
  role: 'admin' | 'user' | 'viewer';
}

export interface UpdateVDCUserRoleRequest {
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

// New Role Type
export interface Role {
  id: string; // URN format: urn:vcloud:role:uuid
  name: string;
  description: string;
  bundleKey: string;
  readOnly: boolean;
}

// Role Constants
export const ROLE_NAMES = {
  SYSTEM_ADMIN: 'System Administrator',
  ORG_ADMIN: 'Organization Administrator',
  VAPP_USER: 'vApp User',
} as const;

// Permission Checking Utilities
export interface UserPermissions {
  canCreateOrganizations: boolean;
  canManageUsers: boolean;
  canManageSystem: boolean;
  canManageOrganization: (orgId: string) => boolean;
}

// Organization types
export interface Organization {
  id: string; // URN format: urn:vcloud:org:uuid
  name: string;
  displayName: string;
  description?: string;
  isEnabled: boolean;
  orgVdcCount: number;
  catalogCount: number;
  vappCount: number;
  runningVMCount: number;
  userCount: number;
  diskCount: number;
  managedBy: EntityRef;
  canManageOrgs: boolean;
  canPublish: boolean;
  maskedEventTaskUsername: string;
  directlyManagedOrgCount: number;
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

// CloudAPI Query Parameters
export interface UserQueryParams
  extends PaginationParams,
    SortParams,
    FilterParams {
  orgId?: string;
  roleId?: string;
  enabled?: boolean;
}

export interface RoleQueryParams
  extends PaginationParams,
    SortParams,
    FilterParams {
  readOnly?: boolean;
}

// Request types for create/update operations
export interface CreateOrganizationRequest {
  name: string;
  displayName: string;
  description?: string;
  isEnabled?: boolean;
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
  userPreferences: ['auth', 'user', 'preferences'] as const,
  securitySettings: ['auth', 'user', 'security'] as const,

  // Dashboard
  dashboardStats: ['dashboard', 'stats'] as const,
  recentActivity: ['dashboard', 'activity'] as const,

  // CloudAPI Users
  users: ['cloudapi', 'users'] as const,
  user: (id: string) => ['cloudapi', 'users', id] as const,

  // CloudAPI Roles
  roles: ['cloudapi', 'roles'] as const,
  role: (id: string) => ['cloudapi', 'roles', id] as const,

  // Organizations
  organizations: ['organizations'] as const,
  organization: (id: string) => ['organizations', id] as const,
  organizationUsers: (orgId: string) =>
    ['organizations', orgId, 'users'] as const,

  // VDCs
  vdcs: ['vdcs'] as const,
  vdc: (id: string) => ['vdcs', id] as const,
  vdcsByOrg: (orgId: string) => ['vdcs', 'organization', orgId] as const,
  vdcUsers: (vdcId: string) => ['vdcs', vdcId, 'users'] as const,

  // VMs
  vms: ['vms'] as const,
  vm: (id: string) => ['vms', id] as const,
  vmsByVdc: (vdcId: string) => ['vms', 'vdc', vdcId] as const,

  // Catalogs
  catalogs: ['catalogs'] as const,
  catalog: (id: string) => ['catalogs', id] as const,
  catalogItems: (catalogId: string) =>
    ['catalogs', catalogId, 'items'] as const,

  // Resource Monitoring & Analytics
  resourceUsage: ['monitoring', 'resource-usage'] as const,
  resourceUsageByOrg: (orgId: string) =>
    ['monitoring', 'resource-usage', 'org', orgId] as const,
  resourceUsageByVdc: (vdcId: string) =>
    ['monitoring', 'resource-usage', 'vdc', vdcId] as const,
  costReports: ['monitoring', 'cost-reports'] as const,
  capacityPlanning: ['monitoring', 'capacity-planning'] as const,
  usageAlerts: ['monitoring', 'alerts'] as const,
  customDashboards: ['monitoring', 'dashboards'] as const,
  customDashboard: (id: string) => ['monitoring', 'dashboards', id] as const,
  // Batch Operations & Automation
  batchOperations: ['automation', 'batch-operations'] as const,
  batchOperation: (id: string) =>
    ['automation', 'batch-operations', id] as const,
  deploymentTemplates: ['automation', 'deployment-templates'] as const,
  deploymentTemplate: (id: string) =>
    ['automation', 'deployment-templates', id] as const,
  scheduledOperations: ['automation', 'scheduled-operations'] as const,
  scheduledOperation: (id: string) =>
    ['automation', 'scheduled-operations', id] as const,
  automationWorkflows: ['automation', 'workflows'] as const,
  automationWorkflow: (id: string) => ['automation', 'workflows', id] as const,
  operationQueues: ['automation', 'queues'] as const,
  operationQueue: (id: string) => ['automation', 'queues', id] as const,
} as const;

// Resource Monitoring & Analytics types

export interface ResourceUsageMetrics {
  timestamp: string;
  cpu_usage_percent: number;
  memory_usage_percent: number;
  storage_usage_percent: number;
  network_in_mbps: number;
  network_out_mbps: number;
  disk_read_iops: number;
  disk_write_iops: number;
}

export interface ResourceUsageSummary {
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  start_date: string;
  end_date: string;
  total_cpu_hours: number;
  total_memory_gb_hours: number;
  total_storage_gb_hours: number;
  total_network_gb: number;
  peak_cpu_usage: number;
  peak_memory_usage: number;
  peak_storage_usage: number;
  average_cpu_usage: number;
  average_memory_usage: number;
  average_storage_usage: number;
  metrics: ResourceUsageMetrics[];
}

export interface OrganizationResourceUsage {
  organization_id: string;
  organization_name: string;
  current_usage: {
    cpu_cores_allocated: number;
    cpu_cores_used: number;
    memory_gb_allocated: number;
    memory_gb_used: number;
    storage_gb_allocated: number;
    storage_gb_used: number;
  };
  quota_limits: {
    cpu_cores_limit: number;
    memory_gb_limit: number;
    storage_gb_limit: number;
  };
  usage_summary: ResourceUsageSummary;
  vdcs: VDCResourceUsage[];
}

export interface VDCResourceUsage {
  vdc_id: string;
  vdc_name: string;
  namespace: string;
  current_usage: {
    cpu_cores_allocated: number;
    cpu_cores_used: number;
    memory_gb_allocated: number;
    memory_gb_used: number;
    storage_gb_allocated: number;
    storage_gb_used: number;
    vm_count: number;
    running_vm_count: number;
  };
  quota_limits: {
    cpu_cores_limit: number;
    memory_gb_limit: number;
    storage_gb_limit: number;
  };
  usage_summary: ResourceUsageSummary;
  vms: VMResourceUsage[];
}

export interface VMResourceUsage {
  vm_id: string;
  vm_name: string;
  status: VMStatus;
  allocated_resources: {
    cpu_cores: number;
    memory_gb: number;
    storage_gb: number;
  };
  usage_summary: ResourceUsageSummary;
}

export interface CostReport {
  id: string;
  name: string;
  description: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date: string;
  currency: string;
  total_cost: number;
  cost_breakdown: {
    compute_cost: number;
    storage_cost: number;
    network_cost: number;
    other_cost: number;
  };
  cost_by_organization: OrganizationCost[];
  cost_trends: CostTrend[];
  created_at: string;
  updated_at: string;
}

export interface OrganizationCost {
  organization_id: string;
  organization_name: string;
  total_cost: number;
  cost_breakdown: {
    compute_cost: number;
    storage_cost: number;
    network_cost: number;
    other_cost: number;
  };
  vdc_costs: VDCCost[];
}

export interface VDCCost {
  vdc_id: string;
  vdc_name: string;
  total_cost: number;
  cost_breakdown: {
    compute_cost: number;
    storage_cost: number;
    network_cost: number;
    other_cost: number;
  };
  vm_costs: VMCost[];
}

export interface VMCost {
  vm_id: string;
  vm_name: string;
  total_cost: number;
  cost_breakdown: {
    compute_cost: number;
    storage_cost: number;
    network_cost: number;
    other_cost: number;
  };
  uptime_hours: number;
}

export interface CostTrend {
  date: string;
  total_cost: number;
  compute_cost: number;
  storage_cost: number;
  network_cost: number;
  other_cost: number;
}

export interface CapacityPlanningData {
  current_capacity: {
    total_cpu_cores: number;
    used_cpu_cores: number;
    total_memory_gb: number;
    used_memory_gb: number;
    total_storage_gb: number;
    used_storage_gb: number;
  };
  utilization_trends: {
    cpu_trend: UtilizationTrend[];
    memory_trend: UtilizationTrend[];
    storage_trend: UtilizationTrend[];
  };
  growth_projections: {
    projected_cpu_usage: ProjectionData[];
    projected_memory_usage: ProjectionData[];
    projected_storage_usage: ProjectionData[];
  };
  recommendations: CapacityRecommendation[];
}

export interface UtilizationTrend {
  date: string;
  usage_percent: number;
  allocated_percent: number;
}

export interface ProjectionData {
  date: string;
  projected_usage_percent: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
}

export interface CapacityRecommendation {
  id: string;
  type: 'scale_up' | 'scale_down' | 'optimize' | 'alert';
  priority: 'low' | 'medium' | 'high' | 'critical';
  resource_type: 'cpu' | 'memory' | 'storage' | 'network';
  title: string;
  description: string;
  impact: string;
  estimated_cost_impact: number;
  recommended_action: string;
  deadline: string;
  created_at: string;
}

export interface UsageAlert {
  id: string;
  name: string;
  description: string;
  alert_type: 'threshold' | 'anomaly' | 'trend';
  severity: 'info' | 'warning' | 'error' | 'critical';
  resource_type: 'cpu' | 'memory' | 'storage' | 'network' | 'cost';
  scope: 'global' | 'organization' | 'vdc' | 'vm';
  scope_id?: string;
  scope_name?: string;
  threshold_config?: {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    value: number;
    duration_minutes: number;
  };
  status: 'active' | 'resolved' | 'suppressed';
  triggered_at: string;
  resolved_at?: string;
  current_value: number;
  message: string;
  recommendations: string[];
  notification_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  alert_type: 'threshold' | 'anomaly' | 'trend';
  severity: 'info' | 'warning' | 'error' | 'critical';
  resource_type: 'cpu' | 'memory' | 'storage' | 'network' | 'cost';
  scope: 'global' | 'organization' | 'vdc' | 'vm';
  scope_id?: string;
  threshold_config?: {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    value: number;
    duration_minutes: number;
  };
  notification_config: {
    email_enabled: boolean;
    email_recipients: string[];
    webhook_enabled: boolean;
    webhook_url?: string;
  };
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CustomDashboard {
  id: string;
  name: string;
  description: string;
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  is_shared: boolean;
  is_default: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardLayout {
  columns: number;
  row_height: number;
  margin: [number, number];
  container_padding: [number, number];
  breakpoints: Record<string, number>;
  responsive: boolean;
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'alert_list' | 'text';
  title: string;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  config: WidgetConfig;
  data_source: DataSource;
  refresh_interval: number;
  created_at: string;
  updated_at: string;
}

export interface WidgetConfig {
  chart_type?: 'line' | 'bar' | 'pie' | 'donut' | 'area' | 'gauge';
  display_legend?: boolean;
  show_grid?: boolean;
  color_scheme?: string[];
  time_range?: string;
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
  format?: 'number' | 'percentage' | 'bytes' | 'currency';
  thresholds?: {
    warning: number;
    critical: number;
  };
  custom_styling?: Record<string, unknown>;
}

export interface DataSource {
  type: 'resource_usage' | 'cost_data' | 'alerts' | 'capacity' | 'custom_query';
  query: string;
  filters: Record<string, unknown>;
  groupBy?: string[];
  timeRange?: {
    from: string;
    to: string;
  };
}

export interface ExportRequest {
  format: 'csv' | 'xlsx' | 'pdf' | 'json';
  data_type:
    | 'resource_usage'
    | 'cost_report'
    | 'capacity_planning'
    | 'alerts'
    | 'dashboard';
  filters: Record<string, unknown>;
  time_range: {
    from: string;
    to: string;
  };
  include_charts?: boolean;
  include_raw_data?: boolean;
}

export interface ExportJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress_percent: number;
  format: 'csv' | 'xlsx' | 'pdf' | 'json';
  data_type:
    | 'resource_usage'
    | 'cost_report'
    | 'capacity_planning'
    | 'alerts'
    | 'dashboard';
  file_url?: string;
  file_size_bytes?: number;
  error_message?: string;
  created_at: string;
  completed_at?: string;
  expires_at?: string;
}

// Query parameter types for monitoring endpoints
export interface ResourceUsageQueryParams extends PaginationParams, SortParams {
  organization_id?: string;
  vdc_id?: string;
  vm_id?: string;
  start_date?: string;
  end_date?: string;
  period?: 'hourly' | 'daily' | 'weekly' | 'monthly';
  resource_type?: 'cpu' | 'memory' | 'storage' | 'network';
}

export interface CostReportQueryParams extends PaginationParams, SortParams {
  organization_id?: string;
  vdc_id?: string;
  start_date?: string;
  end_date?: string;
  period?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  include_breakdown?: boolean;
}

export interface AlertQueryParams extends PaginationParams, SortParams {
  status?: 'active' | 'resolved' | 'suppressed';
  severity?: 'info' | 'warning' | 'error' | 'critical';
  resource_type?: 'cpu' | 'memory' | 'storage' | 'network' | 'cost';
  scope?: 'global' | 'organization' | 'vdc' | 'vm';
  scope_id?: string;
}

// Batch Operations & Automation types
export interface BatchOperation {
  id: string;
  name: string;
  description?: string;
  operation_type:
    | 'power'
    | 'configuration'
    | 'deployment'
    | 'cleanup'
    | 'backup';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  target_type: 'vms' | 'vdcs' | 'organizations';
  target_count: number;
  completed_count: number;
  failed_count: number;
  progress_percent: number;
  created_by: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  is_rollback_supported: boolean;
  can_cancel: boolean;
  targets: BatchOperationTarget[];
  results?: BatchOperationResult[];
}

export interface BatchOperationTarget {
  id: string;
  type: 'vm' | 'vdc' | 'organization';
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  result_data?: Record<string, unknown>;
}

export interface BatchOperationResult {
  target_id: string;
  target_name: string;
  success: boolean;
  error_message?: string;
  execution_time_ms: number;
  rollback_data?: Record<string, unknown>;
}

export interface DeploymentTemplate {
  id: string;
  name: string;
  description?: string;
  template_type: 'vm' | 'vapp' | 'vdc';
  category: 'development' | 'testing' | 'production' | 'custom';
  is_shared: boolean;
  is_default: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  usage_count: number;
  configuration: DeploymentTemplateConfig;
  tags?: string[];
}

export interface DeploymentTemplateConfig {
  vm_templates?: VMTemplateConfig[];
  network_config?: NetworkTemplateConfig;
  resource_allocation?: ResourceAllocationConfig;
  automation_scripts?: AutomationScript[];
  post_deployment_tasks?: PostDeploymentTask[];
}

export interface VMTemplateConfig {
  catalog_item_id: string;
  name_pattern: string;
  count: number;
  cpu_count: number;
  memory_mb: number;
  disk_size_gb?: number;
  network_interfaces?: NetworkInterfaceConfig[];
  custom_properties?: Record<string, string>;
}

export interface NetworkTemplateConfig {
  network_name?: string;
  subnet_cidr?: string;
  gateway_ip?: string;
  dns_servers?: string[];
  dhcp_enabled?: boolean;
}

export interface ResourceAllocationConfig {
  cpu_allocation_mhz?: number;
  memory_allocation_mb?: number;
  storage_allocation_gb?: number;
  network_quota_mbps?: number;
}

export interface NetworkInterfaceConfig {
  network_name: string;
  ip_assignment: 'dhcp' | 'static' | 'pool';
  ip_address?: string;
  is_primary: boolean;
}

export interface AutomationScript {
  id: string;
  name: string;
  script_type: 'powershell' | 'bash' | 'cloud-init' | 'ansible';
  content: string;
  execution_order: number;
  timeout_seconds: number;
}

export interface PostDeploymentTask {
  id: string;
  name: string;
  task_type:
    | 'configure_networking'
    | 'install_software'
    | 'join_domain'
    | 'custom_script';
  configuration: Record<string, unknown>;
  execution_order: number;
  retry_count: number;
}

export interface ScheduledOperation {
  id: string;
  name: string;
  description?: string;
  operation_type: 'power' | 'backup' | 'maintenance' | 'cleanup' | 'deployment';
  schedule_type: 'once' | 'recurring';
  schedule_expression: string; // cron expression
  target_type: 'vms' | 'vdcs' | 'organizations';
  target_filters: OperationTargetFilter[];
  operation_config: Record<string, unknown>;
  is_enabled: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_run_at?: string;
  next_run_at?: string;
  run_count: number;
  success_count: number;
  failure_count: number;
}

export interface OperationTargetFilter {
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'regex';
  value: string;
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  description?: string;
  workflow_type: 'sequential' | 'parallel' | 'conditional';
  is_enabled: boolean;
  is_default?: boolean;
  status: 'active' | 'disabled' | 'error';
  trigger_type: 'manual' | 'event' | 'schedule';
  trigger_config?: WorkflowTriggerConfig;
  steps: WorkflowStep[];
  created_by: string;
  created_at: string;
  updated_at: string;
  execution_count: number;
  success_count: number;
  success_rate: number;
  average_duration_seconds: number;
  last_execution_at?: string;
  last_execution_status?: 'completed' | 'failed' | 'cancelled';
}

export interface WorkflowTriggerConfig {
  event_types?: string[];
  schedule_expression?: string;
  conditions?: WorkflowCondition[];
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  step_type: 'batch_operation' | 'api_call' | 'script' | 'delay' | 'approval';
  configuration: Record<string, unknown>;
  depends_on?: string[];
  on_failure: 'stop' | 'continue' | 'retry';
  retry_count: number;
  timeout_seconds: number;
}

export interface OperationQueue {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'stopped';
  max_concurrent_operations: number;
  current_operation_count: number;
  pending_operation_count: number;
  completed_operation_count: number;
  failed_operation_count: number;
  created_at: string;
  operations: QueuedOperation[];
}

export interface QueuedOperation {
  id: string;
  queue_id: string;
  operation_type: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  queued_at: string;
  started_at?: string;
  completed_at?: string;
  estimated_duration_seconds?: number;
  actual_duration_seconds?: number;
  operation_data: Record<string, unknown>;
  dependencies?: string[];
}

// Query parameter types for batch operations
export interface BatchOperationQueryParams
  extends PaginationParams,
    SortParams {
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  operation_type?:
    | 'power'
    | 'configuration'
    | 'deployment'
    | 'cleanup'
    | 'backup';
  target_type?: 'vms' | 'vdcs' | 'organizations';
  created_by?: string;
  date_from?: string;
  date_to?: string;
}

export interface DeploymentTemplateQueryParams
  extends PaginationParams,
    SortParams {
  template_type?: 'vm' | 'vapp' | 'vdc';
  category?: 'development' | 'testing' | 'production' | 'custom';
  is_shared?: boolean;
  created_by?: string;
  tags?: string[];
}

export interface ScheduledOperationQueryParams
  extends PaginationParams,
    SortParams {
  operation_type?:
    | 'power'
    | 'backup'
    | 'maintenance'
    | 'cleanup'
    | 'deployment';
  is_enabled?: boolean;
  created_by?: string;
}

export interface AutomationWorkflowQueryParams
  extends PaginationParams,
    SortParams,
    FilterParams {
  workflow_type?: 'sequential' | 'parallel' | 'conditional';
  trigger_type?: 'manual' | 'event' | 'schedule';
  status?: 'active' | 'disabled' | 'error';
  is_enabled?: boolean;
  created_by?: string;
}

// Request types for creating batch operations
export interface CreateBatchOperationRequest {
  name: string;
  description?: string;
  operation_type:
    | 'power'
    | 'configuration'
    | 'deployment'
    | 'cleanup'
    | 'backup';
  operation_config: Record<string, unknown>;
  target_type: 'vms' | 'vdcs' | 'organizations';
  target_ids?: string[];
  target_filters?: OperationTargetFilter[];
  schedule_at?: string; // ISO datetime for scheduled execution
}

export interface CreateDeploymentTemplateRequest {
  name: string;
  description?: string;
  template_type: 'vm' | 'vapp' | 'vdc';
  category: 'development' | 'testing' | 'production' | 'custom';
  is_shared?: boolean;
  configuration: DeploymentTemplateConfig;
  tags?: string[];
}

export interface CreateScheduledOperationRequest {
  name: string;
  description?: string;
  operation_type: 'power' | 'backup' | 'maintenance' | 'cleanup' | 'deployment';
  schedule_expression: string;
  target_type: 'vms' | 'vdcs' | 'organizations';
  target_filters: OperationTargetFilter[];
  operation_config: Record<string, unknown>;
  is_enabled?: boolean;
}

export interface CreateAutomationWorkflowRequest {
  name: string;
  description?: string;
  workflow_type: 'sequential' | 'parallel' | 'conditional';
  trigger_type: 'manual' | 'event' | 'schedule';
  trigger_config?: WorkflowTriggerConfig;
  steps: Omit<WorkflowStep, 'id'>[];
  is_enabled?: boolean;
}
