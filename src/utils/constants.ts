import { getRuntimeConfig } from './config';

// Fallback configuration for when runtime config is not available (e.g., tests)
const FALLBACK_CONFIG = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
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
    console.log('🔧 Using runtime config for API calls:', runtimeConfig);
    const config = {
      API_BASE_URL: runtimeConfig.apiBaseUrl,
      APP_TITLE: runtimeConfig.appTitle,
      APP_VERSION: runtimeConfig.appVersion,
      DEV_MODE: import.meta.env.VITE_DEV_MODE === 'true',
      JWT_TOKEN_KEY: import.meta.env.VITE_JWT_TOKEN_KEY || 'ssvirt_token',
      LOGO_URL: runtimeConfig.logoUrl,
    } as const;
    console.log('🔧 Final config object:', config);
    return config;
  } catch (error) {
    // Runtime config not loaded yet, use fallback
    console.warn('⚠️ Runtime config not available, using fallback:', error);
    console.log('🔧 Using fallback config:', FALLBACK_CONFIG);
    return FALLBACK_CONFIG;
  }
};

// Legacy CONFIG export for backward compatibility
export const CONFIG = new Proxy({} as ReturnType<typeof getConfig>, {
  get(_target, prop) {
    return getConfig()[prop as keyof ReturnType<typeof getConfig>];
  },
});

// API endpoints - organized by API type
export const API_ENDPOINTS = {
  // CloudAPI endpoints (use with cloudApi instance)
  CLOUDAPI: {
    // Authentication
    LOGIN: '/1.0.0/sessions',
    LOGOUT: '/1.0.0/sessions',
    SESSION: '/1.0.0/session',

    // Users
    USERS: '/1.0.0/users',
    CURRENT_USER: '/1.0.0/users/current',
    USER_BY_ID: (id: string) => `/1.0.0/users/${encodeURIComponent(id)}`,

    // Roles
    ROLES: '/1.0.0/roles',
    ROLE_BY_ID: (id: string) => `/1.0.0/roles/${encodeURIComponent(id)}`,

    // Organizations
    ORGANIZATIONS: '/1.0.0/orgs',
    ORGANIZATION_BY_ID: (id: string) => `/1.0.0/orgs/${encodeURIComponent(id)}`,

    // VDCs
    VDCS: '/1.0.0/vdcs',
    VDC_BY_ID: (id: string) => `/1.0.0/vdcs/${encodeURIComponent(id)}`,

    // VMs and vApps
    VMS: '/1.0.0/vms',
    VM_BY_ID: (id: string) => `/1.0.0/vms/${encodeURIComponent(id)}`,
    VAPPS: '/1.0.0/vapps',
    VAPP_BY_ID: (id: string) => `/1.0.0/vapps/${encodeURIComponent(id)}`,

    // Catalogs
    CATALOGS: '/1.0.0/catalogs',
    CATALOG_BY_ID: (id: string) => `/1.0.0/catalogs/${encodeURIComponent(id)}`,
    CATALOG_ITEMS: (catalogId: string) =>
      `/1.0.0/catalogs/${encodeURIComponent(catalogId)}/catalogItems`,
  },

  // Legacy API endpoints (use with api instance)
  LEGACY: {
    // User
    USER_PROFILE: '/v1/user/profile',
    USER_PREFERENCES: '/v1/user/preferences',
    USER_PASSWORD: '/v1/user/password',
    USER_SECURITY_SETTINGS: '/v1/user/security/settings',
    USER_SECURITY_SETTING: (settingId: string) =>
      `/v1/user/security/settings/${settingId}`,

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
  },
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
  INSTANTIATING: 'Instantiating',
  RESOLVED: 'Resolved',
  DEPLOYED: 'Deployed',
  FAILED: 'Failed',
  UNKNOWN: 'Unknown',
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
  ORGANIZATION_VDCS: '/organizations/:id/vdcs',
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
  // Monitoring & Analytics
  MONITORING: '/monitoring',
  MONITORING_COSTS: '/monitoring/cost-reports',
  MONITORING_CAPACITY: '/monitoring/capacity-planning',
  MONITORING_ALERTS: '/monitoring/alerts',
  MONITORING_EXPORTS: '/monitoring/exports',
  MONITORING_DASHBOARDS: '/monitoring/dashboards',
  // Batch Operations & Automation
  AUTOMATION: '/automation',
  AUTOMATION_BATCH_OPERATIONS: '/automation/batch-operations',
  AUTOMATION_DEPLOYMENT_TEMPLATES: '/automation/deployment-templates',
  AUTOMATION_SCHEDULED_OPERATIONS: '/automation/scheduled-operations',
  AUTOMATION_WORKFLOWS: '/automation/workflows',
  AUTOMATION_QUEUES: '/automation/queues',
  PROFILE: '/profile',
} as const;
