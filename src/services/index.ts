// Export API configuration
export { api, AuthService } from './api';

// Export CloudAPI services (VMware Cloud Director compatible)
export {
  CloudApiUserService,
  CloudApiRoleService,
  CloudApiOrganizationService,
  VDCService,
  CatalogService,
  VAppService,
} from './cloudapi';

// Export domain services
export { OrganizationService } from './organizations';
export { VMService } from './vms';
export { DashboardService } from './dashboard';
export { UserProfileService } from './userProfile';
export { MonitoringService } from './monitoring';
