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
  Button,
  Stack,
  StackItem,
  Split,
  SplitItem,
  Badge,
  Switch,
  Pagination,
  EmptyState,
  EmptyStateBody,
  EmptyStateActions,
  Bullseye,
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  Alert,
  AlertVariant,
  Progress,
  ProgressSize,
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
import type { MenuToggleElement } from '@patternfly/react-core';
import {
  NetworkIcon,
  PlusCircleIcon,
  SearchIcon,
  FilterIcon,
} from '@patternfly/react-icons';
import { useNavigate } from 'react-router-dom';
import { useVDCs, useDeleteVDC, useToggleVDCStatus } from '../../hooks';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { VDC, VDCQueryParams } from '../../types';
import { ROUTES } from '../../utils/constants';
import { formatBytes } from '../../utils/format';

const VDCs: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [allocationFilter, setAllocationFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [isAllocationFilterOpen, setIsAllocationFilterOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Prepare query parameters
  const queryParams: VDCQueryParams = {
    search: searchTerm || undefined,
    enabled:
      statusFilter === 'enabled'
        ? true
        : statusFilter === 'disabled'
          ? false
          : undefined,
    allocation_model: allocationFilter !== 'all' ? allocationFilter : undefined,
    sort_by: sortBy,
    sort_order: sortDirection,
    page,
    per_page: perPage,
  };

  const { data: vdcsResponse, isLoading, error } = useVDCs(queryParams);
  const deleteVDCMutation = useDeleteVDC();
  const toggleStatusMutation = useToggleVDCStatus();

  const vdcs = vdcsResponse?.data || [];
  const pagination = vdcsResponse?.pagination;

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1); // Reset to first page when searching
  };

  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(columnKey);
      setSortDirection('asc');
    }
    setPage(1);
  };

  const handleStatusChange = async (vdc: VDC, enabled: boolean) => {
    try {
      await toggleStatusMutation.mutateAsync({ id: vdc.id, enabled });
    } catch (error) {
      setErrorMessage(
        `Failed to toggle VDC status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleDelete = async (vdc: VDC) => {
    if (
      window.confirm(
        `Are you sure you want to delete VDC "${vdc.name}"? This will also delete all VMs and resources in this VDC.`
      )
    ) {
      try {
        await deleteVDCMutation.mutateAsync(vdc.id);
      } catch (error) {
        setErrorMessage(
          `Failed to delete VDC: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  };

  const getStatusFilterLabel = (filter: string) => {
    switch (filter) {
      case 'enabled':
        return 'Enabled Only';
      case 'disabled':
        return 'Disabled Only';
      default:
        return 'All Statuses';
    }
  };

  const getAllocationFilterLabel = (filter: string) => {
    switch (filter) {
      case 'PayAsYouGo':
        return 'Pay As You Go Only';
      case 'AllocationPool':
        return 'Allocation Pool Only';
      default:
        return 'All Models';
    }
  };

  const getSortableProps = (columnKey: string) => ({
    sort: {
      sortBy: {
        index: sortBy === columnKey ? 0 : undefined,
        direction: sortDirection,
      },
      onSort: () => handleSort(columnKey),
      columnIndex: 0,
    },
  });

  if (isLoading) {
    return (
      <PageSection>
        <LoadingSpinner />
      </PageSection>
    );
  }

  if (error) {
    return (
      <PageSection>
        <EmptyState icon={NetworkIcon}>
          <EmptyStateBody>
            Failed to load VDCs. Please try again.
          </EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  return (
    <PageSection>
      <Stack hasGutter>
        {/* Header */}
        <StackItem>
          <Split hasGutter>
            <SplitItem isFilled>
              <Title headingLevel="h1" size="xl">
                Virtual Data Centers
              </Title>
              <p className="pf-v6-u-color-200">
                Manage virtual data centers and their resource allocations
              </p>
            </SplitItem>
            <SplitItem>
              <Button
                variant="primary"
                icon={<PlusCircleIcon />}
                onClick={() => navigate(ROUTES.VDC_CREATE)}
              >
                Create VDC
              </Button>
            </SplitItem>
          </Split>
        </StackItem>

        {/* Error Alert */}
        {errorMessage && (
          <StackItem>
            <Alert variant={AlertVariant.danger} title="Error" isInline>
              {errorMessage}
              <br />
              <Button variant="link" onClick={() => setErrorMessage('')}>
                Dismiss
              </Button>
            </Alert>
          </StackItem>
        )}

        {/* Toolbar */}
        <StackItem>
          <Card>
            <CardBody>
              <Toolbar>
                <ToolbarContent>
                  <ToolbarItem width="300px">
                    <SearchInput
                      placeholder="Search VDCs..."
                      value={searchTerm}
                      onChange={(_, value) => handleSearch(value)}
                      onClear={() => handleSearch('')}
                      aria-label="Search VDCs"
                    />
                  </ToolbarItem>
                  <ToolbarItem>
                    <Dropdown
                      isOpen={isStatusFilterOpen}
                      onSelect={() => setIsStatusFilterOpen(false)}
                      onOpenChange={(isOpen) => setIsStatusFilterOpen(isOpen)}
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() =>
                            setIsStatusFilterOpen(!isStatusFilterOpen)
                          }
                          isExpanded={isStatusFilterOpen}
                          icon={<FilterIcon />}
                        >
                          {getStatusFilterLabel(statusFilter)}
                        </MenuToggle>
                      )}
                    >
                      <DropdownList>
                        <DropdownItem
                          key="all"
                          onClick={() => {
                            setStatusFilter('all');
                            setPage(1);
                          }}
                        >
                          All Statuses
                        </DropdownItem>
                        <DropdownItem
                          key="enabled"
                          onClick={() => {
                            setStatusFilter('enabled');
                            setPage(1);
                          }}
                        >
                          Enabled Only
                        </DropdownItem>
                        <DropdownItem
                          key="disabled"
                          onClick={() => {
                            setStatusFilter('disabled');
                            setPage(1);
                          }}
                        >
                          Disabled Only
                        </DropdownItem>
                      </DropdownList>
                    </Dropdown>
                  </ToolbarItem>
                  <ToolbarItem>
                    <Dropdown
                      isOpen={isAllocationFilterOpen}
                      onSelect={() => setIsAllocationFilterOpen(false)}
                      onOpenChange={(isOpen) =>
                        setIsAllocationFilterOpen(isOpen)
                      }
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() =>
                            setIsAllocationFilterOpen(!isAllocationFilterOpen)
                          }
                          isExpanded={isAllocationFilterOpen}
                          icon={<FilterIcon />}
                        >
                          {getAllocationFilterLabel(allocationFilter)}
                        </MenuToggle>
                      )}
                    >
                      <DropdownList>
                        <DropdownItem
                          key="all"
                          onClick={() => {
                            setAllocationFilter('all');
                            setPage(1);
                          }}
                        >
                          All Allocation Models
                        </DropdownItem>
                        <DropdownItem
                          key="PayAsYouGo"
                          onClick={() => {
                            setAllocationFilter('PayAsYouGo');
                            setPage(1);
                          }}
                        >
                          Pay As You Go
                        </DropdownItem>
                        <DropdownItem
                          key="AllocationPool"
                          onClick={() => {
                            setAllocationFilter('AllocationPool');
                            setPage(1);
                          }}
                        >
                          Allocation Pool
                        </DropdownItem>
                      </DropdownList>
                    </Dropdown>
                  </ToolbarItem>
                  <ToolbarItem align={{ default: 'alignEnd' }}>
                    {pagination && (
                      <Pagination
                        page={page}
                        perPage={perPage}
                        itemCount={pagination.total}
                        onSetPage={(_, newPage) => setPage(newPage)}
                        onPerPageSelect={(_, newPerPage) => {
                          setPerPage(newPerPage);
                          setPage(1);
                        }}
                        variant="top"
                        isCompact
                      />
                    )}
                  </ToolbarItem>
                </ToolbarContent>
              </Toolbar>
            </CardBody>
          </Card>
        </StackItem>

        {/* VDCs Table */}
        <StackItem>
          <Card>
            <CardBody>
              {vdcs.length === 0 ? (
                <Bullseye>
                  <EmptyState icon={searchTerm ? SearchIcon : NetworkIcon}>
                    <Title headingLevel="h4" size="lg">
                      {searchTerm ? 'No matching VDCs' : 'No VDCs found'}
                    </Title>
                    <EmptyStateBody>
                      {searchTerm
                        ? 'Try adjusting your search criteria or filters.'
                        : 'Get started by creating your first Virtual Data Center.'}
                    </EmptyStateBody>
                    {!searchTerm && (
                      <EmptyStateActions>
                        <Button
                          variant="primary"
                          icon={<PlusCircleIcon />}
                          onClick={() => navigate(ROUTES.VDC_CREATE)}
                        >
                          Create VDC
                        </Button>
                      </EmptyStateActions>
                    )}
                  </EmptyState>
                </Bullseye>
              ) : (
                <Table aria-label="VDCs table" variant="compact">
                  <Thead>
                    <Tr>
                      <Th {...getSortableProps('name')}>Name</Th>
                      <Th>Namespace</Th>
                      <Th>Allocation Model</Th>
                      <Th>CPU Usage</Th>
                      <Th>Memory Usage</Th>
                      <Th>Storage Usage</Th>
                      <Th>Status</Th>
                      <Th {...getSortableProps('created_at')}>Created</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {vdcs.map((vdc) => (
                      <Tr key={vdc.id}>
                        <Td dataLabel="Name">
                          <Button
                            variant="link"
                            isInline
                            onClick={() =>
                              navigate(ROUTES.VDC_DETAIL.replace(':id', vdc.id))
                            }
                          >
                            {vdc.name}
                          </Button>
                        </Td>
                        <Td dataLabel="Namespace">
                          <code>{vdc.namespace}</code>
                        </Td>
                        <Td dataLabel="Allocation Model">
                          <Badge color="blue">{vdc.allocation_model}</Badge>
                        </Td>
                        <Td dataLabel="CPU Usage">
                          <div style={{ minWidth: '120px' }}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '0.875rem',
                              }}
                            >
                              <span>0 / {vdc.cpu_limit}</span>
                              <span>0%</span>
                            </div>
                            <Progress
                              value={0}
                              size={ProgressSize.sm}
                              variant="success"
                            />
                          </div>
                        </Td>
                        <Td dataLabel="Memory Usage">
                          <div style={{ minWidth: '120px' }}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '0.875rem',
                              }}
                            >
                              <span>
                                0 /{' '}
                                {formatBytes(vdc.memory_limit_mb * 1024 * 1024)}
                              </span>
                              <span>0%</span>
                            </div>
                            <Progress
                              value={0}
                              size={ProgressSize.sm}
                              variant="success"
                            />
                          </div>
                        </Td>
                        <Td dataLabel="Storage Usage">
                          <div style={{ minWidth: '120px' }}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '0.875rem',
                              }}
                            >
                              <span>
                                0 /{' '}
                                {formatBytes(
                                  vdc.storage_limit_mb * 1024 * 1024
                                )}
                              </span>
                              <span>0%</span>
                            </div>
                            <Progress
                              value={0}
                              size={ProgressSize.sm}
                              variant="success"
                            />
                          </div>
                        </Td>
                        <Td dataLabel="Status">
                          <Split hasGutter>
                            <SplitItem>
                              <Badge color={vdc.enabled ? 'green' : 'red'}>
                                {vdc.enabled ? 'Enabled' : 'Disabled'}
                              </Badge>
                            </SplitItem>
                            <SplitItem>
                              <Switch
                                id={`status-${vdc.id}`}
                                isChecked={vdc.enabled}
                                onChange={(_, checked) =>
                                  handleStatusChange(vdc, checked)
                                }
                                isDisabled={toggleStatusMutation.isPending}
                                aria-label={`Toggle ${vdc.name} status`}
                              />
                            </SplitItem>
                          </Split>
                        </Td>
                        <Td dataLabel="Created">
                          {vdc.created_at
                            ? new Date(vdc.created_at).toLocaleDateString()
                            : 'N/A'}
                        </Td>
                        <Td dataLabel="Actions">
                          <ActionsColumn
                            items={[
                              {
                                title: 'View Details',
                                onClick: () =>
                                  navigate(
                                    ROUTES.VDC_DETAIL.replace(':id', vdc.id)
                                  ),
                              },
                              {
                                title: 'Edit',
                                onClick: () =>
                                  navigate(
                                    ROUTES.VDC_EDIT.replace(':id', vdc.id)
                                  ),
                              },
                              {
                                title: 'Manage Users',
                                onClick: () =>
                                  navigate(
                                    ROUTES.VDC_USERS.replace(':id', vdc.id)
                                  ),
                              },
                              {
                                title: 'View VMs',
                                onClick: () =>
                                  navigate(`${ROUTES.VMS}?vdc=${vdc.id}`),
                              },
                              { isSeparator: true },
                              {
                                title: 'Delete',
                                onClick: () => handleDelete(vdc),
                                isDisabled: deleteVDCMutation.isPending,
                              },
                            ]}
                          />
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </CardBody>
          </Card>
        </StackItem>

        {/* Bottom Pagination */}
        {vdcs.length > 0 && pagination && (
          <StackItem>
            <Pagination
              page={page}
              perPage={perPage}
              itemCount={pagination.total}
              onSetPage={(_, newPage) => setPage(newPage)}
              onPerPageSelect={(_, newPerPage) => {
                setPerPage(newPerPage);
                setPage(1);
              }}
              variant="bottom"
            />
          </StackItem>
        )}
      </Stack>
    </PageSection>
  );
};

export default VDCs;
