import React, { useState } from 'react';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  Stack,
  StackItem,
  Split,
  SplitItem,
  Button,
  Badge,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  SearchInput,
  EmptyState,
  EmptyStateBody,
  EmptyStateActions,
  Bullseye,
  Breadcrumb,
  BreadcrumbItem,
  Modal,
  ModalVariant,
  Form,
  FormGroup,
  TextInput,
  FormSelect,
  FormSelectOption,
  Alert,
  AlertVariant,
  Pagination,
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  ActionGroup,
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
} from '@patternfly/react-icons';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useOrganization } from '../../hooks';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { User } from '../../types';

// Mock user data - in real implementation, this would come from API
interface OrganizationUser extends User {
  role: 'admin' | 'user' | 'viewer';
  joined_at: string;
  last_active: string;
  status: 'active' | 'inactive' | 'invited';
}

const mockUsers: OrganizationUser[] = [
  {
    id: '1',
    username: 'admin@example.com',
    email: 'admin@example.com',
    first_name: 'John',
    last_name: 'Administrator',
    role: 'admin',
    joined_at: '2024-01-01T00:00:00Z',
    last_active: '2024-01-15T10:30:00Z',
    status: 'active',
  },
  {
    id: '2',
    username: 'user@example.com',
    email: 'user@example.com',
    first_name: 'Jane',
    last_name: 'User',
    role: 'user',
    joined_at: '2024-01-02T00:00:00Z',
    last_active: '2024-01-14T15:45:00Z',
    status: 'active',
  },
  {
    id: '3',
    username: 'viewer@example.com',
    email: 'viewer@example.com',
    first_name: 'Bob',
    last_name: 'Viewer',
    role: 'viewer',
    joined_at: '2024-01-03T00:00:00Z',
    last_active: '2024-01-13T09:15:00Z',
    status: 'inactive',
  },
];

