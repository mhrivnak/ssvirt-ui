import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BatchOperationService,
  DeploymentTemplateService,
  ScheduledOperationService,
  AutomationWorkflowService,
  OperationQueueService,
} from '../services/automation';
import { QUERY_KEYS } from '../types';
import type {
  BatchOperationQueryParams,
  DeploymentTemplateQueryParams,
  ScheduledOperationQueryParams,
  AutomationWorkflowQueryParams,
  CreateBatchOperationRequest,
  CreateDeploymentTemplateRequest,
  CreateScheduledOperationRequest,
  CreateAutomationWorkflowRequest,
} from '../types';

// Batch Operations hooks
export const useBatchOperations = (params?: BatchOperationQueryParams) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.batchOperations, params],
    queryFn: ({ signal }) =>
      BatchOperationService.getBatchOperations(params, signal),
  });
};

export const useBatchOperation = (operationId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.batchOperation(operationId),
    queryFn: ({ signal }) =>
      BatchOperationService.getBatchOperation(operationId, signal),
    enabled: !!operationId,
    refetchInterval: (query) => {
      // Poll every 5 seconds if operation is pending or running
      const status = query.state.data?.data?.status;
      return status === 'pending' || status === 'running' ? 5000 : false;
    },
  });
};

export const useCreateBatchOperation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (operation: CreateBatchOperationRequest) =>
      BatchOperationService.createBatchOperation(operation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.batchOperations });
    },
  });
};

export const useCancelBatchOperation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (operationId: string) =>
      BatchOperationService.cancelBatchOperation(operationId),
    onSuccess: (_, operationId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.batchOperations });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.batchOperation(operationId),
      });
    },
  });
};

export const useRetryBatchOperation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (operationId: string) =>
      BatchOperationService.retryBatchOperation(operationId),
    onSuccess: (_, operationId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.batchOperations });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.batchOperation(operationId),
      });
    },
  });
};

export const useRollbackBatchOperation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (operationId: string) =>
      BatchOperationService.rollbackBatchOperation(operationId),
    onSuccess: (_, operationId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.batchOperations });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.batchOperation(operationId),
      });
    },
  });
};

export const useDeleteBatchOperation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (operationId: string) =>
      BatchOperationService.deleteBatchOperation(operationId),
    onSuccess: (_, operationId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.batchOperations });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.batchOperation(operationId),
      });
    },
  });
};

// Deployment Templates hooks
export const useDeploymentTemplates = (
  params?: DeploymentTemplateQueryParams
) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.deploymentTemplates, params],
    queryFn: ({ signal }) =>
      DeploymentTemplateService.getDeploymentTemplates(params, signal),
  });
};

export const useDeploymentTemplate = (templateId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.deploymentTemplate(templateId),
    queryFn: ({ signal }) =>
      DeploymentTemplateService.getDeploymentTemplate(templateId, signal),
    enabled: !!templateId,
  });
};

export const useCreateDeploymentTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (template: CreateDeploymentTemplateRequest) =>
      DeploymentTemplateService.createDeploymentTemplate(template),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.deploymentTemplates,
      });
    },
  });
};

export const useUpdateDeploymentTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
      updates,
    }: {
      templateId: string;
      updates: Partial<CreateDeploymentTemplateRequest>;
    }) =>
      DeploymentTemplateService.updateDeploymentTemplate(templateId, updates),
    onSuccess: (_, { templateId }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.deploymentTemplates,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.deploymentTemplate(templateId),
      });
    },
  });
};

export const useCloneDeploymentTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ templateId, name }: { templateId: string; name: string }) =>
      DeploymentTemplateService.cloneDeploymentTemplate(templateId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.deploymentTemplates,
      });
    },
  });
};

export const useDeployFromTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
      config,
    }: {
      templateId: string;
      config: Record<string, unknown>;
    }) => DeploymentTemplateService.deployFromTemplate(templateId, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.batchOperations });
    },
  });
};

export const useDeleteDeploymentTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) =>
      DeploymentTemplateService.deleteDeploymentTemplate(templateId),
    onSuccess: (_, templateId) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.deploymentTemplates,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.deploymentTemplate(templateId),
      });
    },
  });
};

// Scheduled Operations hooks
export const useScheduledOperations = (
  params?: ScheduledOperationQueryParams
) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.scheduledOperations, params],
    queryFn: ({ signal }) =>
      ScheduledOperationService.getScheduledOperations(params, signal),
  });
};

export const useScheduledOperation = (operationId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.scheduledOperation(operationId),
    queryFn: ({ signal }) =>
      ScheduledOperationService.getScheduledOperation(operationId, signal),
    enabled: !!operationId,
  });
};

export const useCreateScheduledOperation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (operation: CreateScheduledOperationRequest) =>
      ScheduledOperationService.createScheduledOperation(operation),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.scheduledOperations,
      });
    },
  });
};

