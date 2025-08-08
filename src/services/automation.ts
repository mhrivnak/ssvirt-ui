import { api } from './api';
import type {
  ApiResponse,
  BatchOperation,
  DeploymentTemplate,
  ScheduledOperation,
  AutomationWorkflow,
  OperationQueue,
  BatchOperationQueryParams,
  DeploymentTemplateQueryParams,
  ScheduledOperationQueryParams,
  AutomationWorkflowQueryParams,
  CreateBatchOperationRequest,
  CreateDeploymentTemplateRequest,
  CreateScheduledOperationRequest,
  CreateAutomationWorkflowRequest,
} from '../types';

/**
 * Batch Operations API service
 */
export const BatchOperationService = {
  /**
   * Get list of batch operations
   */
  getBatchOperations: async (params?: BatchOperationQueryParams) => {
    const response = await api.get<
      ApiResponse<{ operations: BatchOperation[]; total: number }>
    >('/api/v1/automation/batch-operations', { params });
    return response.data;
  },

  /**
   * Get batch operation details
   */
  getBatchOperation: async (operationId: string) => {
    const response = await api.get<ApiResponse<BatchOperation>>(
      `/api/v1/automation/batch-operations/${operationId}`
    );
    return response.data;
  },

  /**
   * Create new batch operation
   */
  createBatchOperation: async (operation: CreateBatchOperationRequest) => {
    const response = await api.post<ApiResponse<BatchOperation>>(
      '/api/v1/automation/batch-operations',
      operation
    );
    return response.data;
  },

  /**
   * Cancel batch operation
   */
  cancelBatchOperation: async (operationId: string) => {
    const response = await api.post<ApiResponse<{ cancelled: boolean }>>(
      `/api/v1/automation/batch-operations/${operationId}/cancel`
    );
    return response.data;
  },

  /**
   * Retry failed batch operation
   */
  retryBatchOperation: async (operationId: string) => {
    const response = await api.post<ApiResponse<BatchOperation>>(
      `/api/v1/automation/batch-operations/${operationId}/retry`
    );
    return response.data;
  },

  /**
   * Rollback batch operation
   */
  rollbackBatchOperation: async (operationId: string) => {
    const response = await api.post<ApiResponse<BatchOperation>>(
      `/api/v1/automation/batch-operations/${operationId}/rollback`
    );
    return response.data;
  },

  /**
   * Delete batch operation
   */
  deleteBatchOperation: async (operationId: string) => {
    const response = await api.delete<ApiResponse<{ deleted: boolean }>>(
      `/api/v1/automation/batch-operations/${operationId}`
    );
    return response.data;
  },
};

/**
 * Deployment Templates API service
 */
export const DeploymentTemplateService = {
  /**
   * Get list of deployment templates
   */
  getDeploymentTemplates: async (params?: DeploymentTemplateQueryParams) => {
    const response = await api.get<
      ApiResponse<{ templates: DeploymentTemplate[]; total: number }>
    >('/api/v1/automation/deployment-templates', { params });
    return response.data;
  },

  /**
   * Get deployment template details
   */
  getDeploymentTemplate: async (templateId: string) => {
    const response = await api.get<ApiResponse<DeploymentTemplate>>(
      `/api/v1/automation/deployment-templates/${templateId}`
    );
    return response.data;
  },

  /**
   * Create new deployment template
   */
  createDeploymentTemplate: async (
    template: CreateDeploymentTemplateRequest
  ) => {
    const response = await api.post<ApiResponse<DeploymentTemplate>>(
      '/api/v1/automation/deployment-templates',
      template
    );
    return response.data;
  },

  /**
   * Update deployment template
   */
  updateDeploymentTemplate: async (
    templateId: string,
    updates: Partial<CreateDeploymentTemplateRequest>
  ) => {
    const response = await api.put<ApiResponse<DeploymentTemplate>>(
      `/api/v1/automation/deployment-templates/${templateId}`,
      updates
    );
    return response.data;
  },

  /**
   * Clone deployment template
   */
  cloneDeploymentTemplate: async (templateId: string, name: string) => {
    const response = await api.post<ApiResponse<DeploymentTemplate>>(
      `/api/v1/automation/deployment-templates/${templateId}/clone`,
      { name }
    );
    return response.data;
  },

  /**
   * Deploy from template
   */
  deployFromTemplate: async (
    templateId: string,
    deploymentConfig: Record<string, unknown>
  ) => {
    const response = await api.post<ApiResponse<BatchOperation>>(
      `/api/v1/automation/deployment-templates/${templateId}/deploy`,
      deploymentConfig
    );
    return response.data;
  },

  /**
   * Delete deployment template
   */
  deleteDeploymentTemplate: async (templateId: string) => {
    const response = await api.delete<ApiResponse<{ deleted: boolean }>>(
      `/api/v1/automation/deployment-templates/${templateId}`
    );
    return response.data;
  },
};

/**
 * Scheduled Operations API service
 */
