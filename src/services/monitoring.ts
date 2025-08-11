import { api } from './api';
import type {
  ApiResponse,
  PaginatedResponse,
  ResourceUsageQueryParams,
  CostReportQueryParams,
  AlertQueryParams,
  OrganizationResourceUsage,
  VDCResourceUsage,
  VMResourceUsage,
  CostReport,
  CapacityPlanningData,
  CapacityRecommendation,
  UsageAlert,
  AlertRule,
  CustomDashboard,
  ExportRequest,
  ExportJob,
} from '../types';

/**
 * Resource Usage API endpoints
 */
export const ResourceUsageService = {
  /**
   * Get global resource usage overview
   */
  getGlobalResourceUsage: async (params?: ResourceUsageQueryParams) => {
    const response = await api.get<
      ApiResponse<{
        organizations: OrganizationResourceUsage[];
        total_usage: {
          cpu_cores_used: number;
          memory_gb_used: number;
          storage_gb_used: number;
          vm_count: number;
        };
      }>
    >('/v1/monitoring/resource-usage', { params });
    return response.data;
  },

  /**
   * Get resource usage for a specific organization
   */
  getOrganizationResourceUsage: async (
    orgId: string,
    params?: ResourceUsageQueryParams
  ) => {
    const response = await api.get<ApiResponse<OrganizationResourceUsage>>(
      `/v1/monitoring/resource-usage/org/${orgId}`,
      { params }
    );
    return response.data;
  },

  /**
   * Get resource usage for a specific VDC
   */
  getVDCResourceUsage: async (
    vdcId: string,
    params?: ResourceUsageQueryParams
  ) => {
    const response = await api.get<ApiResponse<VDCResourceUsage>>(
      `/v1/monitoring/resource-usage/vdc/${vdcId}`,
      { params }
    );
    return response.data;
  },

  /**
   * Get resource usage for a specific VM
   */
  getVMResourceUsage: async (
    vmId: string,
    params?: ResourceUsageQueryParams
  ) => {
    const response = await api.get<ApiResponse<VMResourceUsage>>(
      `/v1/monitoring/resource-usage/vm/${vmId}`,
      { params }
    );
    return response.data;
  },
};

/**
 * Cost Tracking and Reporting API endpoints
 */
export const CostReportService = {
  /**
   * Get all cost reports
   */
  getCostReports: async (params?: CostReportQueryParams) => {
    const response = await api.get<PaginatedResponse<CostReport>>(
      '/v1/monitoring/cost-reports',
      { params }
    );
    return response.data;
  },

  /**
   * Get a specific cost report
   */
  getCostReport: async (reportId: string) => {
    const response = await api.get<ApiResponse<CostReport>>(
      `/v1/monitoring/cost-reports/${reportId}`
    );
    return response.data;
  },

  /**
   * Generate a new cost report
   */
  generateCostReport: async (params: {
    name: string;
    description?: string;
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    start_date: string;
    end_date: string;
    organization_ids?: string[];
    vdc_ids?: string[];
  }) => {
    const response = await api.post<ApiResponse<CostReport>>(
      '/v1/monitoring/cost-reports',
      params
    );
    return response.data;
  },

  /**
   * Delete a cost report
   */
  deleteCostReport: async (reportId: string) => {
    const response = await api.delete<ApiResponse<{ deleted: boolean }>>(
      `/v1/monitoring/cost-reports/${reportId}`
    );
    return response.data;
  },
};

/**
 * Capacity Planning API endpoints
 */
export const CapacityPlanningService = {
  /**
   * Get capacity planning data
   */
  getCapacityPlanningData: async (params?: {
    organization_id?: string;
    vdc_id?: string;
    forecast_days?: number;
  }) => {
    const response = await api.get<ApiResponse<CapacityPlanningData>>(
      '/v1/monitoring/capacity-planning',
      { params }
    );
    return response.data;
  },

  /**
   * Get capacity recommendations
   */
  getCapacityRecommendations: async (params?: {
    organization_id?: string;
    vdc_id?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
  }) => {
    const response = await api.get<
      ApiResponse<{ recommendations: CapacityRecommendation[] }>
    >('/v1/monitoring/capacity-planning/recommendations', { params });
    return response.data;
  },
};

/**
 * Usage Alerts and Notifications API endpoints
 */
