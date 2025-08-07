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
  BuildingIcon,
  PlusCircleIcon,
  SearchIcon,
  FilterIcon,
} from '@patternfly/react-icons';
import { useNavigate } from 'react-router-dom';
import {
  useOrganizations,
  useDeleteOrganization,
  useToggleOrganizationStatus,
} from '../../hooks';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { Organization, OrganizationQueryParams } from '../../types';
import { ROUTES } from '../../utils/constants';

const Organizations: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Prepare query parameters
  const queryParams: OrganizationQueryParams = {
    search: searchTerm || undefined,
    enabled:
      statusFilter === 'enabled'
        ? true
        : statusFilter === 'disabled'
          ? false
          : undefined,
    sort_by: sortBy,
    sort_order: sortDirection,
    page,
    per_page: perPage,
  };

  const {
    data: organizationsResponse,
    isLoading,
    error,
  } = useOrganizations(queryParams);
  const deleteOrganizationMutation = useDeleteOrganization();
  const toggleStatusMutation = useToggleOrganizationStatus();

  const organizations = organizationsResponse?.data || [];
  const pagination = organizationsResponse?.pagination;

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

  const handleStatusChange = async (org: Organization, enabled: boolean) => {
    try {
      await toggleStatusMutation.mutateAsync({ id: org.id, enabled });
    } catch (error) {
      setErrorMessage(
        `Failed to toggle organization status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleDelete = async (org: Organization) => {
    if (
      window.confirm(
        `Are you sure you want to delete organization "${org.display_name}"?`
      )
    ) {
      try {
        await deleteOrganizationMutation.mutateAsync(org.id);
      } catch (error) {
        setErrorMessage(
          `Failed to delete organization: ${error instanceof Error ? error.message : 'Unknown error'}`
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
        <EmptyState icon={BuildingIcon}>
          <EmptyStateBody>
            Failed to load organizations. Please try again.
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
                Organizations
              </Title>
              <p className="pf-v6-u-color-200">
                Manage organizations and their settings
              </p>
            </SplitItem>
            <SplitItem>
              <Button
                variant="primary"
                icon={<PlusCircleIcon />}
                onClick={() => navigate(ROUTES.ORGANIZATION_CREATE)}
              >
                Create Organization
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
                      placeholder="Search organizations..."
                      value={searchTerm}
                      onChange={(_, value) => handleSearch(value)}
                      onClear={() => handleSearch('')}
                      aria-label="Search organizations"
                    />
                  </ToolbarItem>
                  <ToolbarItem>
                    <Dropdown
                      isOpen={isFilterDropdownOpen}
                      onSelect={() => setIsFilterDropdownOpen(false)}
                      onOpenChange={(isOpen) => setIsFilterDropdownOpen(isOpen)}
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() =>
                            setIsFilterDropdownOpen(!isFilterDropdownOpen)
                          }
                          isExpanded={isFilterDropdownOpen}
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

        {/* Organizations Table */}
        <StackItem>
          <Card>
            <CardBody>
              {organizations.length === 0 ? (
                <Bullseye>
                  <EmptyState icon={searchTerm ? SearchIcon : BuildingIcon}>
                    <Title headingLevel="h4" size="lg">
                      {searchTerm
                        ? 'No matching organizations'
                        : 'No organizations found'}
                    </Title>
                    <EmptyStateBody>
                      {searchTerm
                        ? 'Try adjusting your search criteria or filters.'
                        : 'Get started by creating your first organization.'}
                    </EmptyStateBody>
                    {!searchTerm && (
                      <EmptyStateActions>
                        <Button
                          variant="primary"
                          icon={<PlusCircleIcon />}
                          onClick={() => navigate(ROUTES.ORGANIZATION_CREATE)}
                        >
                          Create Organization
                        </Button>
                      </EmptyStateActions>
                    )}
                  </EmptyState>
                </Bullseye>
              ) : (
                <Table aria-label="Organizations table" variant="compact">
                  <Thead>
                    <Tr>
                      <Th {...getSortableProps('name')}>Name</Th>
                      <Th {...getSortableProps('display_name')}>
                        Display Name
                      </Th>
                      <Th>Description</Th>
                      <Th>Status</Th>
                      <Th {...getSortableProps('created_at')}>Created</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {organizations.map((org) => (
                      <Tr key={org.id}>
                        <Td dataLabel="Name">
                          <Button
                            variant="link"
                            isInline
                            onClick={() =>
                              navigate(
                                ROUTES.ORGANIZATION_DETAIL.replace(
                                  ':id',
                                  org.id
                                )
                              )
                            }
                          >
                            {org.name}
                          </Button>
                        </Td>
                        <Td dataLabel="Display Name">{org.display_name}</Td>
                        <Td dataLabel="Description">
                          {org.description || (
                            <span className="pf-v6-u-color-200">
                              No description
                            </span>
                          )}
                        </Td>
                        <Td dataLabel="Status">
                          <Split hasGutter>
                            <SplitItem>
                              <Badge color={org.enabled ? 'green' : 'red'}>
                                {org.enabled ? 'Enabled' : 'Disabled'}
                              </Badge>
                            </SplitItem>
                            <SplitItem>
                              <Switch
                                id={`status-${org.id}`}
                                isChecked={org.enabled}
                                onChange={(_, checked) =>
                                  handleStatusChange(org, checked)
                                }
                                isDisabled={toggleStatusMutation.isPending}
                                aria-label={`Toggle ${org.name} status`}
                              />
                            </SplitItem>
                          </Split>
                        </Td>
                        <Td dataLabel="Created">
                          {new Date(org.created_at).toLocaleDateString()}
                        </Td>
                        <Td dataLabel="Actions">
                          <ActionsColumn
                            items={[
                              {
                                title: 'View Details',
                                onClick: () =>
                                  navigate(
                                    ROUTES.ORGANIZATION_DETAIL.replace(
                                      ':id',
                                      org.id
                                    )
                                  ),
                              },
                              {
                                title: 'Edit',
                                onClick: () =>
                                  navigate(
                                    ROUTES.ORGANIZATION_EDIT.replace(
                                      ':id',
                                      org.id
                                    )
                                  ),
                              },
                              {
                                title: 'Manage Users',
                                onClick: () =>
                                  navigate(
                                    ROUTES.ORGANIZATION_USERS.replace(
                                      ':id',
                                      org.id
                                    )
                                  ),
                              },
                              { isSeparator: true },
                              {
                                title: 'Delete',
                                onClick: () => handleDelete(org),
                                isDisabled:
                                  deleteOrganizationMutation.isPending,
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
        {organizations.length > 0 && pagination && (
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

export default Organizations;
