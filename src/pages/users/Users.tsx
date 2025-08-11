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
  Checkbox,
  Toolbar as BulkToolbar,
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
  UsersIcon,
  PlusCircleIcon,
  SearchIcon,
  FilterIcon,
  TrashIcon,
} from '@patternfly/react-icons';
import { useNavigate } from 'react-router-dom';
import {
  useUsers,
  useDeleteUser,
  useToggleUserStatus,
  useBulkUpdateUserStatus,
  useBulkDeleteUsers,
} from '../../hooks/useUsers';
import { useOrganizations } from '../../hooks';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { User, UserQueryParams } from '../../types';
import { useRole } from '../../hooks/useRole';

const Users: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [organizationFilter, setOrganizationFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [isRoleFilterOpen, setIsRoleFilterOpen] = useState(false);
  const [isOrgFilterOpen, setIsOrgFilterOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  // Permission checks
  const { capabilities } = useRole();
  const canCreateUsers = capabilities?.canManageUsers ?? false;

  // Prepare query parameters
  const queryParams: UserQueryParams = {
    search: searchTerm || undefined,
    enabled:
      statusFilter === 'enabled'
        ? true
        : statusFilter === 'disabled'
          ? false
          : undefined,
    role: roleFilter !== 'all' ? roleFilter : undefined,
    organization_id:
      organizationFilter !== 'all' ? organizationFilter : undefined,
    sort_by: sortBy,
    sort_order: sortDirection,
    page,
    per_page: perPage,
  };

  const { data: usersResponse, isLoading, error } = useUsers(queryParams);

  const { data: organizationsResponse } = useOrganizations();

  const deleteUserMutation = useDeleteUser();
  const toggleStatusMutation = useToggleUserStatus();
  const bulkUpdateStatusMutation = useBulkUpdateUserStatus();
  const bulkDeleteMutation = useBulkDeleteUsers();

  const users = usersResponse?.data || [];
  const pagination = usersResponse?.pagination;
  const organizations = organizationsResponse?.data || [];

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
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

  const handleStatusChange = async (user: User, enabled: boolean) => {
    try {
      await toggleStatusMutation.mutateAsync({ id: user.id, enabled });
    } catch (error) {
      setErrorMessage(
        `Failed to toggle user status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleDelete = async (user: User) => {
    if (
      window.confirm(
        `Are you sure you want to delete user "${user.name || user.username}"?`
      )
    ) {
      try {
        await deleteUserMutation.mutateAsync(user.id);
      } catch (error) {
        setErrorMessage(
          `Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(users.map((user) => user.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleBulkEnable = async () => {
    try {
      await bulkUpdateStatusMutation.mutateAsync({
        userIds: Array.from(selectedUsers),
        enabled: true,
      });
      setSelectedUsers(new Set());
    } catch (error) {
      setErrorMessage(
        `Failed to enable users: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleBulkDisable = async () => {
    try {
      await bulkUpdateStatusMutation.mutateAsync({
        userIds: Array.from(selectedUsers),
        enabled: false,
      });
      setSelectedUsers(new Set());
    } catch (error) {
      setErrorMessage(
        `Failed to disable users: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleBulkDelete = async () => {
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedUsers.size} selected users?`
      )
    ) {
      try {
        await bulkDeleteMutation.mutateAsync(Array.from(selectedUsers));
        setSelectedUsers(new Set());
      } catch (error) {
        setErrorMessage(
          `Failed to delete users: ${error instanceof Error ? error.message : 'Unknown error'}`
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

  const getRoleFilterLabel = (filter: string) => {
    switch (filter) {
      case 'System Administrator':
        return 'System Admins';
      case 'Organization Administrator':
        return 'Org Admins';
      case 'vApp User':
        return 'vApp Users';
      default:
        return 'All Roles';
    }
  };

  const getOrgFilterLabel = (filter: string) => {
    if (filter === 'all') return 'All Organizations';
    const org = organizations.find((o) => o.id === filter);
    return org ? org.displayName || org.name : 'Unknown Organization';
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

  const getUserRoles = (user: User) => {
    return (
      user.roleEntityRefs?.map((role) => role.name).join(', ') || 'No roles'
    );
  };

  const getUserOrganization = (user: User) => {
    if (!user.orgEntityRef) return 'No organization';
    return user.orgEntityRef.name || 'Unknown';
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
        <EmptyState icon={UsersIcon}>
          <EmptyStateBody>
            Failed to load users. Please try again.
          </EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  const hasSelectedUsers = selectedUsers.size > 0;

  return (
    <PageSection>
      <Stack hasGutter>
        {/* Header */}
        <StackItem>
          <Split hasGutter>
            <SplitItem isFilled>
              <Title headingLevel="h1" size="xl">
                System User Management
              </Title>
              <p className="pf-v6-u-color-200">
                Manage system users, roles, and permissions
              </p>
            </SplitItem>
            {canCreateUsers && (
              <SplitItem>
                <Button
                  variant="primary"
                  icon={<PlusCircleIcon />}
                  onClick={() => navigate('/admin/users/create')}
                >
                  Create User
                </Button>
              </SplitItem>
            )}
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

        {/* Bulk Actions Toolbar */}
        {hasSelectedUsers && (
          <StackItem>
            <Card>
              <CardBody>
                <BulkToolbar>
                  <ToolbarContent>
                    <ToolbarItem>
                      <span>{selectedUsers.size} user(s) selected</span>
                    </ToolbarItem>
                    <ToolbarItem>
                      <Button
                        variant="secondary"
                        onClick={handleBulkEnable}
                        isDisabled={bulkUpdateStatusMutation.isPending}
                      >
                        Enable Selected
                      </Button>
                    </ToolbarItem>
                    <ToolbarItem>
                      <Button
                        variant="secondary"
                        onClick={handleBulkDisable}
                        isDisabled={bulkUpdateStatusMutation.isPending}
                      >
                        Disable Selected
                      </Button>
                    </ToolbarItem>
                    <ToolbarItem>
                      <Button
                        variant="danger"
                        icon={<TrashIcon />}
                        onClick={handleBulkDelete}
                        isDisabled={bulkDeleteMutation.isPending}
                      >
                        Delete Selected
                      </Button>
                    </ToolbarItem>
                    <ToolbarItem align={{ default: 'alignEnd' }}>
                      <Button
                        variant="link"
                        onClick={() => setSelectedUsers(new Set())}
                      >
                        Clear Selection
                      </Button>
                    </ToolbarItem>
                  </ToolbarContent>
                </BulkToolbar>
              </CardBody>
            </Card>
          </StackItem>
        )}

        {/* Search and Filter Toolbar */}
        <StackItem>
          <Card>
            <CardBody>
              <Toolbar>
                <ToolbarContent>
                  <ToolbarItem width="300px">
                    <SearchInput
                      placeholder="Search users by name, email, or username..."
                      value={searchTerm}
                      onChange={(_, value) => handleSearch(value)}
                      onClear={() => handleSearch('')}
                      aria-label="Search users"
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
                      isOpen={isRoleFilterOpen}
                      onSelect={() => setIsRoleFilterOpen(false)}
                      onOpenChange={(isOpen) => setIsRoleFilterOpen(isOpen)}
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() => setIsRoleFilterOpen(!isRoleFilterOpen)}
                          isExpanded={isRoleFilterOpen}
                          icon={<FilterIcon />}
                        >
                          {getRoleFilterLabel(roleFilter)}
                        </MenuToggle>
                      )}
                    >
                      <DropdownList>
                        <DropdownItem
                          key="all"
                          onClick={() => {
                            setRoleFilter('all');
                            setPage(1);
                          }}
                        >
                          All Roles
                        </DropdownItem>
                        <DropdownItem
                          key="System Administrator"
                          onClick={() => {
                            setRoleFilter('System Administrator');
                            setPage(1);
                          }}
                        >
                          System Admins
                        </DropdownItem>
                        <DropdownItem
                          key="Organization Administrator"
                          onClick={() => {
                            setRoleFilter('Organization Administrator');
                            setPage(1);
                          }}
                        >
                          Org Admins
                        </DropdownItem>
                        <DropdownItem
                          key="vApp User"
                          onClick={() => {
                            setRoleFilter('vApp User');
                            setPage(1);
                          }}
                        >
                          vApp Users
                        </DropdownItem>
                      </DropdownList>
                    </Dropdown>
                  </ToolbarItem>
                  <ToolbarItem>
                    <Dropdown
                      isOpen={isOrgFilterOpen}
                      onSelect={() => setIsOrgFilterOpen(false)}
                      onOpenChange={(isOpen) => setIsOrgFilterOpen(isOpen)}
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() => setIsOrgFilterOpen(!isOrgFilterOpen)}
                          isExpanded={isOrgFilterOpen}
                          icon={<FilterIcon />}
                        >
                          {getOrgFilterLabel(organizationFilter)}
                        </MenuToggle>
                      )}
                    >
                      <DropdownList>
                        <DropdownItem
                          key="all"
                          onClick={() => {
                            setOrganizationFilter('all');
                            setPage(1);
                          }}
                        >
                          All Organizations
                        </DropdownItem>
                        {organizations.map((org) => (
                          <DropdownItem
                            key={org.id}
                            onClick={() => {
                              setOrganizationFilter(org.id);
                              setPage(1);
                            }}
                          >
                            {org.displayName || org.name}
                          </DropdownItem>
                        ))}
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

        {/* Users Table */}
        <StackItem>
          <Card>
            <CardBody>
              {users.length === 0 ? (
                <Bullseye>
                  <EmptyState icon={searchTerm ? SearchIcon : UsersIcon}>
                    <Title headingLevel="h4" size="lg">
                      {searchTerm ? 'No matching users' : 'No users found'}
                    </Title>
                    <EmptyStateBody>
                      {searchTerm
                        ? 'Try adjusting your search criteria or filters.'
                        : 'Get started by creating your first user.'}
                    </EmptyStateBody>
                    {!searchTerm && canCreateUsers && (
                      <EmptyStateActions>
                        <Button
                          variant="primary"
                          icon={<PlusCircleIcon />}
                          onClick={() => navigate('/admin/users/create')}
                        >
                          Create User
                        </Button>
                      </EmptyStateActions>
                    )}
                  </EmptyState>
                </Bullseye>
              ) : (
                <Table aria-label="Users table" variant="compact">
                  <Thead>
                    <Tr>
                      <Th>
                        <Checkbox
                          id="select-all-users"
                          isChecked={
                            selectedUsers.size === users.length &&
                            users.length > 0
                          }
                          onChange={(_, checked) => handleSelectAll(checked)}
                          aria-label="Select all users"
                        />
                      </Th>
                      <Th {...getSortableProps('name')}>Name</Th>
                      <Th {...getSortableProps('username')}>Username</Th>
                      <Th {...getSortableProps('email')}>Email</Th>
                      <Th>Organization</Th>
                      <Th>Roles</Th>
                      <Th>Status</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {users.map((user) => (
                      <Tr key={user.id}>
                        <Td>
                          <Checkbox
                            id={`select-user-${user.id}`}
                            isChecked={selectedUsers.has(user.id)}
                            onChange={(_, checked) =>
                              handleSelectUser(user.id, checked)
                            }
                            aria-label={`Select user ${user.name || user.username}`}
                          />
                        </Td>
                        <Td dataLabel="Name">
                          <Button
                            variant="link"
                            isInline
                            onClick={() => navigate(`/admin/users/${user.id}`)}
                          >
                            {user.name || user.username}
                          </Button>
                        </Td>
                        <Td dataLabel="Username">{user.username}</Td>
                        <Td dataLabel="Email">
                          {user.email || (
                            <span className="pf-v6-u-color-200">No email</span>
                          )}
                        </Td>
                        <Td dataLabel="Organization">
                          {getUserOrganization(user)}
                        </Td>
                        <Td dataLabel="Roles">
                          <span title={getUserRoles(user)}>
                            {getUserRoles(user)}
                          </span>
                        </Td>
                        <Td dataLabel="Status">
                          <Split hasGutter>
                            <SplitItem>
                              <Badge color={user.enabled ? 'green' : 'red'}>
                                {user.enabled ? 'Enabled' : 'Disabled'}
                              </Badge>
                            </SplitItem>
                            <SplitItem>
                              <Switch
                                id={`status-${user.id}`}
                                isChecked={user.enabled}
                                onChange={(_, checked) =>
                                  handleStatusChange(user, checked)
                                }
                                isDisabled={toggleStatusMutation.isPending}
                                aria-label={`Toggle ${user.name || user.username} status`}
                              />
                            </SplitItem>
                          </Split>
                        </Td>
                        <Td dataLabel="Actions">
                          <ActionsColumn
                            items={[
                              {
                                title: 'View Details',
                                onClick: () =>
                                  navigate(`/admin/users/${user.id}`),
                              },
                              {
                                title: 'Edit',
                                onClick: () =>
                                  navigate(`/admin/users/${user.id}/edit`),
                              },
                              {
                                title: 'Manage Roles',
                                onClick: () =>
                                  navigate(`/admin/users/${user.id}/roles`),
                              },
                              { isSeparator: true },
                              {
                                title: 'Delete',
                                onClick: () => handleDelete(user),
                                isDisabled: deleteUserMutation.isPending,
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
        {users.length > 0 && pagination && (
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

export default Users;
