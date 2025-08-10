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
  useCreateVDC,
  useUpdateVDC,
  useDeleteVDC,
} from './useVDC';

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
