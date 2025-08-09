// Export API configuration
export { api, AuthService } from './api';

// Export CloudAPI services (VMware Cloud Director compatible)
export {
  CloudApiUserService,
  CloudApiRoleService,
  CloudApiOrganizationService,
} from './cloudapi';

// Export domain services
export { OrganizationService } from './organizations';
export { VDCService } from './vdcs';
export { VMService } from './vms';
export { CatalogService } from './catalogs';
export { DashboardService } from './dashboard';
export { UserProfileService } from './userProfile';
export { MonitoringService } from './monitoring';
