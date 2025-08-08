import React, { useState } from 'react';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  SearchInput,
  Select,
  SelectOption,
  SelectList,
  MenuToggle,
  Button,
  Pagination,
  Stack,
  StackItem,
  Badge,
  Split,
  SplitItem,
  Gallery,
  Alert,
  AlertVariant,
  EmptyState,
  EmptyStateBody,
  EmptyStateActions,
  Modal,
  ModalVariant,
  Form,
  FormGroup,
  TextInput,
  TextArea,
  Switch,
  Breadcrumb,
  BreadcrumbItem,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
} from '@patternfly/react-core';
import { ActionsColumn } from '@patternfly/react-table';
import {
  PlayIcon,
  CopyIcon,
  EditIcon,
  TrashIcon,
  PauseIcon,
  CodeBranchIcon,
  ProjectDiagramIcon,
  TimesIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@patternfly/react-icons';
import { Link } from 'react-router-dom';
import {
  useAutomationWorkflows,
  useCreateAutomationWorkflow,
  useUpdateAutomationWorkflow,
  useToggleAutomationWorkflow,
  useExecuteAutomationWorkflow,
  useCloneAutomationWorkflow,
  useDeleteAutomationWorkflow,
} from '../../hooks/useAutomation';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ROUTES } from '../../utils/constants';
import type { MenuToggleElement } from '@patternfly/react-core';
import type {
  AutomationWorkflow,
  CreateAutomationWorkflowRequest,
} from '../../types';

