// Core API types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
  details?: string;
}

// Authentication types
export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
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
  vdc_name: string;
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
  created_at: string;
  updated_at: string;
}