const OrganizationUsers: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Component state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [isRoleFilterOpen, setIsRoleFilterOpen] = useState(false);
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);

  // Modal states
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<OrganizationUser | null>(
    null
  );

  // Form states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [editRole, setEditRole] = useState('');

  const { data: orgResponse, isLoading } = useOrganization(id!);
  const organization = orgResponse?.data;

  // Filter and sort users
  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus =
      statusFilter === 'all' || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue: string, bValue: string;

    switch (sortBy) {
      case 'name':
        aValue = `${a.first_name} ${a.last_name}`;
        bValue = `${b.first_name} ${b.last_name}`;
        break;
      case 'email':
        aValue = a.email;
        bValue = b.email;
        break;
      case 'role':
        aValue = a.role;
        bValue = b.role;
        break;
      case 'joined_at':
        aValue = a.joined_at;
        bValue = b.joined_at;
        break;
      default:
        aValue = a.email;
        bValue = b.email;
    }

    const comparison = aValue.localeCompare(bValue);
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const paginatedUsers = sortedUsers.slice(
    (page - 1) * perPage,
    page * perPage
  );

  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(columnKey);
      setSortDirection('asc');
    }
    setPage(1);
  };

  const handleInviteUser = () => {
    if (!inviteEmail) {
      alert('Email is required');
      return;
    }

    if (!inviteEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    // TODO: Implement actual user invitation API call
    console.log('Inviting user:', { email: inviteEmail, role: inviteRole });

    // Reset form and close modal
    setInviteEmail('');
    setInviteRole('user');
    setIsInviteModalOpen(false);
  };

  const handleEditUser = (user: OrganizationUser) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setIsEditModalOpen(true);
  };

  const handleUpdateUserRole = () => {
    if (!selectedUser) return;

    // TODO: Implement actual user role update API call
    console.log('Updating user role:', {
      userId: selectedUser.id,
      role: editRole,
    });

    // Reset and close modal
    setSelectedUser(null);
    setEditRole('');
    setIsEditModalOpen(false);
  };

  const handleRemoveUser = (user: OrganizationUser) => {
    if (
      window.confirm(
        `Are you sure you want to remove ${user.first_name} ${user.last_name} from this organization?`
      )
    ) {
      // TODO: Implement actual user removal API call
      console.log('Removing user:', user.id);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'red';
      case 'user':
        return 'blue';
      case 'viewer':
        return 'grey';
      default:
        return 'grey';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'inactive':
        return 'orange';
      case 'invited':
        return 'blue';
      default:
        return 'grey';
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

  if (!organization) {
    return (
      <PageSection>
        <EmptyState icon={UsersIcon}>
          <Title headingLevel="h4" size="lg">
            Organization not found
          </Title>
          <EmptyStateBody>
            The organization you're looking for doesn't exist.
          </EmptyStateBody>
          <Button variant="primary" onClick={() => navigate('/organizations')}>
            Back to Organizations
          </Button>
        </EmptyState>
      </PageSection>
    );
  }

  return (
    <PageSection>
      <Stack hasGutter>
        {/* Breadcrumb */}
        <StackItem>
          <Breadcrumb>
            <BreadcrumbItem>
              <Link to="/organizations">Organizations</Link>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <Link to={`/organizations/${id}`}>
                {organization.display_name}
              </Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>User Management</BreadcrumbItem>
          </Breadcrumb>
        </StackItem>

        {/* Header */}
        <StackItem>
          <Split hasGutter>
            <SplitItem isFilled>
              <Title headingLevel="h1" size="xl">
                User Management
              </Title>
              <p className="pf-v6-u-color-200">
                Manage users and roles for {organization.display_name}
              </p>
            </SplitItem>
            <SplitItem>
              <Button
                variant="primary"
                icon={<PlusCircleIcon />}
                onClick={() => setIsInviteModalOpen(true)}
              >
                Invite User
              </Button>
            </SplitItem>
          </Split>
        </StackItem>

        {/* Toolbar */}
        <StackItem>
          <Card>
            <CardBody>
              <Toolbar>
                <ToolbarContent>
                  <ToolbarItem width="300px">
                    <SearchInput
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(_, value) => setSearchTerm(value)}
                      onClear={() => setSearchTerm('')}
                      aria-label="Search users"
                    />
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
                          Role:{' '}
                          {roleFilter === 'all'
                            ? 'All'
                            : roleFilter.charAt(0).toUpperCase() +
                              roleFilter.slice(1)}
                        </MenuToggle>
                      )}
                    >
                      <DropdownList>
                        <DropdownItem onClick={() => setRoleFilter('all')}>
                          All Roles
                        </DropdownItem>
                        <DropdownItem onClick={() => setRoleFilter('admin')}>
                          Admin
                        </DropdownItem>
                        <DropdownItem onClick={() => setRoleFilter('user')}>
                          User
                        </DropdownItem>
                        <DropdownItem onClick={() => setRoleFilter('viewer')}>
                          Viewer
                        </DropdownItem>
                      </DropdownList>
                    </Dropdown>
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
                          Status:{' '}
                          {statusFilter === 'all'
                            ? 'All'
                            : statusFilter.charAt(0).toUpperCase() +
                              statusFilter.slice(1)}
                        </MenuToggle>
                      )}
                    >
                      <DropdownList>
                        <DropdownItem onClick={() => setStatusFilter('all')}>
                          All Statuses
                        </DropdownItem>
                        <DropdownItem onClick={() => setStatusFilter('active')}>
                          Active
                        </DropdownItem>
                        <DropdownItem
                          onClick={() => setStatusFilter('inactive')}
                        >
                          Inactive
                        </DropdownItem>
                        <DropdownItem
                          onClick={() => setStatusFilter('invited')}
                        >
                          Invited
                        </DropdownItem>
                      </DropdownList>
                    </Dropdown>
                  </ToolbarItem>
                  <ToolbarItem align={{ default: 'alignEnd' }}>
                    <Pagination
                      page={page}
                      perPage={perPage}
                      itemCount={sortedUsers.length}
                      onSetPage={(_, newPage) => setPage(newPage)}
                      onPerPageSelect={(_, newPerPage) => {
                        setPerPage(newPerPage);
                        setPage(1);
                      }}
                      variant="top"
                      isCompact
                    />
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
              {paginatedUsers.length === 0 ? (
                <Bullseye>
                  <EmptyState icon={searchTerm ? SearchIcon : UsersIcon}>
                    <Title headingLevel="h4" size="lg">
                      {searchTerm ? 'No matching users' : 'No users found'}
                    </Title>
                    <EmptyStateBody>
                      {searchTerm
                        ? 'Try adjusting your search criteria or filters.'
                        : 'Get started by inviting your first user to this organization.'}
                    </EmptyStateBody>
                    {!searchTerm && (
                      <EmptyStateActions>
                        <Button
                          variant="primary"
                          icon={<PlusCircleIcon />}
                          onClick={() => setIsInviteModalOpen(true)}
                        >
                          Invite User
                        </Button>
                      </EmptyStateActions>
                    )}
                  </EmptyState>
                </Bullseye>
              ) : (
                <Table aria-label="Organization users table" variant="compact">
                  <Thead>
                    <Tr>
                      <Th {...getSortableProps('name')}>Name</Th>
                      <Th {...getSortableProps('email')}>Email</Th>
                      <Th {...getSortableProps('role')}>Role</Th>
                      <Th>Status</Th>
                      <Th {...getSortableProps('joined_at')}>Joined</Th>
                      <Th>Last Active</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {paginatedUsers.map((user) => (
                      <Tr key={user.id}>
                        <Td dataLabel="Name">
                          {user.first_name} {user.last_name}
                        </Td>
                        <Td dataLabel="Email">{user.email}</Td>
                        <Td dataLabel="Role">
                          <Badge color={getRoleBadgeColor(user.role)}>
                            {user.role.charAt(0).toUpperCase() +
                              user.role.slice(1)}
                          </Badge>
                        </Td>
                        <Td dataLabel="Status">
                          <Badge color={getStatusBadgeColor(user.status)}>
                            {user.status.charAt(0).toUpperCase() +
                              user.status.slice(1)}
                          </Badge>
                        </Td>
                        <Td dataLabel="Joined">
                          {new Date(user.joined_at).toLocaleDateString()}
                        </Td>
                        <Td dataLabel="Last Active">
                          {new Date(user.last_active).toLocaleDateString()}
                        </Td>
                        <Td dataLabel="Actions">
                          <ActionsColumn
                            items={[
                              {
                                title: 'Edit Role',
                                onClick: () => handleEditUser(user),
                              },
                              {
                                title: 'View Profile',
                                onClick: () => navigate(`/users/${user.id}`),
                              },
                              { isSeparator: true },
                              {
                                title: 'Remove from Organization',
                                onClick: () => handleRemoveUser(user),
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
        {paginatedUsers.length > 0 && (
          <StackItem>
            <Pagination
              page={page}
              perPage={perPage}
              itemCount={sortedUsers.length}
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

      {/* Invite User Modal */}
      <Modal
        variant={ModalVariant.small}
        title="Invite User to Organization"
        isOpen={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false);
          setInviteEmail('');
          setInviteRole('user');
        }}
      >
        <Form>
          <FormGroup label="Email Address" isRequired fieldId="invite-email">
            <TextInput
              isRequired
              type="email"
              id="invite-email"
              value={inviteEmail}
              onChange={(_, value) => setInviteEmail(value)}
              placeholder="user@example.com"
            />
          </FormGroup>
          <FormGroup label="Role" isRequired fieldId="invite-role">
            <FormSelect
              value={inviteRole}
              onChange={(_, value) => setInviteRole(value)}
              id="invite-role"
              aria-label="Select role"
            >
              <FormSelectOption
                value="admin"
                label="Admin - Full organization access"
              />
              <FormSelectOption
                value="user"
                label="User - Can manage resources"
              />
              <FormSelectOption
                value="viewer"
                label="Viewer - Read-only access"
              />
            </FormSelect>
          </FormGroup>
          <Alert
            variant={AlertVariant.info}
            title="Invitation details"
            isInline
          >
            The user will receive an email invitation to join this organization
            with the selected role.
          </Alert>
          <ActionGroup>
            <Button key="invite" variant="primary" onClick={handleInviteUser}>
              Send Invitation
            </Button>
            <Button
              key="cancel"
              variant="link"
              onClick={() => {
                setIsInviteModalOpen(false);
                setInviteEmail('');
                setInviteRole('user');
              }}
            >
              Cancel
            </Button>
          </ActionGroup>
        </Form>
      </Modal>

      {/* Edit User Role Modal */}
      <Modal
        variant={ModalVariant.small}
        title={`Edit Role for ${selectedUser?.first_name} ${selectedUser?.last_name}`}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
          setEditRole('');
        }}
      >
        <Form>
          <FormGroup label="Current Role" fieldId="current-role">
            <Badge color={getRoleBadgeColor(selectedUser?.role || '')}>
              {selectedUser?.role?.charAt(0).toUpperCase()}
              {selectedUser?.role?.slice(1)}
            </Badge>
          </FormGroup>
          <FormGroup label="New Role" isRequired fieldId="edit-role">
            <FormSelect
              value={editRole}
              onChange={(_, value) => setEditRole(value)}
              id="edit-role"
              aria-label="Select new role"
            >
              <FormSelectOption
                value="admin"
                label="Admin - Full organization access"
              />
              <FormSelectOption
                value="user"
                label="User - Can manage resources"
              />
              <FormSelectOption
                value="viewer"
                label="Viewer - Read-only access"
              />
            </FormSelect>
          </FormGroup>
          <Alert
            variant={AlertVariant.warning}
            title="Role change warning"
            isInline
          >
            Changing a user's role will immediately affect their permissions
            within this organization.
          </Alert>
          <ActionGroup>
            <Button
              key="update"
              variant="primary"
              onClick={handleUpdateUserRole}
            >
              Update Role
            </Button>
            <Button
              key="cancel"
              variant="link"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedUser(null);
                setEditRole('');
              }}
            >
              Cancel
            </Button>
          </ActionGroup>
        </Form>
      </Modal>
    </PageSection>
  );
};

export default OrganizationUsers;