export const useUpdateScheduledOperation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      operationId,
      updates,
    }: {
      operationId: string;
      updates: Partial<CreateScheduledOperationRequest>;
    }) =>
      ScheduledOperationService.updateScheduledOperation(operationId, updates),
    onSuccess: (_, { operationId }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.scheduledOperations,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.scheduledOperation(operationId),
      });
    },
  });
};

export const useToggleScheduledOperation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      operationId,
      enabled,
    }: {
      operationId: string;
      enabled: boolean;
    }) =>
      ScheduledOperationService.toggleScheduledOperation(operationId, enabled),
    onSuccess: (_, { operationId }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.scheduledOperations,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.scheduledOperation(operationId),
      });
    },
  });
};

export const useRunScheduledOperation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (operationId: string) =>
      ScheduledOperationService.runScheduledOperation(operationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.batchOperations });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.scheduledOperations,
      });
    },
  });
};

export const useDeleteScheduledOperation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (operationId: string) =>
      ScheduledOperationService.deleteScheduledOperation(operationId),
    onSuccess: (_, operationId) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.scheduledOperations,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.scheduledOperation(operationId),
      });
    },
  });
};

// Automation Workflows hooks
export const useAutomationWorkflows = (
  params?: AutomationWorkflowQueryParams
) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.automationWorkflows, params],
    queryFn: ({ signal }) =>
      AutomationWorkflowService.getAutomationWorkflows(params, signal),
  });
};

export const useAutomationWorkflow = (workflowId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.automationWorkflow(workflowId),
    queryFn: ({ signal }) =>
      AutomationWorkflowService.getAutomationWorkflow(workflowId, signal),
    enabled: !!workflowId,
  });
};

export const useCreateAutomationWorkflow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workflow: CreateAutomationWorkflowRequest) =>
      AutomationWorkflowService.createAutomationWorkflow(workflow),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.automationWorkflows,
      });
    },
  });
};

export const useUpdateAutomationWorkflow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workflowId,
      updates,
    }: {
      workflowId: string;
      updates: Partial<CreateAutomationWorkflowRequest>;
    }) =>
      AutomationWorkflowService.updateAutomationWorkflow(workflowId, updates),
    onSuccess: (_, { workflowId }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.automationWorkflows,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.automationWorkflow(workflowId),
      });
    },
  });
};

export const useToggleAutomationWorkflow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workflowId,
      enabled,
    }: {
      workflowId: string;
      enabled: boolean;
    }) =>
      AutomationWorkflowService.toggleAutomationWorkflow(workflowId, enabled),
    onSuccess: (_, { workflowId }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.automationWorkflows,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.automationWorkflow(workflowId),
      });
    },
  });
};

export const useExecuteAutomationWorkflow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workflowId,
      config,
    }: {
      workflowId: string;
      config?: Record<string, unknown>;
    }) =>
      AutomationWorkflowService.executeAutomationWorkflow(workflowId, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.batchOperations });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.automationWorkflows,
      });
    },
  });
};

export const useCloneAutomationWorkflow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workflowId, name }: { workflowId: string; name: string }) =>
      AutomationWorkflowService.cloneAutomationWorkflow(workflowId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.automationWorkflows,
      });
    },
  });
};

export const useDeleteAutomationWorkflow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workflowId: string) =>
      AutomationWorkflowService.deleteAutomationWorkflow(workflowId),
    onSuccess: (_, workflowId) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.automationWorkflows,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.automationWorkflow(workflowId),
      });
    },
  });
};

// Operation Queues hooks
export const useOperationQueues = () => {
  return useQuery({
    queryKey: QUERY_KEYS.operationQueues,
    queryFn: ({ signal }) => OperationQueueService.getOperationQueues(signal),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

export const useOperationQueue = (queueId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.operationQueue(queueId),
    queryFn: ({ signal }) =>
      OperationQueueService.getOperationQueue(queueId, signal),
    enabled: !!queueId,
    refetchInterval: 10000, // Refresh every 10 seconds
  });
};

export const usePauseOperationQueue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (queueId: string) =>
      OperationQueueService.pauseOperationQueue(queueId),
    onSuccess: (_, queueId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.operationQueues });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.operationQueue(queueId),
      });
    },
  });
};

export const useResumeOperationQueue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (queueId: string) =>
      OperationQueueService.resumeOperationQueue(queueId),
    onSuccess: (_, queueId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.operationQueues });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.operationQueue(queueId),
      });
    },
  });
};

export const useClearCompletedOperations = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (queueId: string) =>
      OperationQueueService.clearCompletedOperations(queueId),
    onSuccess: (_, queueId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.operationQueues });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.operationQueue(queueId),
      });
    },
  });
};
