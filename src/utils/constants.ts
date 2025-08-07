import { getRuntimeConfig } from './config';

// Runtime configuration getter
export const getConfig = () => {
  const runtimeConfig = getRuntimeConfig();
  return {
    API_BASE_URL: runtimeConfig.apiBaseUrl,
    APP_TITLE: runtimeConfig.appTitle,
    APP_VERSION: runtimeConfig.appVersion,
    DEV_MODE: import.meta.env.VITE_DEV_MODE === 'true',
    JWT_TOKEN_KEY: import.meta.env.VITE_JWT_TOKEN_KEY || 'ssvirt_token',
    LOGO_URL: runtimeConfig.logoUrl,
  } as const;
};

// Legacy CONFIG export for backward compatibility
// Note: This will throw if runtime config is not loaded
export const CONFIG = new Proxy({} as any, {
  get(_target, prop) {
    return getConfig()[prop as keyof ReturnType<typeof getConfig>];
  }
});

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
  VM_CREATE: '/vms/create',
  VM_DETAIL: '/vms/:id',
  VM_EDIT: '/vms/:id/edit',
  VDC_MONITORING: '/vdcs/:id/monitoring',
  CATALOGS: '/catalogs',
  CATALOG_DETAIL: '/catalogs/:id',
  PROFILE: '/profile',
} as const;
