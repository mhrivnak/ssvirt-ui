import { getRuntimeConfig } from './config';

// Fallback configuration for when runtime config is not available (e.g., tests)
const FALLBACK_CONFIG = {
  API_BASE_URL:
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  APP_TITLE: import.meta.env.VITE_APP_TITLE || 'SSVIRT Web UI',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '0.0.1',
  DEV_MODE: import.meta.env.VITE_DEV_MODE === 'true',
  JWT_TOKEN_KEY: import.meta.env.VITE_JWT_TOKEN_KEY || 'ssvirt_token',
  LOGO_URL: import.meta.env.VITE_LOGO_URL || '/vite.svg',
} as const;

// Runtime configuration getter with fallback
export const getConfig = () => {
  // In test environment, always use fallback to avoid async loading issues
  if (process.env.NODE_ENV === 'test' || typeof window === 'undefined') {
    return FALLBACK_CONFIG;
  }

  try {
    const runtimeConfig = getRuntimeConfig();
    return {
      API_BASE_URL: runtimeConfig.apiBaseUrl,
      APP_TITLE: runtimeConfig.appTitle,
      APP_VERSION: runtimeConfig.appVersion,
      DEV_MODE: import.meta.env.VITE_DEV_MODE === 'true',
      JWT_TOKEN_KEY: import.meta.env.VITE_JWT_TOKEN_KEY || 'ssvirt_token',
      LOGO_URL: runtimeConfig.logoUrl,
    } as const;
  } catch {
    // Runtime config not loaded yet, use fallback
    return FALLBACK_CONFIG;
  }
};

// Legacy CONFIG export for backward compatibility
export const CONFIG = new Proxy({} as ReturnType<typeof getConfig>, {
  get(_target, prop) {
    return getConfig()[prop as keyof ReturnType<typeof getConfig>];
  },
});

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/sessions',
  LOGOUT: '/sessions',
  SESSION: '/session',

  // User
  USER_PROFILE: '/v1/user/profile',
  USER_PREFERENCES: '/v1/user/preferences',
  USER_PASSWORD: '/v1/user/password',
  USER_SECURITY_SETTINGS: '/v1/user/security/settings',
  USER_SECURITY_SETTING: (settingId: string) => `/v1/user/security/settings/${settingId}`,

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