export const AlertService = {
  /**
   * Get all usage alerts
   */
  getUsageAlerts: async (params?: AlertQueryParams) => {
    const response = await api.get<PaginatedResponse<UsageAlert>>(
      '/v1/monitoring/alerts',
      { params }
    );
    return response.data;
  },

  /**
   * Get a specific alert
   */
  getUsageAlert: async (alertId: string) => {
    const response = await api.get<ApiResponse<UsageAlert>>(
      `/v1/monitoring/alerts/${alertId}`
    );
    return response.data;
  },

  /**
   * Resolve an alert
   */
  resolveAlert: async (alertId: string, reason?: string) => {
    const response = await api.patch<ApiResponse<UsageAlert>>(
      `/v1/monitoring/alerts/${alertId}/resolve`,
      { reason }
    );
    return response.data;
  },

  /**
   * Suppress an alert
   */
  suppressAlert: async (
    alertId: string,
    duration_minutes?: number,
    reason?: string
  ) => {
    const response = await api.patch<ApiResponse<UsageAlert>>(
      `/v1/monitoring/alerts/${alertId}/suppress`,
      { duration_minutes, reason }
    );
    return response.data;
  },

  /**
   * Get alert rules
   */
  getAlertRules: async (params?: {
    enabled?: boolean;
    resource_type?: string;
    scope?: string;
  }) => {
    const response = await api.get<PaginatedResponse<AlertRule>>(
      '/v1/monitoring/alert-rules',
      { params }
    );
    return response.data;
  },

  /**
   * Create a new alert rule
   */
  createAlertRule: async (
    rule: Omit<AlertRule, 'id' | 'created_at' | 'updated_at' | 'created_by'>
  ) => {
    const response = await api.post<ApiResponse<AlertRule>>(
      '/v1/monitoring/alert-rules',
      rule
    );
    return response.data;
  },

  /**
   * Update an alert rule
   */
  updateAlertRule: async (
    ruleId: string,
    updates: Partial<
      Omit<AlertRule, 'id' | 'created_at' | 'updated_at' | 'created_by'>
    >
  ) => {
    const response = await api.patch<ApiResponse<AlertRule>>(
      `/v1/monitoring/alert-rules/${ruleId}`,
      updates
    );
    return response.data;
  },

  /**
   * Delete an alert rule
   */
  deleteAlertRule: async (ruleId: string) => {
    const response = await api.delete<ApiResponse<{ deleted: boolean }>>(
      `/v1/monitoring/alert-rules/${ruleId}`
    );
    return response.data;
  },
};

/**
 * Custom Dashboard API endpoints
 */
export const DashboardService = {
  /**
   * Get all custom dashboards
   */
  getCustomDashboards: async (params?: { is_shared?: boolean }) => {
    const response = await api.get<PaginatedResponse<CustomDashboard>>(
      '/v1/monitoring/dashboards',
      { params }
    );
    return response.data;
  },

  /**
   * Get a specific dashboard
   */
  getCustomDashboard: async (dashboardId: string) => {
    const response = await api.get<ApiResponse<CustomDashboard>>(
      `/v1/monitoring/dashboards/${dashboardId}`
    );
    return response.data;
  },

  /**
   * Create a new dashboard
   */
  createCustomDashboard: async (
    dashboard: Omit<
      CustomDashboard,
      'id' | 'created_at' | 'updated_at' | 'created_by'
    >
  ) => {
    const response = await api.post<ApiResponse<CustomDashboard>>(
      '/v1/monitoring/dashboards',
      dashboard
    );
    return response.data;
  },

  /**
   * Update a dashboard
   */
  updateCustomDashboard: async (
    dashboardId: string,
    updates: Partial<
      Omit<CustomDashboard, 'id' | 'created_at' | 'updated_at' | 'created_by'>
    >
  ) => {
    const response = await api.patch<ApiResponse<CustomDashboard>>(
      `/v1/monitoring/dashboards/${dashboardId}`,
      updates
    );
    return response.data;
  },

  /**
   * Delete a dashboard
   */
  deleteCustomDashboard: async (dashboardId: string) => {
    const response = await api.delete<ApiResponse<{ deleted: boolean }>>(
      `/v1/monitoring/dashboards/${dashboardId}`
    );
    return response.data;
  },

  /**
   * Clone a dashboard
   */
  cloneCustomDashboard: async (dashboardId: string, name: string) => {
    const response = await api.post<ApiResponse<CustomDashboard>>(
      `/v1/monitoring/dashboards/${dashboardId}/clone`,
      { name }
    );
    return response.data;
  },
};

/**
 * Export functionality API endpoints
 */
export const ExportService = {
  /**
   * Request data export
   */
  requestExport: async (exportRequest: ExportRequest) => {
    try {
      const response = await api.post<ApiResponse<ExportJob>>(
        '/v1/monitoring/export',
        exportRequest
      );
      return response.data;
    } catch (error) {
      console.error('Export request failed:', error);
      throw error;
    }
  },

  /**
   * Get export job status
   */
  getExportJob: async (jobId: string) => {
    const response = await api.get<ApiResponse<ExportJob>>(
      `/v1/monitoring/export/${jobId}`
    );
    return response.data;
  },

  /**
   * Get all export jobs
   */
  getExportJobs: async (params?: { status?: string; limit?: number }) => {
    const response = await api.get<PaginatedResponse<ExportJob>>(
      '/v1/monitoring/export',
      { params }
    );
    return response.data;
  },

  /**
   * Cancel an export job
   */
  cancelExportJob: async (jobId: string) => {
    const response = await api.delete<ApiResponse<{ cancelled: boolean }>>(
      `/v1/monitoring/export/${jobId}`
    );
    return response.data;
  },

  /**
   * Download export file
   */
  downloadExportFile: async (jobId: string) => {
    const response = await api.get(`/v1/monitoring/export/${jobId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

/**
 * Monitoring Service - combines all monitoring-related services
 */
export const MonitoringService = {
  ResourceUsage: ResourceUsageService,
  CostReport: CostReportService,
  CapacityPlanning: CapacityPlanningService,
  Alert: AlertService,
  Dashboard: DashboardService,
  Export: ExportService,
};
