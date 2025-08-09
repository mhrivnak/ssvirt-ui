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
import type { MenuToggleElement } from '@patternfly/react-core';
import {
  NetworkIcon,
  PlusCircleIcon,
  FilterIcon,
} from '@patternfly/react-icons';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useVDCs, useDeleteVDC } from '../../hooks';
import { useRole } from '../../hooks/useRole';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { VDC, VDCQueryParams } from '../../types';
import { ROUTES } from '../../utils/constants';

const VDCs: React.FC = () => {
  const navigate = useNavigate();
  const { orgId } = useParams<{ orgId: string }>();
  const { capabilities } = useRole();
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
    filter: searchTerm || undefined,
    sortAsc: sortDirection === 'asc' ? sortBy : undefined,
    sortDesc: sortDirection === 'desc' ? sortBy : undefined,
    page,
    pageSize: perPage,
  };

  // Call hooks before any early returns
  const {
    data: vdcsResponse,
    isLoading,
    error,
  } = useVDCs(orgId || '', queryParams);
  const deleteVDCMutation = useDeleteVDC();

  // Check if user has system admin privileges
  if (!capabilities.canManageSystem) {
    return (
      <PageSection>
        <Alert variant={AlertVariant.warning} title="Access Denied" isInline>
          Only System Administrators can manage Virtual Data Centers.
        </Alert>
      </PageSection>
    );
  }

  if (!orgId) {
    return (
      <PageSection>
        <Alert
          variant={AlertVariant.danger}
          title="Invalid Organization"
          isInline
        >
          Organization ID is required to view VDCs.
        </Alert>
      </PageSection>
    );
  }

  const vdcs = vdcsResponse?.values || [];
  const totalCount = vdcsResponse?.resultTotal || 0;

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

  const handleDelete = async (vdc: VDC) => {
    if (
      window.confirm(
        `Are you sure you want to delete VDC "${vdc.name}"? This will also delete all VMs and resources in this VDC.`
      )
    ) {
      try {
        await deleteVDCMutation.mutateAsync({ orgId, vdcId: vdc.id });
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
      case 'ReservationPool':
        return 'Reservation Pool Only';
      case 'Flex':
        return 'Flex Only';
      default:
        return 'All Allocation Models';
    }
  };

  const formatResourceCapacity = (capacity: {
    allocated: number;
    limit: number;
    units: string;
  }) => {
    return `${capacity.allocated.toLocaleString()} / ${capacity.limit.toLocaleString()} ${capacity.units}`;
  };

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
        <Alert
          variant={AlertVariant.danger}
          title="Error Loading VDCs"
          isInline
        >
          {error instanceof Error ? error.message : 'Unknown error occurred'}
        </Alert>
      </PageSection>
    );
  }

  const statusFilterItems = [
    { key: 'all', label: 'All Statuses' },
    { key: 'enabled', label: 'Enabled Only' },
    { key: 'disabled', label: 'Disabled Only' },
  ];

  const allocationFilterItems = [
    { key: 'all', label: 'All Allocation Models' },
    { key: 'PayAsYouGo', label: 'Pay As You Go' },
    { key: 'AllocationPool', label: 'Allocation Pool' },
    { key: 'ReservationPool', label: 'Reservation Pool' },
    { key: 'Flex', label: 'Flex' },
  ];

  return (
    <PageSection>
      <Stack hasGutter>
        {/* Breadcrumb */}
        <StackItem>
          <Breadcrumb>
            <BreadcrumbItem>
              <Link to={ROUTES.DASHBOARD}>Dashboard</Link>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <Link to={ROUTES.ORGANIZATIONS}>Organizations</Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>Virtual Data Centers</BreadcrumbItem>
          </Breadcrumb>
        </StackItem>

        {/* Header */}
        <StackItem>
          <Split hasGutter>
            <SplitItem isFilled>
              <Title headingLevel="h1" size="xl">
                Virtual Data Centers
              </Title>
              <p className="pf-v6-u-color-200">
                Manage virtual data centers for the organization
              </p>
            </SplitItem>
            <SplitItem>
              <Button
                variant="primary"
                icon={<PlusCircleIcon />}
                onClick={() =>
                  navigate(`${ROUTES.ORGANIZATIONS}/${orgId}/vdcs/new`)
                }
              >
                Create VDC
              </Button>
            </SplitItem>
          </Split>
        </StackItem>

        {/* Error Message */}
        {errorMessage && (
          <StackItem>
            <Alert
              variant={AlertVariant.danger}
              title="Operation Failed"
              isInline
              actionClose={
                <Button
                  variant="plain"
                  onClick={() => setErrorMessage('')}
                  aria-label="Close error message"
                >
                  ×
                </Button>
              }
            >
              {errorMessage}
            </Alert>
          </StackItem>
        )}

        {/* Toolbar */}
        <StackItem>
          <Card>
            <CardBody>
              <Toolbar>
                <ToolbarContent>
                  <ToolbarItem>
                    <SearchInput
                      placeholder="Search VDCs..."
                      value={searchTerm}
                      onChange={(_, value) => handleSearch(value)}
                      onClear={() => handleSearch('')}
                    />
                  </ToolbarItem>
                  <ToolbarItem>
                    <Dropdown
                      isOpen={isStatusFilterOpen}
                      onSelect={(_, selection) => {
                        setStatusFilter(selection as string);
                        setIsStatusFilterOpen(false);
                        setPage(1);
                      }}
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() =>
                            setIsStatusFilterOpen(!isStatusFilterOpen)
                          }
                          icon={<FilterIcon />}
                        >
                          {getStatusFilterLabel(statusFilter)}
                        </MenuToggle>
                      )}
                    >
                      <DropdownList>
                        {statusFilterItems.map((item) => (
                          <DropdownItem key={item.key} value={item.key}>
                            {item.label}
                          </DropdownItem>
                        ))}
                      </DropdownList>
                    </Dropdown>
                  </ToolbarItem>
                  <ToolbarItem>
                    <Dropdown
                      isOpen={isAllocationFilterOpen}
                      onSelect={(_, selection) => {
                        setAllocationFilter(selection as string);
                        setIsAllocationFilterOpen(false);
                        setPage(1);
                      }}
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() =>
                            setIsAllocationFilterOpen(!isAllocationFilterOpen)
                          }
                          icon={<FilterIcon />}
                        >
                          {getAllocationFilterLabel(allocationFilter)}
                        </MenuToggle>
                      )}
                    >
                      <DropdownList>
                        {allocationFilterItems.map((item) => (
                          <DropdownItem key={item.key} value={item.key}>
                            {item.label}
                          </DropdownItem>
                        ))}
                      </DropdownList>
                    </Dropdown>
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
                  <EmptyState>
                    <NetworkIcon />
                    <Title headingLevel="h2" size="lg">
                      No VDCs Found
                    </Title>
                    <EmptyStateBody>
                      {searchTerm ||
                      statusFilter !== 'all' ||
                      allocationFilter !== 'all'
                        ? 'No VDCs match your current filters. Try adjusting your search criteria.'
                        : 'No virtual data centers have been created yet.'}
                    </EmptyStateBody>
                    <EmptyStateActions>
                      <Button
                        variant="primary"
                        icon={<PlusCircleIcon />}
                        onClick={() =>
                          navigate(`${ROUTES.ORGANIZATIONS}/${orgId}/vdcs/new`)
                        }
                      >
                        Create VDC
                      </Button>
                    </EmptyStateActions>
                  </EmptyState>
                </Bullseye>
              ) : (
                <Table aria-label="VDCs table">
                  <Thead>
                    <Tr>
                      <Th
                        sort={{
                          sortBy: {
                            index: sortBy === 'name' ? 0 : undefined,
                            direction: sortDirection,
                          },
                          onSort: () => handleSort('name'),
                          columnIndex: 0,
                        }}
                      >
                        Name
                      </Th>
                      <Th>Allocation Model</Th>
                      <Th>CPU Capacity</Th>
                      <Th>Memory Capacity</Th>
                      <Th>Status</Th>
                      <Th>Quotas</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {vdcs.map((vdc) => (
                      <Tr key={vdc.id}>
                        <Td dataLabel="Name">
                          <Split hasGutter>
                            <SplitItem>
                              <NetworkIcon />
                            </SplitItem>
                            <SplitItem>
                              <div>
                                <div className="pf-v6-u-font-weight-bold">
                                  <Link
                                    to={`${ROUTES.ORGANIZATIONS}/${orgId}/vdcs/${vdc.id}`}
                                    className="pf-v6-c-button pf-v6-m-link pf-v6-m-inline"
                                  >
                                    {vdc.name}
                                  </Link>
                                </div>
                                {vdc.description && (
                                  <div className="pf-v6-u-color-200 pf-v6-u-font-size-sm">
                                    {vdc.description}
                                  </div>
                                )}
                              </div>
                            </SplitItem>
                          </Split>
                        </Td>
                        <Td dataLabel="Allocation Model">
                          <Badge color="blue">{vdc.allocationModel}</Badge>
                        </Td>
                        <Td dataLabel="CPU Capacity">
                          {formatResourceCapacity(vdc.computeCapacity.cpu)}
                        </Td>
                        <Td dataLabel="Memory Capacity">
                          {formatResourceCapacity(vdc.computeCapacity.memory)}
                        </Td>
                        <Td dataLabel="Status">
                          <Badge color={vdc.isEnabled ? 'green' : 'red'}>
                            {vdc.isEnabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </Td>
                        <Td dataLabel="Quotas">
                          <div className="pf-v6-u-font-size-sm">
                            <div>NIC: {vdc.nicQuota}</div>
                            <div>Network: {vdc.networkQuota}</div>
                          </div>
                        </Td>
                        <Td>
                          <ActionsColumn
                            items={[
                              {
                                title: 'View Details',
                                onClick: () =>
                                  navigate(
                                    `${ROUTES.ORGANIZATIONS}/${orgId}/vdcs/${vdc.id}`
                                  ),
                              },
                              {
                                title: 'Edit',
                                onClick: () =>
                                  navigate(
                                    `${ROUTES.ORGANIZATIONS}/${orgId}/vdcs/${vdc.id}/edit`
                                  ),
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

        {/* Pagination */}
        {totalCount > 0 && (
          <StackItem>
            <Pagination
              itemCount={totalCount}
              perPage={perPage}
              page={page}
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
