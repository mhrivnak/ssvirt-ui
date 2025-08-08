import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MonitoringService } from '../services/monitoring';
import { QUERY_KEYS } from '../types';
import type {
  ResourceUsageQueryParams,
  CostReportQueryParams,
  AlertQueryParams,
  AlertRule,
  CustomDashboard,
  ExportRequest,
} from '../types';

/**
 * Resource Usage hooks
 */
export const useGlobalResourceUsage = (params?: ResourceUsageQueryParams) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.resourceUsage, params],
    queryFn: () =>
      MonitoringService.ResourceUsage.getGlobalResourceUsage(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useOrganizationResourceUsage = (
  orgId: string,
  params?: ResourceUsageQueryParams
) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.resourceUsageByOrg(orgId), params],
    queryFn: () =>
      MonitoringService.ResourceUsage.getOrganizationResourceUsage(
        orgId,
        params
      ),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useVDCResourceUsage = (
  vdcId: string,
  params?: ResourceUsageQueryParams
) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.resourceUsageByVdc(vdcId), params],
    queryFn: () =>
      MonitoringService.ResourceUsage.getVDCResourceUsage(vdcId, params),
    enabled: !!vdcId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useVMResourceUsage = (
  vmId: string,
  params?: ResourceUsageQueryParams
) => {
  return useQuery({
    queryKey: ['monitoring', 'resource-usage', 'vm', vmId, params],
    queryFn: () =>
      MonitoringService.ResourceUsage.getVMResourceUsage(vmId, params),
    enabled: !!vmId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Cost Report hooks
 */
export const useCostReports = (params?: CostReportQueryParams) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.costReports, params],
    queryFn: () => MonitoringService.CostReport.getCostReports(params),
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
};

export const useCostReport = (reportId: string) => {
  return useQuery({
    queryKey: ['monitoring', 'cost-reports', reportId],
    queryFn: () => MonitoringService.CostReport.getCostReport(reportId),
    enabled: !!reportId,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
};

export const useGenerateCostReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: MonitoringService.CostReport.generateCostReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.costReports });
    },
  });
};

export const useDeleteCostReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: MonitoringService.CostReport.deleteCostReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.costReports });
    },
  });
};

/**
 * Capacity Planning hooks
 */
export const useCapacityPlanningData = (params?: {
  organization_id?: string;
  vdc_id?: string;
  forecast_days?: number;
}) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.capacityPlanning, params],
    queryFn: () =>
      MonitoringService.CapacityPlanning.getCapacityPlanningData(params),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

export const useCapacityRecommendations = (params?: {
  organization_id?: string;
  vdc_id?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}) => {
  return useQuery({
    queryKey: ['monitoring', 'capacity-planning', 'recommendations', params],
    queryFn: () =>
      MonitoringService.CapacityPlanning.getCapacityRecommendations(params),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

/**
 * Usage Alert hooks
 */
export const useUsageAlerts = (params?: AlertQueryParams) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.usageAlerts, params],
    queryFn: () => MonitoringService.Alert.getUsageAlerts(params),
    staleTime: 1000 * 60 * 2, // 2 minutes (more frequent updates for alerts)
  });
};

export const useUsageAlert = (alertId: string) => {
  return useQuery({
    queryKey: ['monitoring', 'alerts', alertId],
    queryFn: () => MonitoringService.Alert.getUsageAlert(alertId),
    enabled: !!alertId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useResolveAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ alertId, reason }: { alertId: string; reason?: string }) =>
      MonitoringService.Alert.resolveAlert(alertId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.usageAlerts });
    },
  });
};

export const useSuppressAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      alertId,
      duration_minutes,
      reason,
    }: {
      alertId: string;
      duration_minutes?: number;
      reason?: string;
    }) =>
      MonitoringService.Alert.suppressAlert(alertId, duration_minutes, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.usageAlerts });
    },
  });
};

export const useAlertRules = (params?: {
  enabled?: boolean;
  resource_type?: string;
  scope?: string;
}) => {
  return useQuery({
    queryKey: ['monitoring', 'alert-rules', params],
    queryFn: () => MonitoringService.Alert.getAlertRules(params),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useCreateAlertRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      rule: Omit<AlertRule, 'id' | 'created_at' | 'updated_at' | 'created_by'>
    ) => MonitoringService.Alert.createAlertRule(rule),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['monitoring', 'alert-rules'],
      });
    },
  });
};

export const useUpdateAlertRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ruleId,
      updates,
    }: {
      ruleId: string;
      updates: Partial<
        Omit<AlertRule, 'id' | 'created_at' | 'updated_at' | 'created_by'>
      >;
    }) => MonitoringService.Alert.updateAlertRule(ruleId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['monitoring', 'alert-rules'],
      });
    },
  });
};

export const useDeleteAlertRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: MonitoringService.Alert.deleteAlertRule,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['monitoring', 'alert-rules'],
      });
    },
  });
};

/**
 * Custom Dashboard hooks
 */
export const useCustomDashboards = (params?: { is_shared?: boolean }) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.customDashboards, params],
    queryFn: () => MonitoringService.Dashboard.getCustomDashboards(params),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useCustomDashboard = (dashboardId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.customDashboard(dashboardId),
    queryFn: () => MonitoringService.Dashboard.getCustomDashboard(dashboardId),
    enabled: !!dashboardId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useCreateCustomDashboard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      dashboard: Omit<
        CustomDashboard,
        'id' | 'created_at' | 'updated_at' | 'created_by'
      >
    ) => MonitoringService.Dashboard.createCustomDashboard(dashboard),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customDashboards });
    },
  });
};

export const useUpdateCustomDashboard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      dashboardId,
      updates,
    }: {
      dashboardId: string;
      updates: Partial<
        Omit<CustomDashboard, 'id' | 'created_at' | 'updated_at' | 'created_by'>
      >;
    }) =>
      MonitoringService.Dashboard.updateCustomDashboard(dashboardId, updates),
    onSuccess: (_, { dashboardId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customDashboards });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.customDashboard(dashboardId),
      });
    },
  });
};

export const useDeleteCustomDashboard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: MonitoringService.Dashboard.deleteCustomDashboard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customDashboards });
    },
  });
};

export const useCloneCustomDashboard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      dashboardId,
      name,
    }: {
      dashboardId: string;
      name: string;
    }) => MonitoringService.Dashboard.cloneCustomDashboard(dashboardId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customDashboards });
    },
  });
};

/**
 * Export hooks
 */
export const useRequestExport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (exportRequest: ExportRequest) =>
      MonitoringService.Export.requestExport(exportRequest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitoring', 'export'] });
    },
  });
};

export const useExportJob = (jobId: string) => {
  return useQuery({
    queryKey: ['monitoring', 'export', jobId],
    queryFn: () => MonitoringService.Export.getExportJob(jobId),
    enabled: !!jobId,
    refetchInterval: (query) => {
      // Poll every 5 seconds if job is pending or processing
      const status = query.state.data?.data?.status;
      return status === 'pending' || status === 'processing' ? 5000 : false;
    },
  });
};

export const useExportJobs = (params?: { status?: string; limit?: number }) => {
  return useQuery({
    queryKey: ['monitoring', 'export', params],
    queryFn: () => MonitoringService.Export.getExportJobs(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCancelExportJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: MonitoringService.Export.cancelExportJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitoring', 'export'] });
    },
  });
};

export const useDownloadExportFile = () => {
  return useMutation({
    mutationFn: MonitoringService.Export.downloadExportFile,
  });
};