export const ScheduledOperationService = {
  /**
   * Get list of scheduled operations
   */
  getScheduledOperations: async (params?: ScheduledOperationQueryParams) => {
    const response = await api.get<
      ApiResponse<{ operations: ScheduledOperation[]; total: number }>
    >('/api/v1/automation/scheduled-operations', { params });
    return response.data;
  },

  /**
   * Get scheduled operation details
   */
  getScheduledOperation: async (operationId: string) => {
    const response = await api.get<ApiResponse<ScheduledOperation>>(
      `/api/v1/automation/scheduled-operations/${operationId}`
    );
    return response.data;
  },

  /**
   * Create new scheduled operation
   */
  createScheduledOperation: async (
    operation: CreateScheduledOperationRequest
  ) => {
    const response = await api.post<ApiResponse<ScheduledOperation>>(
      '/api/v1/automation/scheduled-operations',
      operation
    );
    return response.data;
  },

  /**
   * Update scheduled operation
   */
  updateScheduledOperation: async (
    operationId: string,
    updates: Partial<CreateScheduledOperationRequest>
  ) => {
    const response = await api.put<ApiResponse<ScheduledOperation>>(
      `/api/v1/automation/scheduled-operations/${operationId}`,
      updates
    );
    return response.data;
  },

  /**
   * Enable/disable scheduled operation
   */
  toggleScheduledOperation: async (operationId: string, enabled: boolean) => {
    const response = await api.patch<ApiResponse<ScheduledOperation>>(
      `/api/v1/automation/scheduled-operations/${operationId}/toggle`,
      { enabled }
    );
    return response.data;
  },

  /**
   * Run scheduled operation now
   */
  runScheduledOperation: async (operationId: string) => {
    const response = await api.post<ApiResponse<BatchOperation>>(
      `/api/v1/automation/scheduled-operations/${operationId}/run`
    );
    return response.data;
  },

  /**
   * Delete scheduled operation
   */
  deleteScheduledOperation: async (operationId: string) => {
    const response = await api.delete<ApiResponse<{ deleted: boolean }>>(
      `/api/v1/automation/scheduled-operations/${operationId}`
    );
    return response.data;
  },
};

/**
 * Automation Workflows API service
 */
export const AutomationWorkflowService = {
  /**
   * Get list of automation workflows
   */
  getAutomationWorkflows: async (params?: AutomationWorkflowQueryParams) => {
    const response = await api.get<
      ApiResponse<{ workflows: AutomationWorkflow[]; total: number }>
    >('/api/v1/automation/workflows', { params });
    return response.data;
  },

  /**
   * Get automation workflow details
   */
  getAutomationWorkflow: async (workflowId: string) => {
    const response = await api.get<ApiResponse<AutomationWorkflow>>(
      `/api/v1/automation/workflows/${workflowId}`
    );
    return response.data;
  },

  /**
   * Create new automation workflow
   */
  createAutomationWorkflow: async (
    workflow: CreateAutomationWorkflowRequest
  ) => {
    const response = await api.post<ApiResponse<AutomationWorkflow>>(
      '/api/v1/automation/workflows',
      workflow
    );
    return response.data;
  },

  /**
   * Update automation workflow
   */
  updateAutomationWorkflow: async (
    workflowId: string,
    updates: Partial<CreateAutomationWorkflowRequest>
  ) => {
    const response = await api.put<ApiResponse<AutomationWorkflow>>(
      `/api/v1/automation/workflows/${workflowId}`,
      updates
    );
    return response.data;
  },

  /**
   * Enable/disable automation workflow
   */
  toggleAutomationWorkflow: async (workflowId: string, enabled: boolean) => {
    const response = await api.patch<ApiResponse<AutomationWorkflow>>(
      `/api/v1/automation/workflows/${workflowId}/toggle`,
      { enabled }
    );
    return response.data;
  },

  /**
   * Execute automation workflow
   */
  executeAutomationWorkflow: async (
    workflowId: string,
    executionConfig?: Record<string, unknown>
  ) => {
    const response = await api.post<ApiResponse<BatchOperation>>(
      `/api/v1/automation/workflows/${workflowId}/execute`,
      executionConfig || {}
    );
    return response.data;
  },

  /**
   * Clone automation workflow
   */
  cloneAutomationWorkflow: async (workflowId: string, name: string) => {
    const response = await api.post<ApiResponse<AutomationWorkflow>>(
      `/api/v1/automation/workflows/${workflowId}/clone`,
      { name }
    );
    return response.data;
  },

  /**
   * Delete automation workflow
   */
  deleteAutomationWorkflow: async (workflowId: string) => {
    const response = await api.delete<ApiResponse<{ deleted: boolean }>>(
      `/api/v1/automation/workflows/${workflowId}`
    );
    return response.data;
  },
};

/**
 * Operation Queues API service
 */
export const OperationQueueService = {
  /**
   * Get list of operation queues
   */
  getOperationQueues: async () => {
    const response = await api.get<
      ApiResponse<{ queues: OperationQueue[]; total: number }>
    >('/api/v1/automation/queues');
    return response.data;
  },

  /**
   * Get operation queue details
   */
  getOperationQueue: async (queueId: string) => {
    const response = await api.get<ApiResponse<OperationQueue>>(
      `/api/v1/automation/queues/${queueId}`
    );
    return response.data;
  },

  /**
   * Pause operation queue
   */
  pauseOperationQueue: async (queueId: string) => {
    const response = await api.post<ApiResponse<OperationQueue>>(
      `/api/v1/automation/queues/${queueId}/pause`
    );
    return response.data;
  },

  /**
   * Resume operation queue
   */
  resumeOperationQueue: async (queueId: string) => {
    const response = await api.post<ApiResponse<OperationQueue>>(
      `/api/v1/automation/queues/${queueId}/resume`
    );
    return response.data;
  },

  /**
   * Clear completed operations from queue
   */
  clearCompletedOperations: async (queueId: string) => {
    const response = await api.post<ApiResponse<{ cleared_count: number }>>(
      `/api/v1/automation/queues/${queueId}/clear-completed`
    );
    return response.data;
  },
};
