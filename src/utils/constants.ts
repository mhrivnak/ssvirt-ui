// Environment-based configuration constants
export const CONFIG = {
  API_BASE_URL:
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  APP_TITLE: import.meta.env.VITE_APP_TITLE || 'SSVIRT Web UI',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '0.0.1',
  DEV_MODE: import.meta.env.VITE_DEV_MODE === 'true',
  JWT_TOKEN_KEY: import.meta.env.VITE_JWT_TOKEN_KEY || 'ssvirt_token',
  LOGO_URL: import.meta.env.VITE_LOGO_URL || '/vite.svg',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/sessions',
  LOGOUT: '/sessions',
  SESSION: '/session',

  // User
  USER_PROFILE: '/v1/user/profile',

  // Organizations
  ORGANIZATIONS: '/org',
  ORGANIZATION_BY_ID: (id: string) => `/org/${id}`,

  // VDCs
  VDC_BY_ID: (id: string) => `/vdc/${id}`,
  VDCS_BY_ORG: (orgId: string) => `/org/${orgId}/vdcs/query`,

  // VMs
  VM_BY_ID: (id: string) => `/vm/${id}`,
  VMS_BY_VAPP: (vappId: string) => `/vApp/${vappId}/vms/query`,
  VM_POWER_ACTION: (vmId: string, action: string) =>
    `/vm/${vmId}/power/action/${action}`,

  // vApps
  INSTANTIATE_VAPP: (vdcId: string) =>
    `/vdc/${vdcId}/action/instantiateVAppTemplate`,

  // Catalogs
  CATALOGS_BY_ORG: (orgId: string) => `/org/${orgId}/catalogs/query`,
  CATALOG_BY_ID: (id: string) => `/catalog/${id}`,
  CATALOG_ITEMS: (catalogId: string) =>
    `/catalog/${catalogId}/catalogItems/query`,
  CATALOG_ITEM_BY_ID: (id: string) => `/catalogItem/${id}`,

  // System
  HEALTH: '/health',
  READY: '/ready',
  VERSION: '/v1/version',
} as const;

// VM Power Actions
export const VM_POWER_ACTIONS = {
  POWER_ON: 'powerOn',
  POWER_OFF: 'powerOff',
  SUSPEND: 'suspend',
  RESET: 'reset',
} as const;

// VM Status Display
export const VM_STATUS_LABELS = {
  POWERED_ON: 'Powered On',
  POWERED_OFF: 'Powered Off',
  SUSPENDED: 'Suspended',
  UNRESOLVED: 'Unresolved',
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  ORGANIZATIONS: '/organizations',
  ORGANIZATION_CREATE: '/organizations/create',
  ORGANIZATION_DETAIL: '/organizations/:id',
  ORGANIZATION_EDIT: '/organizations/:id/edit',
  ORGANIZATION_USERS: '/organizations/:id/users',
  ORGANIZATION_ANALYTICS: '/organizations/:id/analytics',
  VDCS: '/vdcs',
  VDC_CREATE: '/vdcs/create',
  VDC_DETAIL: '/vdcs/:id',
  VDC_EDIT: '/vdcs/:id/edit',
  VDC_USERS: '/vdcs/:id/users',
  VMS: '/vms',
  VM_DETAIL: '/vms/:id',
  CATALOGS: '/catalogs',
  CATALOG_DETAIL: '/catalogs/:id',
  PROFILE: '/profile',
} as const;
