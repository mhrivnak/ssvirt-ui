// Note: Old auth hooks have been removed in favor of RoleContext
// The role-based system is now managed through the RoleContext provider

// Export navigation hooks
export { useNavigation } from './useNavigation';

// Export domain-specific hooks
export {
  useOrganizations,
  useOrganization,
  useCreateOrganization,
  useUpdateOrganization,
  useDeleteOrganization,
  useToggleOrganizationStatus,
  useOrganizationUsers,
  useInviteUserToOrganization,
  useUpdateOrganizationUserRole,
  useRemoveUserFromOrganization,
} from './useOrganizations';

export {
  useVDCs,
  useVDC,
  useOrganizationVDCs,
  useCreateVDC,
  useUpdateVDC,
  useDeleteVDC,
} from './useVDC';

// Export permission hooks
export {
  useUserPermissions,
  useIsSystemAdmin,
  useUserOrganizations,
  useVDCPermissions,
} from './usePermissions';

export {
  useVMs,
  useVMsByVDC,
  useVM,
  useCreateVM,
  useUpdateVM,
  useDeleteVM,
  usePowerOnVM,
  usePowerOffVM,
} from './useVMs';

export {
  useVApps,
  useVApp,
  useVAppsByVDC,
  useVAppsByVDCId,
  useDeleteVApp,
} from './useVApps';

// Export CloudAPI VM hooks
export {
  useVMVDCs,
  useCatalogItems as useCloudAPICatalogItems,
  useAllCatalogItems,
  useInstantiateTemplate,
  useVAppStatus,
  useVMDetails,
  useVMHardware,
  useCloudAPIVMs,
  useVApps as useCloudAPIVApps,
  usePowerOnVM as useCloudAPIPowerOnVM,
  usePowerOffVM as useCloudAPIPowerOffVM,
  useDeleteVApp as useCloudAPIDeleteVApp,
  useDeleteVM as useCloudAPIDeleteVM,
} from './useCloudAPIVMs';

export {
  useCatalogs,
  useCatalog,
  useCreateCatalog,
  useUpdateCatalog,
  useDeleteCatalog,
  useCatalogItems,
  useCatalogItem,
} from './useCatalogs';

export { useDashboardStats, useRecentActivity } from './useDashboard';

export { usePowerOperationTracking } from './usePowerOperationTracking';

export {
  useUserPreferences,
  useUpdateUserPreferences,
  useChangePassword,
  useSecuritySettings,
  useUpdateSecuritySetting,
} from './useUserProfile';

// Export user management hooks
export {
  useUsers,
  useUser,
  useCurrentUser,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useToggleUserStatus,
  useUsersByOrganization,
  useUsersByRole,
  useUpdateUserRoles,
  useUpdateUserOrganization,
  useBulkUpdateUserStatus,
  useBulkDeleteUsers,
} from './useUsers';

// Export monitoring hooks
export {
  useGlobalResourceUsage,
  useOrganizationResourceUsage,
  useVDCResourceUsage,
  useVMResourceUsage,
  useCostReports,
  useCostReport,
  useGenerateCostReport,
  useDeleteCostReport,
  useCapacityPlanningData,
  useCapacityRecommendations,
  useUsageAlerts,
  useUsageAlert,
  useResolveAlert,
  useSuppressAlert,
  useAlertRules,
  useCreateAlertRule,
  useUpdateAlertRule,
  useDeleteAlertRule,
  useCustomDashboards,
  useCustomDashboard,
  useCreateCustomDashboard,
  useUpdateCustomDashboard,
  useDeleteCustomDashboard,
  useCloneCustomDashboard,
  useRequestExport,
  useExportJob,
  useExportJobs,
  useCancelExportJob,
  useDownloadExportFile,
} from './useMonitoring';

// Export role management hooks
export {
  useRoles,
  useAllRoles,
  useRole,
  useRoleByName,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
} from './useRoles';
