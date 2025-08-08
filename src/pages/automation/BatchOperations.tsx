import React, { useState } from 'react';
import {
  PageSection,
  Title,
  Tabs,
  Tab,
  TabTitleText,
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
  Progress,
  Alert,
  AlertVariant,
  EmptyState,
  EmptyStateBody,
  EmptyStateActions,
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
  StopIcon,
  RedoIcon,
  UndoIcon,
  TrashIcon,
} from '@patternfly/react-icons';
import { Link } from 'react-router-dom';
import {
  useBatchOperations,
  useCancelBatchOperation,
  useRetryBatchOperation,
  useRollbackBatchOperation,
  useDeleteBatchOperation,
} from '../../hooks/useAutomation';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ROUTES } from '../../utils/constants';
import type { MenuToggleElement } from '@patternfly/react-core';
import type { BatchOperation } from '../../types';

const BatchOperations: React.FC = () => {
  // Tab state
  const [activeTabKey, setActiveTabKey] = useState<string | number>('all');

  // Search and filter state
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [operationTypeFilter, setOperationTypeFilter] = useState<string>('');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // UI state
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [isOperationTypeFilterOpen, setIsOperationTypeFilterOpen] =
    useState(false);
  const [isTargetTypeFilterOpen, setIsTargetTypeFilterOpen] = useState(false);

  // Build query parameters
  const queryParams = {
    search: searchValue || undefined,
    status: statusFilter as 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | undefined,
    operation_type: operationTypeFilter as 'power' | 'configuration' | 'deployment' | 'cleanup' | 'backup' | undefined,
    target_type: targetTypeFilter as 'vms' | 'vdcs' | 'organizations' | undefined,
    page: currentPage,
    per_page: perPage,
  };

  const {
    data: operationsResponse,
    isLoading,
    error,
  } = useBatchOperations(queryParams);
  const cancelOperationMutation = useCancelBatchOperation();
  const retryOperationMutation = useRetryBatchOperation();
  const rollbackOperationMutation = useRollbackBatchOperation();
  const deleteOperationMutation = useDeleteBatchOperation();

  const totalCount = operationsResponse?.data?.total || 0;

  const handleSearch = (value: string) => {
    setSearchValue(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (selection: string) => {
    setStatusFilter(selection === statusFilter ? '' : selection);
    setCurrentPage(1);
    setIsStatusFilterOpen(false);
  };

  const handleOperationTypeFilter = (selection: string) => {
    setOperationTypeFilter(selection === operationTypeFilter ? '' : selection);
    setCurrentPage(1);
    setIsOperationTypeFilterOpen(false);
  };

  const handleTargetTypeFilter = (selection: string) => {
    setTargetTypeFilter(selection === targetTypeFilter ? '' : selection);
    setCurrentPage(1);
    setIsTargetTypeFilterOpen(false);
  };

  const clearAllFilters = () => {
    setSearchValue('');
    setStatusFilter('');
    setOperationTypeFilter('');
    setTargetTypeFilter('');
    setCurrentPage(1);
  };

  const handleCancelOperation = async (operationId: string) => {
    if (window.confirm('Are you sure you want to cancel this operation?')) {
      try {
        await cancelOperationMutation.mutateAsync(operationId);
      } catch (error) {
        console.error('Failed to cancel operation:', error);
      }
    }
  };

  const handleRetryOperation = async (operationId: string) => {
    try {
      await retryOperationMutation.mutateAsync(operationId);
    } catch (error) {
      console.error('Failed to retry operation:', error);
    }
  };

  const handleRollbackOperation = async (operationId: string) => {
    if (
      window.confirm(
        'Are you sure you want to rollback this operation? This will attempt to reverse all changes made.'
      )
    ) {
      try {
        await rollbackOperationMutation.mutateAsync(operationId);
      } catch (error) {
        console.error('Failed to rollback operation:', error);
      }
    }
  };

  const handleDeleteOperation = async (operationId: string) => {
    if (
      window.confirm(
        'Are you sure you want to delete this operation? This action cannot be undone.'
      )
    ) {
      try {
        await deleteOperationMutation.mutateAsync(operationId);
      } catch (error) {
        console.error('Failed to delete operation:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'running':
        return 'blue';
      case 'failed':
        return 'red';
      case 'cancelled':
        return 'grey';
      case 'pending':
        return 'orange';
      default:
        return 'grey';
    }
  };

  const getOperationTypeLabel = (type: string) => {
    switch (type) {
      case 'power':
        return 'Power Management';
      case 'configuration':
        return 'Configuration';
      case 'deployment':
        return 'Deployment';
      case 'cleanup':
        return 'Cleanup';
      case 'backup':
        return 'Backup';
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

  const filteredOperations = React.useMemo(() => {
    const ops = operationsResponse?.data?.operations || [];
    let filtered = ops;

    if (activeTabKey !== 'all') {
      filtered = filtered.filter((op) => op.status === activeTabKey);
    }

    return filtered;
  }, [operationsResponse?.data?.operations, activeTabKey]);

  if (error) {
    return (
      <PageSection>
        <Alert
          variant={AlertVariant.danger}
          title="Error loading batch operations"
        >
          Failed to load batch operations. Please try again.
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
            <BreadcrumbItem isActive>Batch Operations</BreadcrumbItem>
          </Breadcrumb>
        </StackItem>

        {/* Header */}
        <StackItem>
          <Split hasGutter>
            <SplitItem isFilled>
              <Title headingLevel="h1" size="2xl">
                Batch Operations
              </Title>
            </SplitItem>
            <SplitItem>
              <Link to={`${ROUTES.AUTOMATION_BATCH_OPERATIONS}/create`}>
                <Button variant="primary">
                  Create Operation
                </Button>
              </Link>
            </SplitItem>
          </Split>
        </StackItem>

        {/* Tabs */}
        <StackItem>
          <Tabs
            activeKey={activeTabKey}
            onSelect={(_, tabIndex) => setActiveTabKey(tabIndex)}
          >
            <Tab
              eventKey="all"
              title={<TabTitleText>All Operations</TabTitleText>}
            />
            <Tab
              eventKey="running"
              title={<TabTitleText>Running</TabTitleText>}
            />
            <Tab
              eventKey="pending"
              title={<TabTitleText>Pending</TabTitleText>}
            />
            <Tab
              eventKey="completed"
              title={<TabTitleText>Completed</TabTitleText>}
            />
            <Tab
              eventKey="failed"
              title={<TabTitleText>Failed</TabTitleText>}
            />
            <Tab
              eventKey="cancelled"
              title={<TabTitleText>Cancelled</TabTitleText>}
            />
          </Tabs>
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
                          {statusFilter || 'All Statuses'}
                        </MenuToggle>
                      )}
                    >
                      <SelectList>
                        <SelectOption value="pending">Pending</SelectOption>
                        <SelectOption value="running">Running</SelectOption>
                        <SelectOption value="completed">Completed</SelectOption>
                        <SelectOption value="failed">Failed</SelectOption>
                        <SelectOption value="cancelled">Cancelled</SelectOption>
                      </SelectList>
                    </Select>
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
                        <SelectOption value="configuration">
                          Configuration
                        </SelectOption>
                        <SelectOption value="deployment">
                          Deployment
                        </SelectOption>
                        <SelectOption value="cleanup">Cleanup</SelectOption>
                        <SelectOption value="backup">Backup</SelectOption>
                      </SelectList>
                    </Select>
                  </ToolbarItem>
                  <ToolbarItem>
                    <Select
                      isOpen={isTargetTypeFilterOpen}
                      selected={targetTypeFilter}
                      onSelect={(_, selection) =>
                        handleTargetTypeFilter(selection as string)
                      }
                      onOpenChange={setIsTargetTypeFilterOpen}
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() =>
                            setIsTargetTypeFilterOpen(!isTargetTypeFilterOpen)
                          }
                        >
                          {targetTypeFilter
                            ? getTargetTypeLabel(targetTypeFilter)
                            : 'All Targets'}
                        </MenuToggle>
                      )}
                    >
                      <SelectList>
                        <SelectOption value="vms">
                          Virtual Machines
                        </SelectOption>
                        <SelectOption value="vdcs">
                          Virtual Data Centers
                        </SelectOption>
                        <SelectOption value="organizations">
                          Organizations
                        </SelectOption>
                      </SelectList>
                    </Select>
                  </ToolbarItem>
                  {(searchValue ||
                    statusFilter ||
                    operationTypeFilter ||
                    targetTypeFilter) && (
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
          ) : filteredOperations.length === 0 ? (
            <EmptyState variant="lg">
              <Title headingLevel="h4" size="lg">
                No batch operations found
              </Title>
              <EmptyStateBody>
                {searchValue ||
                statusFilter ||
                operationTypeFilter ||
                targetTypeFilter
                  ? 'No operations match your current filters.'
                  : 'No batch operations have been created yet. Create your first operation to manage multiple resources.'}
              </EmptyStateBody>
              {searchValue ||
              statusFilter ||
              operationTypeFilter ||
              targetTypeFilter ? (
                <EmptyStateActions>
                  <Button variant="secondary" onClick={clearAllFilters}>
                    Clear all filters
                  </Button>
                </EmptyStateActions>
              ) : (
                <EmptyStateActions>
                  <Link to={`${ROUTES.AUTOMATION_BATCH_OPERATIONS}/create`}>
                    <Button variant="primary">
                      Create Operation
                    </Button>
                  </Link>
                </EmptyStateActions>
              )}
            </EmptyState>
          ) : (
            <Card>
              <Table aria-label="Batch operations table">
                <Thead>
                  <Tr>
                    <Th>Operation</Th>
                    <Th>Status</Th>
                    <Th>Type</Th>
                    <Th>Targets</Th>
                    <Th>Progress</Th>
                    <Th>Created</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredOperations.map((operation: BatchOperation) => (
                    <Tr key={operation.id}>
                      <Td>
                        <Stack>
                          <StackItem>
                            <strong>
                              <Link
                                to={`${ROUTES.AUTOMATION_BATCH_OPERATIONS}/${operation.id}`}
                              >
                                {operation.name}
                              </Link>
                            </strong>
                          </StackItem>
                          {operation.description && (
                            <StackItem>
                              <small className="pf-v6-u-color-200">
                                {operation.description}
                              </small>
                            </StackItem>
                          )}
                        </Stack>
                      </Td>
                      <Td>
                        <Badge color={getStatusColor(operation.status)}>
                          {operation.status.toUpperCase()}
                        </Badge>
                        {operation.error_message && (
                          <div className="pf-v6-u-mt-xs">
                            <Badge color="red">
                              Error
                            </Badge>
                          </div>
                        )}
                      </Td>
                      <Td>{getOperationTypeLabel(operation.operation_type)}</Td>
                      <Td>
                        <Stack>
                          <StackItem>
                            <strong>
                              {operation.target_count}{' '}
                              {getTargetTypeLabel(operation.target_type)}
                            </strong>
                          </StackItem>
                          <StackItem>
                            <small className="pf-v6-u-color-200">
                              {operation.completed_count} completed
                              {operation.failed_count > 0 &&
                                `, ${operation.failed_count} failed`}
                            </small>
                          </StackItem>
                        </Stack>
                      </Td>
                      <Td>
                        <Progress
                          value={operation.progress_percent}
                          title={`${operation.progress_percent}%`}
                          size="sm"
                          variant={
                            operation.status === 'failed' ? 'danger' : 'success'
                          }
                        />
                      </Td>
                      <Td>
                        <Stack>
                          <StackItem>
                            {new Date(
                              operation.created_at
                            ).toLocaleDateString()}
                          </StackItem>
                          <StackItem>
                            <small className="pf-v6-u-color-200">
                              by {operation.created_by}
                            </small>
                          </StackItem>
                        </Stack>
                      </Td>
                      <Td>
                        <ActionsColumn
                          items={[
                            {
                              title: 'Cancel',
                              icon: <StopIcon />,
                              onClick: () =>
                                handleCancelOperation(operation.id),
                              isDisabled:
                                !operation.can_cancel ||
                                operation.status === 'completed' ||
                                operation.status === 'failed' ||
                                operation.status === 'cancelled',
                            },
                            {
                              title: 'Retry',
                              icon: <RedoIcon />,
                              onClick: () => handleRetryOperation(operation.id),
                              isDisabled: operation.status !== 'failed',
                            },
                            {
                              title: 'Rollback',
                              icon: <UndoIcon />,
                              onClick: () =>
                                handleRollbackOperation(operation.id),
                              isDisabled:
                                !operation.is_rollback_supported ||
                                operation.status !== 'completed',
                            },
                            {
                              title: 'Delete',
                              icon: <TrashIcon />,
                              onClick: () =>
                                handleDeleteOperation(operation.id),
                              isDisabled:
                                operation.status === 'running' ||
                                operation.status === 'pending',
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
    </PageSection>
  );
};

export default BatchOperations;