const AutomationWorkflows: React.FC = () => {
  // Search and filter state
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [triggerTypeFilter, setTriggerTypeFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // UI state
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [isTriggerTypeFilterOpen, setIsTriggerTypeFilterOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWorkflow, setEditingWorkflow] =
    useState<AutomationWorkflow | null>(null);

  // Create/edit workflow form state
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [triggerType, setTriggerType] = useState<
    'manual' | 'scheduled' | 'event'
  >('manual');
  const [workflowEnabled, setWorkflowEnabled] = useState(true);

  // Build query parameters
  const queryParams = {
    search: searchValue || undefined,
    status: statusFilter || undefined,
    trigger_type: triggerTypeFilter || undefined,
    page: currentPage,
    per_page: perPage,
  };

  const {
    data: workflowsResponse,
    isLoading,
    error,
  } = useAutomationWorkflows(queryParams);
  const createWorkflowMutation = useCreateAutomationWorkflow();
  const updateWorkflowMutation = useUpdateAutomationWorkflow();
  const toggleWorkflowMutation = useToggleAutomationWorkflow();
  const executeWorkflowMutation = useExecuteAutomationWorkflow();
  const cloneWorkflowMutation = useCloneAutomationWorkflow();
  const deleteWorkflowMutation = useDeleteAutomationWorkflow();

  const workflows = workflowsResponse?.data?.workflows || [];
  const totalCount = workflowsResponse?.data?.total || 0;

  const handleSearch = (value: string) => {
    setSearchValue(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (selection: string) => {
    setStatusFilter(selection === statusFilter ? '' : selection);
    setCurrentPage(1);
    setIsStatusFilterOpen(false);
  };

  const handleTriggerTypeFilter = (selection: string) => {
    setTriggerTypeFilter(selection === triggerTypeFilter ? '' : selection);
    setCurrentPage(1);
    setIsTriggerTypeFilterOpen(false);
  };

  const clearAllFilters = () => {
    setSearchValue('');
    setStatusFilter('');
    setTriggerTypeFilter('');
    setCurrentPage(1);
  };

  const resetForm = () => {
    setWorkflowName('');
    setWorkflowDescription('');
    setTriggerType('manual');
    setWorkflowEnabled(true);
  };

  const handleCreateWorkflow = async () => {
    if (!workflowName) return;

    try {
      const workflowData: CreateAutomationWorkflowRequest = {
        name: workflowName,
        description: workflowDescription,
        trigger_type: triggerType,
        trigger_config: {
          // Basic trigger config - in real implementation this would be configurable
          schedule_expression:
            triggerType === 'scheduled' ? '0 0 * * *' : undefined,
          event_filters: triggerType === 'event' ? {} : undefined,
        },
        steps: [
          // Default first step - in real implementation this would be built in a visual editor
          {
            id: 'step-1',
            name: 'Initial Step',
            type: 'action',
            action_type: 'power',
            config: {
              action: 'status',
            },
            depends_on: [],
            retry_config: {
              max_retries: 3,
              retry_delay_seconds: 30,
            },
          },
        ],
        is_enabled: workflowEnabled,
      };

      if (editingWorkflow) {
        await updateWorkflowMutation.mutateAsync({
          workflowId: editingWorkflow.id,
          updates: workflowData,
        });
      } else {
        await createWorkflowMutation.mutateAsync(workflowData);
      }

      resetForm();
      setShowCreateModal(false);
      setEditingWorkflow(null);
    } catch (error) {
      console.error('Failed to save automation workflow:', error);
    }
  };

  const handleEditWorkflow = (workflow: AutomationWorkflow) => {
    setEditingWorkflow(workflow);
    setWorkflowName(workflow.name);
    setWorkflowDescription(workflow.description || '');
    setTriggerType(workflow.trigger_type);
    setWorkflowEnabled(workflow.is_enabled);
    setShowCreateModal(true);
  };

  const handleToggleWorkflow = async (workflowId: string, enabled: boolean) => {
    try {
      await toggleWorkflowMutation.mutateAsync({ workflowId, enabled });
    } catch (error) {
      console.error('Failed to toggle workflow:', error);
    }
  };

  const handleExecuteWorkflow = async (workflowId: string) => {
    if (window.confirm('Are you sure you want to execute this workflow now?')) {
      try {
        await executeWorkflowMutation.mutateAsync({ workflowId });
      } catch (error) {
        console.error('Failed to execute workflow:', error);
      }
    }
  };

  const handleCloneWorkflow = async (workflowId: string, name: string) => {
    const cloneName = prompt(
      'Enter name for cloned workflow:',
      `${name} (Copy)`
    );
    if (!cloneName) return;

    try {
      await cloneWorkflowMutation.mutateAsync({ workflowId, name: cloneName });
    } catch (error) {
      console.error('Failed to clone workflow:', error);
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (
      window.confirm(
        'Are you sure you want to delete this automation workflow?'
      )
    ) {
      try {
        await deleteWorkflowMutation.mutateAsync(workflowId);
      } catch (error) {
        console.error('Failed to delete workflow:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'disabled':
        return 'grey';
      case 'error':
        return 'red';
      default:
        return 'grey';
    }
  };

  const getTriggerTypeLabel = (type: string) => {
    switch (type) {
      case 'manual':
        return 'Manual';
      case 'scheduled':
        return 'Scheduled';
      case 'event':
        return 'Event-driven';
      default:
        return type;
    }
  };

  const getTriggerTypeIcon = (type: string) => {
    switch (type) {
      case 'manual':
        return <PlayIcon />;
      case 'scheduled':
        return <TimesIcon />;
      case 'event':
        return <CodeBranchIcon />;
      default:
        return <ProjectDiagramIcon />;
    }
  };

  const getLastExecutionBadge = (workflow: AutomationWorkflow) => {
    if (!workflow.last_execution_at) return null;

    const success = workflow.last_execution_status === 'completed';
    return (
      <Badge
        color={success ? 'green' : 'red'}
        icon={success ? <CheckCircleIcon /> : <ExclamationCircleIcon />}
      >
        {success ? 'Success' : 'Failed'}
      </Badge>
    );
  };

  if (error) {
    return (
      <PageSection>
        <Alert
          variant={AlertVariant.danger}
          title="Error loading automation workflows"
        >
          Failed to load automation workflows. Please try again.
        </Alert>
      </PageSection>
    );
  }

  return (
    <PageSection>
      <Stack hasGutter>
        {/* Breadcrumb */}
        <StackItem>
          <Breadcrumb>
            <BreadcrumbItem component={Link} to={ROUTES.DASHBOARD}>
              Dashboard
            </BreadcrumbItem>
            <BreadcrumbItem component={Link} to={ROUTES.AUTOMATION}>
              Automation
            </BreadcrumbItem>
            <BreadcrumbItem isActive>Automation Workflows</BreadcrumbItem>
          </Breadcrumb>
        </StackItem>

        {/* Header */}
        <StackItem>
          <Split hasGutter>
            <SplitItem isFilled>
              <Title headingLevel="h1" size="2xl">
                Automation Workflows
              </Title>
            </SplitItem>
            <SplitItem>
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
              >
                Create Workflow
              </Button>
            </SplitItem>
          </Split>
        </StackItem>

        {/* Filters and Search */}
        <StackItem>
          <Card>
            <CardBody>
              <Toolbar>
                <ToolbarContent>
                  <ToolbarItem>
                    <SearchInput
                      placeholder="Search workflows..."
                      value={searchValue}
                      onChange={(_, value) => handleSearch(value)}
                      onClear={() => handleSearch('')}
                    />
                  </ToolbarItem>
                  <ToolbarItem>
                    <Select
                      isOpen={isStatusFilterOpen}
                      selected={statusFilter}
                      onSelect={(_, selection) =>
                        handleStatusFilter(selection as string)
                      }
                      onOpenChange={setIsStatusFilterOpen}
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() =>
                            setIsStatusFilterOpen(!isStatusFilterOpen)
                          }
                        >
                          {statusFilter === 'active'
                            ? 'Active'
                            : statusFilter === 'disabled'
                              ? 'Disabled'
                              : 'All Statuses'}
                        </MenuToggle>
                      )}
                    >
                      <SelectList>
                        <SelectOption value="active">Active</SelectOption>
                        <SelectOption value="disabled">Disabled</SelectOption>
                        <SelectOption value="error">Error</SelectOption>
                      </SelectList>
                    </Select>
                  </ToolbarItem>
                  <ToolbarItem>
                    <Select
                      isOpen={isTriggerTypeFilterOpen}
                      selected={triggerTypeFilter}
                      onSelect={(_, selection) =>
                        handleTriggerTypeFilter(selection as string)
                      }
                      onOpenChange={setIsTriggerTypeFilterOpen}
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() =>
                            setIsTriggerTypeFilterOpen(!isTriggerTypeFilterOpen)
                          }
                        >
                          {triggerTypeFilter
                            ? getTriggerTypeLabel(triggerTypeFilter)
                            : 'All Trigger Types'}
                        </MenuToggle>
                      )}
                    >
                      <SelectList>
                        <SelectOption value="manual">Manual</SelectOption>
                        <SelectOption value="scheduled">Scheduled</SelectOption>
                        <SelectOption value="event">Event-driven</SelectOption>
                      </SelectList>
                    </Select>
                  </ToolbarItem>
                  {(searchValue || statusFilter || triggerTypeFilter) && (
                    <ToolbarItem>
                      <Button variant="link" onClick={clearAllFilters}>
                        Clear all filters
                      </Button>
                    </ToolbarItem>
                  )}
                </ToolbarContent>
              </Toolbar>
            </CardBody>
          </Card>
        </StackItem>

        {/* Workflows Gallery */}
        <StackItem isFilled>
          {isLoading ? (
            <LoadingSpinner />
          ) : workflows.length === 0 ? (
            <EmptyState variant="lg">
              <Title headingLevel="h4" size="lg">
                No automation workflows found
              </Title>
              <EmptyStateBody>
                {searchValue || statusFilter || triggerTypeFilter
                  ? 'No workflows match your current filters.'
                  : 'No automation workflows have been created yet. Create your first workflow to orchestrate complex automation tasks.'}
              </EmptyStateBody>
              {searchValue || statusFilter || triggerTypeFilter ? (
                <EmptyStateActions>
                  <Button variant="secondary" onClick={clearAllFilters}>
                    Clear all filters
                  </Button>
                </EmptyStateActions>
              ) : (
                <EmptyStateActions>
                  <Button
                    variant="primary"
                    onClick={() => setShowCreateModal(true)}
                  >
                    Create Workflow
                  </Button>
                </EmptyStateActions>
              )}
            </EmptyState>
          ) : (
            <Gallery hasGutter>
              {workflows.map((workflow: AutomationWorkflow) => (
                <Card key={workflow.id} isClickable>
                  <CardBody>
                    <Stack hasGutter>
                      <StackItem>
                        <Split hasGutter>
                          <SplitItem>
                            {getTriggerTypeIcon(workflow.trigger_type)}
                          </SplitItem>
                          <SplitItem isFilled>
                            <Stack>
                              <StackItem>
                                <strong>{workflow.name}</strong>
                                {workflow.is_default && (
                                  <Badge color="blue" className="pf-v6-u-ml-sm">
                                    Default
                                  </Badge>
                                )}
                              </StackItem>
                              <StackItem>
                                <Badge color={getStatusColor(workflow.status)}>
                                  {workflow.is_enabled ? 'ENABLED' : 'DISABLED'}
                                </Badge>
                                <Badge className="pf-v6-u-ml-sm">
                                  {getTriggerTypeLabel(workflow.trigger_type)}
                                </Badge>
                                <Badge className="pf-v6-u-ml-sm">
                                  {workflow.steps.length} steps
                                </Badge>
                              </StackItem>
                            </Stack>
                          </SplitItem>
                          <SplitItem>
                            <ActionsColumn
                              items={[
                                {
                                  title: workflow.is_enabled
                                    ? 'Disable'
                                    : 'Enable',
                                  icon: workflow.is_enabled ? (
                                    <PauseIcon />
                                  ) : (
                                    <PlayIcon />
                                  ),
                                  onClick: () =>
                                    handleToggleWorkflow(
                                      workflow.id,
                                      !workflow.is_enabled
                                    ),
                                },
                                {
                                  title: 'Execute',
                                  icon: <PlayIcon />,
                                  onClick: () =>
                                    handleExecuteWorkflow(workflow.id),
                                  isDisabled: !workflow.is_enabled,
                                },
                                {
                                  title: 'Edit',
                                  icon: <EditIcon />,
                                  onClick: () => handleEditWorkflow(workflow),
                                },
                                {
                                  title: 'Clone',
                                  icon: <CopyIcon />,
                                  onClick: () =>
                                    handleCloneWorkflow(
                                      workflow.id,
                                      workflow.name
                                    ),
                                },
                                {
                                  title: 'Delete',
                                  icon: <TrashIcon />,
                                  onClick: () =>
                                    handleDeleteWorkflow(workflow.id),
                                },
                              ]}
                            />
                          </SplitItem>
                        </Split>
                      </StackItem>

                      {workflow.description && (
                        <StackItem>
                          <small className="pf-v6-u-color-200">
                            {workflow.description}
                          </small>
                        </StackItem>
                      )}

                      <StackItem>
                        <DescriptionList isCompact>
                          <DescriptionListGroup>
                            <DescriptionListTerm>
                              Executions
                            </DescriptionListTerm>
                            <DescriptionListDescription>
                              {workflow.execution_count} times
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>
                              Success Rate
                            </DescriptionListTerm>
                            <DescriptionListDescription>
                              {workflow.execution_count > 0
                                ? Math.round(
                                    (workflow.success_count /
                                      workflow.execution_count) *
                                      100
                                  )
                                : 0}
                              %
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>
                              Last Execution
                            </DescriptionListTerm>
                            <DescriptionListDescription>
                              {workflow.last_execution_at ? (
                                <Stack>
                                  <StackItem>
                                    {new Date(
                                      workflow.last_execution_at
                                    ).toLocaleDateString()}
                                  </StackItem>
                                  <StackItem>
                                    {getLastExecutionBadge(workflow)}
                                  </StackItem>
                                </Stack>
                              ) : (
                                'Never'
                              )}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>
                              Created by
                            </DescriptionListTerm>
                            <DescriptionListDescription>
                              {workflow.created_by}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                        </DescriptionList>
                      </StackItem>
                    </Stack>
                  </CardBody>
                </Card>
              ))}
            </Gallery>
          )}
        </StackItem>

        {/* Pagination */}
        {totalCount > perPage && (
          <StackItem>
            <Pagination
              itemCount={totalCount}
              perPage={perPage}
              page={currentPage}
              onSetPage={(_, page) => setCurrentPage(page)}
              onPerPageSelect={(_, newPerPage) => {
                setPerPage(newPerPage);
                setCurrentPage(1);
              }}
              variant="bottom"
            />
          </StackItem>
        )}
      </Stack>

      {/* Create/Edit Workflow Modal */}
      <Modal
        variant={ModalVariant.medium}
        title={
          editingWorkflow
            ? 'Edit Automation Workflow'
            : 'Create Automation Workflow'
        }
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingWorkflow(null);
          resetForm();
        }}
      >
        <Form>
          <FormGroup label="Workflow Name" isRequired fieldId="workflow-name">
            <TextInput
              isRequired
              id="workflow-name"
              value={workflowName}
              onChange={(_event, value) => setWorkflowName(value)}
              placeholder="Enter workflow name"
            />
          </FormGroup>

          <FormGroup label="Description" fieldId="workflow-description">
            <TextArea
              id="workflow-description"
              value={workflowDescription}
              onChange={(_event, value) => setWorkflowDescription(value)}
              placeholder="Enter workflow description (optional)"
              rows={3}
            />
          </FormGroup>

          <FormGroup label="Trigger Type" isRequired fieldId="trigger-type">
            <Select
              isOpen={false}
              selected={triggerType}
              onSelect={(_, selection) =>
                setTriggerType(selection as 'manual' | 'scheduled' | 'event')
              }
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle ref={toggleRef}>
                  {getTriggerTypeLabel(triggerType)}
                </MenuToggle>
              )}
            >
              <SelectList>
                <SelectOption value="manual">Manual</SelectOption>
                <SelectOption value="scheduled">Scheduled</SelectOption>
                <SelectOption value="event">Event-driven</SelectOption>
              </SelectList>
            </Select>
          </FormGroup>

          <FormGroup fieldId="workflow-enabled">
            <Switch
              id="workflow-enabled"
              label="Enable this workflow"
              isChecked={workflowEnabled}
              onChange={(_event, checked) => setWorkflowEnabled(checked)}
            />
          </FormGroup>
        </Form>

        <div className="pf-v6-u-mt-lg">
          <Button
            variant="primary"
            onClick={handleCreateWorkflow}
            isLoading={
              createWorkflowMutation.isPending ||
              updateWorkflowMutation.isPending
            }
            isDisabled={!workflowName}
          >
            {editingWorkflow ? 'Update Workflow' : 'Create Workflow'}
          </Button>
          <Button
            variant="link"
            onClick={() => {
              setShowCreateModal(false);
              setEditingWorkflow(null);
              resetForm();
            }}
            className="pf-v6-u-ml-sm"
          >
            Cancel
          </Button>
        </div>
      </Modal>
    </PageSection>
  );
};

export default AutomationWorkflows;
