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
  useRebootVM,
  useSuspendVM,
  useResetVM,
  useBulkPowerOnVMs,
  useBulkPowerOffVMs,
  useBulkRebootVMs,
  useBulkSuspendVMs,
  useBulkResetVMs,
} from './useVMs';

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
  useVApps,
  usePowerOnVM as useCloudAPIPowerOnVM,
  usePowerOffVM as useCloudAPIPowerOffVM,
  useRebootVM as useCloudAPIRebootVM,
  useSuspendVM as useCloudAPISuspendVM,
  useResetVM as useCloudAPIResetVM,
  useDeleteVApp,
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
