// Export existing auth hooks
export { useAuth } from './useAuth';
export {
  useLoginMutation,
  useLogoutMutation,
  useSessionQuery,
  useUserProfileQuery,
  useUpdateUserProfileMutation,
} from './useAuthQueries';

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
  useVDCsByOrganization,
  useVDC,
  useCreateVDC,
  useUpdateVDC,
  useDeleteVDC,
  useToggleVDCStatus,
} from './useVDCs';

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
  useCatalogItems,
  useAllCatalogItems,
} from './useCatalogs';

export { useDashboardStats, useRecentActivity } from './useDashboard';

export { usePowerOperationTracking } from './usePowerOperationTracking';
