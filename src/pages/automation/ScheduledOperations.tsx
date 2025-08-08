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
} from '@patternfly/react-core';
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  ActionsColumn,
} from '@patternfly/react-table';
import {
  PlayIcon,
  PauseIcon,
  EditIcon,
  TrashIcon,
  ClockIcon,
} from '@patternfly/react-icons';
import { Link } from 'react-router-dom';
import {
  useScheduledOperations,
  useCreateScheduledOperation,
  useUpdateScheduledOperation,
  useToggleScheduledOperation,
  useRunScheduledOperation,
  useDeleteScheduledOperation,
} from '../../hooks/useAutomation';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ROUTES } from '../../utils/constants';
import type { MenuToggleElement } from '@patternfly/react-core';
import type {
  ScheduledOperation,
  CreateScheduledOperationRequest,
} from '../../types';

const ScheduledOperations: React.FC = () => {
  // Search and filter state
  const [searchValue, setSearchValue] = useState('');
  const [operationTypeFilter, setOperationTypeFilter] = useState<string>('');
  const [isEnabledFilter, setIsEnabledFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // UI state
  const [isOperationTypeFilterOpen, setIsOperationTypeFilterOpen] =
    useState(false);
  const [isEnabledFilterOpen, setIsEnabledFilterOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOperation, setEditingOperation] =
    useState<ScheduledOperation | null>(null);

  // Create/edit operation form state
  const [operationName, setOperationName] = useState('');
  const [operationDescription, setOperationDescription] = useState('');
  const [operationType, setOperationType] = useState<
    'power' | 'backup' | 'maintenance' | 'cleanup' | 'deployment'
  >('power');
  const [scheduleExpression, setScheduleExpression] = useState('0 2 * * *'); // Default: daily at 2 AM
  const [targetType, setTargetType] = useState<
    'vms' | 'vdcs' | 'organizations'
  >('vms');
  const [operationEnabled, setOperationEnabled] = useState(true);

  // Build query parameters
  const queryParams = {
    search: searchValue || undefined,
    operation_type: operationTypeFilter as 'power' | 'backup' | 'maintenance' | 'cleanup' | 'deployment' | undefined,
    is_enabled: isEnabledFilter ? isEnabledFilter === 'true' : undefined,
    page: currentPage,
    per_page: perPage,
  };

  const {
    data: operationsResponse,
    isLoading,
    error,
  } = useScheduledOperations(queryParams);
  const createOperationMutation = useCreateScheduledOperation();
  const updateOperationMutation = useUpdateScheduledOperation();
  const toggleOperationMutation = useToggleScheduledOperation();
  const runOperationMutation = useRunScheduledOperation();
  const deleteOperationMutation = useDeleteScheduledOperation();

  const operations = operationsResponse?.data?.operations || [];
  const totalCount = operationsResponse?.data?.total || 0;

  const handleSearch = (value: string) => {
    setSearchValue(value);
    setCurrentPage(1);
  };

  const handleOperationTypeFilter = (selection: string) => {
    setOperationTypeFilter(selection === operationTypeFilter ? '' : selection);
    setCurrentPage(1);
    setIsOperationTypeFilterOpen(false);
  };

  const handleEnabledFilter = (selection: string) => {
    setIsEnabledFilter(selection === isEnabledFilter ? '' : selection);
    setCurrentPage(1);
    setIsEnabledFilterOpen(false);
  };

  const clearAllFilters = () => {
    setSearchValue('');
    setOperationTypeFilter('');
    setIsEnabledFilter('');
    setCurrentPage(1);
  };

  const resetForm = () => {
    setOperationName('');
    setOperationDescription('');
    setOperationType('power');
    setScheduleExpression('0 2 * * *');
    setTargetType('vms');
    setOperationEnabled(true);
  };

  const handleCreateOperation = async () => {
    if (!operationName || !scheduleExpression) return;

    try {
      const operationData: CreateScheduledOperationRequest = {
        name: operationName,
        description: operationDescription,
        operation_type: operationType,
        schedule_expression: scheduleExpression,
        target_type: targetType,
        target_filters: [], // In real implementation, this would be configured
        operation_config: {
          // Basic operation config
          action: operationType === 'power' ? 'powerOff' : 'default',
        },
        is_enabled: operationEnabled,
      };

      if (editingOperation) {
        await updateOperationMutation.mutateAsync({
          operationId: editingOperation.id,
          updates: operationData,
        });
      } else {
        await createOperationMutation.mutateAsync(operationData);
      }

      resetForm();
      setShowCreateModal(false);
      setEditingOperation(null);
    } catch (error) {
      console.error('Failed to save scheduled operation:', error);
    }
  };

  const handleEditOperation = (operation: ScheduledOperation) => {
    setEditingOperation(operation);
    setOperationName(operation.name);
    setOperationDescription(operation.description || '');
    setOperationType(operation.operation_type);
    setScheduleExpression(operation.schedule_expression);
    setTargetType(operation.target_type);
    setOperationEnabled(operation.is_enabled);
    setShowCreateModal(true);
  };

  const handleToggleOperation = async (
    operationId: string,
    enabled: boolean
  ) => {
    try {
      await toggleOperationMutation.mutateAsync({ operationId, enabled });
    } catch (error) {
      console.error('Failed to toggle operation:', error);
    }
  };

  const handleRunOperation = async (operationId: string) => {
    if (
      window.confirm(
        'Are you sure you want to run this scheduled operation now?'
      )
    ) {
      try {
        await runOperationMutation.mutateAsync(operationId);
      } catch (error) {
        console.error('Failed to run operation:', error);
      }
    }
  };

  const handleDeleteOperation = async (operationId: string) => {
    if (
      window.confirm(
        'Are you sure you want to delete this scheduled operation?'
      )
    ) {
      try {
        await deleteOperationMutation.mutateAsync(operationId);
      } catch (error) {
        console.error('Failed to delete operation:', error);
      }
    }
  };

  const getOperationTypeLabel = (type: string) => {
    switch (type) {
      case 'power':
        return 'Power Management';
      case 'backup':
        return 'Backup';
      case 'maintenance':
        return 'Maintenance';
      case 'cleanup':
        return 'Cleanup';
      case 'deployment':
        return 'Deployment';
      default:
        return type;
    }
  };

  const getTargetTypeLabel = (type: string) => {
    switch (type) {
      case 'vms':
        return 'Virtual Machines';
      case 'vdcs':
        return 'Virtual Data Centers';
      case 'organizations':
        return 'Organizations';
      default:
        return type;
    }
  };

  const getSuccessRate = (operation: ScheduledOperation) => {
    if (operation.run_count === 0) return 0;
    return Math.round((operation.success_count / operation.run_count) * 100);
  };

  const formatNextRun = (nextRunAt?: string) => {
    if (!nextRunAt) return 'Not scheduled';
    const nextRun = new Date(nextRunAt);
    const now = new Date();

    if (nextRun < now) return 'Overdue';

    const diffMs = nextRun.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));

    if (diffHours < 24) {
      return `In ${diffHours} hours`;
    } else {
      const diffDays = Math.round(diffHours / 24);
      return `In ${diffDays} days`;
    }
  };

  if (error) {
    return (
      <PageSection>
        <Alert
          variant={AlertVariant.danger}
          title="Error loading scheduled operations"
        >
          Failed to load scheduled operations. Please try again.
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
            <BreadcrumbItem isActive>Scheduled Operations</BreadcrumbItem>
          </Breadcrumb>
        </StackItem>

        {/* Header */}
        <StackItem>
          <Split hasGutter>
            <SplitItem isFilled>
              <Title headingLevel="h1" size="2xl">
                Scheduled Operations
              </Title>
            </SplitItem>
            <SplitItem>
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
              >
                Create Scheduled Operation
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
                      placeholder="Search operations..."
                      value={searchValue}
                      onChange={(_, value) => handleSearch(value)}
                      onClear={() => handleSearch('')}
                    />
                  </ToolbarItem>
                  <ToolbarItem>
                    <Select
                      isOpen={isOperationTypeFilterOpen}
                      selected={operationTypeFilter}
                      onSelect={(_, selection) =>
                        handleOperationTypeFilter(selection as string)
                      }
                      onOpenChange={setIsOperationTypeFilterOpen}
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() =>
                            setIsOperationTypeFilterOpen(
                              !isOperationTypeFilterOpen
                            )
                          }
                        >
                          {operationTypeFilter
                            ? getOperationTypeLabel(operationTypeFilter)
                            : 'All Types'}
                        </MenuToggle>
                      )}
                    >
                      <SelectList>
                        <SelectOption value="power">
                          Power Management
                        </SelectOption>
                        <SelectOption value="backup">Backup</SelectOption>
                        <SelectOption value="maintenance">
                          Maintenance
                        </SelectOption>
                        <SelectOption value="cleanup">Cleanup</SelectOption>
                        <SelectOption value="deployment">
                          Deployment
                        </SelectOption>
                      </SelectList>
                    </Select>
                  </ToolbarItem>
                  <ToolbarItem>
                    <Select
                      isOpen={isEnabledFilterOpen}
                      selected={isEnabledFilter}
                      onSelect={(_, selection) =>
                        handleEnabledFilter(selection as string)
                      }
                      onOpenChange={setIsEnabledFilterOpen}
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() =>
                            setIsEnabledFilterOpen(!isEnabledFilterOpen)
                          }
                        >
                          {isEnabledFilter === 'true'
                            ? 'Enabled'
                            : isEnabledFilter === 'false'
                              ? 'Disabled'
                              : 'All Operations'}
                        </MenuToggle>
                      )}
                    >
                      <SelectList>
                        <SelectOption value="true">Enabled</SelectOption>
                        <SelectOption value="false">Disabled</SelectOption>
                      </SelectList>
                    </Select>
                  </ToolbarItem>
                  {(searchValue || operationTypeFilter || isEnabledFilter) && (
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

        {/* Operations Table */}
        <StackItem isFilled>
          {isLoading ? (
            <LoadingSpinner />
          ) : operations.length === 0 ? (
            <EmptyState variant="lg">
              <Title headingLevel="h4" size="lg">
                No scheduled operations found
              </Title>
              <EmptyStateBody>
                {searchValue || operationTypeFilter || isEnabledFilter
                  ? 'No operations match your current filters.'
                  : 'No scheduled operations have been created yet. Create your first scheduled operation to automate tasks.'}
              </EmptyStateBody>
              {searchValue || operationTypeFilter || isEnabledFilter ? (
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
                    Create Scheduled Operation
                  </Button>
                </EmptyStateActions>
              )}
            </EmptyState>
          ) : (
            <Card>
              <Table aria-label="Scheduled operations table">
                <Thead>
                  <Tr>
                    <Th>Operation</Th>
                    <Th>Status</Th>
                    <Th>Type</Th>
                    <Th>Schedule</Th>
                    <Th>Next Run</Th>
                    <Th>Success Rate</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {operations.map((operation: ScheduledOperation) => (
                    <Tr key={operation.id}>
                      <Td>
                        <Stack>
                          <StackItem>
                            <strong>{operation.name}</strong>
                          </StackItem>
                          {operation.description && (
                            <StackItem>
                              <small className="pf-v6-u-color-200">
                                {operation.description}
                              </small>
                            </StackItem>
                          )}
                          <StackItem>
                            <small className="pf-v6-u-color-200">
                              Targets:{' '}
                              {getTargetTypeLabel(operation.target_type)}
                            </small>
                          </StackItem>
                        </Stack>
                      </Td>
                      <Td>
                        <Badge color={operation.is_enabled ? 'green' : 'grey'}>
                          {operation.is_enabled ? 'ENABLED' : 'DISABLED'}
                        </Badge>
                      </Td>
                      <Td>{getOperationTypeLabel(operation.operation_type)}</Td>
                      <Td>
                        <Stack>
                          <StackItem>
                            <ClockIcon className="pf-v6-u-mr-xs" />
                            <code>{operation.schedule_expression}</code>
                          </StackItem>
                          <StackItem>
                            <small className="pf-v6-u-color-200">
                              {operation.schedule_type === 'recurring'
                                ? 'Recurring'
                                : 'One-time'}
                            </small>
                          </StackItem>
                        </Stack>
                      </Td>
                      <Td>
                        <Stack>
                          <StackItem>
                            {formatNextRun(operation.next_run_at)}
                          </StackItem>
                          {operation.last_run_at && (
                            <StackItem>
                              <small className="pf-v6-u-color-200">
                                Last run:{' '}
                                {new Date(
                                  operation.last_run_at
                                ).toLocaleDateString()}
                              </small>
                            </StackItem>
                          )}
                        </Stack>
                      </Td>
                      <Td>
                        <Stack>
                          <StackItem>
                            <Badge
                              color={
                                getSuccessRate(operation) >= 80
                                  ? 'green'
                                  : getSuccessRate(operation) >= 60
                                    ? 'orange'
                                    : 'red'
                              }
                            >
                              {getSuccessRate(operation)}%
                            </Badge>
                          </StackItem>
                          <StackItem>
                            <small className="pf-v6-u-color-200">
                              {operation.success_count}/{operation.run_count}{' '}
                              runs
                            </small>
                          </StackItem>
                        </Stack>
                      </Td>
                      <Td>
                        <ActionsColumn
                          items={[
                            {
                              title: operation.is_enabled
                                ? 'Disable'
                                : 'Enable',
                              icon: operation.is_enabled ? (
                                <PauseIcon />
                              ) : (
                                <PlayIcon />
                              ),
                              onClick: () =>
                                handleToggleOperation(
                                  operation.id,
                                  !operation.is_enabled
                                ),
                            },
                            {
                              title: 'Run Now',
                              icon: <PlayIcon />,
                              onClick: () => handleRunOperation(operation.id),
                              isDisabled: !operation.is_enabled,
                            },
                            {
                              title: 'Edit',
                              icon: <EditIcon />,
                              onClick: () => handleEditOperation(operation),
                            },
                            {
                              title: 'Delete',
                              icon: <TrashIcon />,
                              onClick: () =>
                                handleDeleteOperation(operation.id),
                            },
                          ]}
                        />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Card>
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

      {/* Create/Edit Operation Modal */}
      <Modal
        variant={ModalVariant.medium}
        title={
          editingOperation
            ? 'Edit Scheduled Operation'
            : 'Create Scheduled Operation'
        }
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingOperation(null);
          resetForm();
        }}
      >
        <Form>
          <FormGroup label="Operation Name" isRequired fieldId="operation-name">
            <TextInput
              isRequired
              id="operation-name"
              value={operationName}
              onChange={(_event, value) => setOperationName(value)}
              placeholder="Enter operation name"
            />
          </FormGroup>

          <FormGroup label="Description" fieldId="operation-description">
            <TextArea
              id="operation-description"
              value={operationDescription}
              onChange={(_event, value) => setOperationDescription(value)}
              placeholder="Enter operation description (optional)"
              rows={3}
            />
          </FormGroup>

          <FormGroup label="Operation Type" isRequired fieldId="operation-type">
            <Select
              isOpen={false}
              selected={operationType}
              onSelect={(_, selection) =>
                setOperationType(
                  selection as
                    | 'power'
                    | 'backup'
                    | 'maintenance'
                    | 'cleanup'
                    | 'deployment'
                )
              }
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle ref={toggleRef}>
                  {getOperationTypeLabel(operationType)}
                </MenuToggle>
              )}
            >
              <SelectList>
                <SelectOption value="power">Power Management</SelectOption>
                <SelectOption value="backup">Backup</SelectOption>
                <SelectOption value="maintenance">Maintenance</SelectOption>
                <SelectOption value="cleanup">Cleanup</SelectOption>
                <SelectOption value="deployment">Deployment</SelectOption>
              </SelectList>
            </Select>
          </FormGroup>

          <FormGroup
            label="Schedule Expression (Cron)"
            isRequired
            fieldId="schedule-expression"
          >
            <TextInput
              isRequired
              id="schedule-expression"
              value={scheduleExpression}
              onChange={(_event, value) => setScheduleExpression(value)}
              placeholder="0 2 * * * (daily at 2 AM)"
            />
            <small className="pf-v6-u-color-200">
              Use cron format: minute hour day month weekday
            </small>
          </FormGroup>

          <FormGroup label="Target Type" isRequired fieldId="target-type">
            <Select
              isOpen={false}
              selected={targetType}
              onSelect={(_, selection) =>
                setTargetType(selection as 'vms' | 'vdcs' | 'organizations')
              }
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle ref={toggleRef}>
                  {getTargetTypeLabel(targetType)}
                </MenuToggle>
              )}
            >
              <SelectList>
                <SelectOption value="vms">Virtual Machines</SelectOption>
                <SelectOption value="vdcs">Virtual Data Centers</SelectOption>
                <SelectOption value="organizations">Organizations</SelectOption>
              </SelectList>
            </Select>
          </FormGroup>

          <FormGroup fieldId="operation-enabled">
            <Switch
              id="operation-enabled"
              label="Enable this scheduled operation"
              isChecked={operationEnabled}
              onChange={(_event, checked) => setOperationEnabled(checked)}
            />
          </FormGroup>
        </Form>

        <div className="pf-v6-u-mt-lg">
          <Button
            variant="primary"
            onClick={handleCreateOperation}
            isLoading={
              createOperationMutation.isPending ||
              updateOperationMutation.isPending
            }
            isDisabled={!operationName || !scheduleExpression}
          >
            {editingOperation ? 'Update Operation' : 'Create Operation'}
          </Button>
          <Button
            variant="link"
            onClick={() => {
              setShowCreateModal(false);
              setEditingOperation(null);
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

export default ScheduledOperations;
