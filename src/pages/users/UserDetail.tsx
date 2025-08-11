import React, { useState } from 'react';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  CardTitle,
  Grid,
  GridItem,
  Stack,
  StackItem,
  Split,
  SplitItem,
  Button,
  Badge,
  Switch,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Tabs,
  Tab,
  TabTitleText,
  TabContent,
  EmptyState,
  EmptyStateBody,
  Alert,
  AlertVariant,
  Breadcrumb,
  BreadcrumbItem,
  Flex,
  FlexItem,
  Icon,
  Label,
  LabelGroup,
} from '@patternfly/react-core';
import {
  UserIcon,
  EditIcon,
  KeyIcon,
  BuildingIcon,
  ExternalLinkAltIcon,
  ChartAreaIcon,
  CalendarAltIcon,
} from '@patternfly/react-icons';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useUser, useToggleUserStatus } from '../../hooks/useUsers';
import { useOrganizations } from '../../hooks';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useRole } from '../../hooks/useRole';
import UserForm from './UserForm';
import UserRoleManager from './UserRoleManager';
import UserOrganizationManager from './UserOrganizationManager';
import { sanitizeErrorForUser } from '../../utils/errorSanitization';

const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTabKey, setActiveTabKey] = useState<string | number>(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isRoleManagerOpen, setIsRoleManagerOpen] = useState(false);
  const [isOrgManagerOpen, setIsOrgManagerOpen] = useState(false);
  const toggleStatusMutation = useToggleUserStatus();

  // Check if this is the create route
  const isCreateMode = id === 'create';

  // Permission checks
  const { capabilities } = useRole();
  const canManageUsers = capabilities?.canManageUsers ?? false;

  // Hooks must be called before any conditional returns, but skip user fetch for create mode
  const {
    data: userResponse,
    isLoading,
    error,
  } = useUser(isCreateMode ? '' : id || '');

  const { data: organizationsResponse } = useOrganizations();

  const user = userResponse?.data;
  const organizations = organizationsResponse?.data || [];

  // Early validation for id parameter (skip validation for create mode)
  if (!id) {
    return (
      <PageSection>
        <EmptyState icon={UserIcon}>
          <Title headingLevel="h4" size="lg">
            Invalid User
          </Title>
          <EmptyStateBody>No user ID provided in the URL.</EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  // Handle create mode by showing the form
  if (isCreateMode) {
    return <UserForm />;
  }

  // Handle edit mode
  if (isEditMode && user) {
    return (
      <UserForm
        initialData={user}
        onCancel={() => setIsEditMode(false)}
        onSuccess={() => setIsEditMode(false)}
      />
    );
  }

  if (isLoading) {
    return (
      <PageSection>
        <LoadingSpinner />
      </PageSection>
    );
  }

  if (error || !user) {
    return (
      <PageSection>
        <EmptyState icon={UserIcon}>
          <Title headingLevel="h4" size="lg">
            User Not Found
          </Title>
          <EmptyStateBody>
            The requested user could not be found or you don't have permission
            to view it.
          </EmptyStateBody>
          <Button variant="primary" onClick={() => navigate('/admin/users')}>
            Back to Users
          </Button>
        </EmptyState>
      </PageSection>
    );
  }

  const handleStatusToggle = async (enabled: boolean) => {
    try {
      await toggleStatusMutation.mutateAsync({ id: user.id, enabled });
    } catch (error) {
      setErrorMessage(
        `Failed to toggle user status: ${sanitizeErrorForUser(error)}`
      );
    }
  };

  const getUserOrganization = () => {
    if (!user.orgEntityRef) return null;
    return (
      organizations.find((org) => org.id === user.orgEntityRef?.id) || {
        id: user.orgEntityRef.id,
        name: user.orgEntityRef.name,
        displayName: user.orgEntityRef.name,
      }
    );
  };

  const handleTabClick = (
    _event: React.MouseEvent<HTMLElement> | React.KeyboardEvent | MouseEvent,
    tabIndex: string | number
  ) => {
    setActiveTabKey(tabIndex);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const userOrganization = getUserOrganization();

  return (
    <PageSection>
      <Stack hasGutter>
        {/* Breadcrumb */}
        <StackItem>
          <Breadcrumb>
            <BreadcrumbItem>
              <Link to="/admin">Administration</Link>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <Link to="/admin/users">Users</Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>
              {user.name || user.fullName || user.username}
            </BreadcrumbItem>
          </Breadcrumb>
        </StackItem>

        {/* Header */}
        <StackItem>
          <Split hasGutter>
            <SplitItem isFilled>
              <Flex
                direction={{ default: 'column' }}
                spaceItems={{ default: 'spaceItemsSm' }}
              >
                <FlexItem>
                  <Flex
                    spaceItems={{ default: 'spaceItemsSm' }}
                    alignItems={{ default: 'alignItemsCenter' }}
                  >
                    <FlexItem>
                      <Icon size="xl">
                        <UserIcon />
                      </Icon>
                    </FlexItem>
                    <FlexItem>
                      <Title headingLevel="h1" size="2xl">
                        {user.name || user.fullName || user.username}
                      </Title>
                    </FlexItem>
                    <FlexItem>
                      <Badge color={user.enabled ? 'green' : 'red'}>
                        {user.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </FlexItem>
                  </Flex>
                </FlexItem>
                <FlexItem>
                  <span className="pf-v6-u-color-200">
                    {user.email || 'No email address'}
                  </span>
                </FlexItem>
              </Flex>
            </SplitItem>
            {canManageUsers && (
              <SplitItem>
                <Flex spaceItems={{ default: 'spaceItemsMd' }}>
                  <FlexItem>
                    <Switch
                      id="user-status-toggle"
                      label="Enabled"
                      isChecked={user.enabled}
                      onChange={(_, checked) => handleStatusToggle(checked)}
                      isDisabled={toggleStatusMutation.isPending}
                    />
                  </FlexItem>
                  <FlexItem>
                    <Button
                      variant="secondary"
                      icon={<EditIcon />}
                      onClick={() => setIsEditMode(true)}
                    >
                      Edit User
                    </Button>
                  </FlexItem>
                </Flex>
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

        {/* Tabs */}
        <StackItem>
          <Card>
            <CardBody>
              <Tabs
                activeKey={activeTabKey}
                onSelect={handleTabClick}
                isBox={false}
              >
                <Tab
                  eventKey={0}
                  title={<TabTitleText>Overview</TabTitleText>}
                  aria-label="User overview tab"
                >
                  <TabContent
                    eventKey={0}
                    id="overview-tab"
                    hidden={activeTabKey !== 0}
                  >
                    <Grid hasGutter>
                      {/* Basic Information */}
                      <GridItem span={6}>
                        <Card>
                          <CardTitle>Basic Information</CardTitle>
                          <CardBody>
                            <DescriptionList>
                              <DescriptionListGroup>
                                <DescriptionListTerm>
                                  Username
                                </DescriptionListTerm>
                                <DescriptionListDescription>
                                  {user.username}
                                </DescriptionListDescription>
                              </DescriptionListGroup>
                              <DescriptionListGroup>
                                <DescriptionListTerm>
                                  Full Name
                                </DescriptionListTerm>
                                <DescriptionListDescription>
                                  {user.name || user.fullName || (
                                    <span className="pf-v6-u-color-200">
                                      Not specified
                                    </span>
                                  )}
                                </DescriptionListDescription>
                              </DescriptionListGroup>
                              <DescriptionListGroup>
                                <DescriptionListTerm>Email</DescriptionListTerm>
                                <DescriptionListDescription>
                                  {user.email || (
                                    <span className="pf-v6-u-color-200">
                                      Not specified
                                    </span>
                                  )}
                                </DescriptionListDescription>
                              </DescriptionListGroup>
                              <DescriptionListGroup>
                                <DescriptionListTerm>
                                  Status
                                </DescriptionListTerm>
                                <DescriptionListDescription>
                                  <Badge color={user.enabled ? 'green' : 'red'}>
                                    {user.enabled ? 'Enabled' : 'Disabled'}
                                  </Badge>
                                </DescriptionListDescription>
                              </DescriptionListGroup>
                              <DescriptionListGroup>
                                <DescriptionListTerm>
                                  User ID
                                </DescriptionListTerm>
                                <DescriptionListDescription>
                                  <span className="pf-v6-u-font-family-monospace">
                                    {user.id}
                                  </span>
                                </DescriptionListDescription>
                              </DescriptionListGroup>
                            </DescriptionList>
                          </CardBody>
                        </Card>
                      </GridItem>

                      {/* Organization & Roles */}
                      <GridItem span={6}>
                        <Card>
                          <CardTitle>Organization & Roles</CardTitle>
                          <CardBody>
                            <DescriptionList>
                              <DescriptionListGroup>
                                <DescriptionListTerm>
                                  Organization
                                </DescriptionListTerm>
                                <DescriptionListDescription>
                                  {userOrganization ? (
                                    <Flex
                                      spaceItems={{ default: 'spaceItemsSm' }}
                                      alignItems={{
                                        default: 'alignItemsCenter',
                                      }}
                                    >
                                      <FlexItem>
                                        <Icon>
                                          <BuildingIcon />
                                        </Icon>
                                      </FlexItem>
                                      <FlexItem>
                                        <Button
                                          variant="link"
                                          isInline
                                          onClick={() =>
                                            navigate(
                                              `/organizations/${userOrganization.id}`
                                            )
                                          }
                                        >
                                          {userOrganization.displayName ||
                                            userOrganization.name}
                                        </Button>
                                      </FlexItem>
                                    </Flex>
                                  ) : (
                                    <span className="pf-v6-u-color-200">
                                      No organization assigned
                                    </span>
                                  )}
                                </DescriptionListDescription>
                              </DescriptionListGroup>
                              <DescriptionListGroup>
                                <DescriptionListTerm>Roles</DescriptionListTerm>
                                <DescriptionListDescription>
                                  {user.roleEntityRefs &&
                                  user.roleEntityRefs.length > 0 ? (
                                    <LabelGroup>
                                      {user.roleEntityRefs.map(
                                        (role, index) => (
                                          <Label
                                            key={index}
                                            color="blue"
                                            icon={<KeyIcon />}
                                          >
                                            {role.name}
                                          </Label>
                                        )
                                      )}
                                    </LabelGroup>
                                  ) : (
                                    <span className="pf-v6-u-color-200">
                                      No roles assigned
                                    </span>
                                  )}
                                </DescriptionListDescription>
                              </DescriptionListGroup>
                            </DescriptionList>
                          </CardBody>
                        </Card>
                      </GridItem>

                      {/* Account Details */}
                      <GridItem span={6}>
                        <Card>
                          <CardTitle>Account Details</CardTitle>
                          <CardBody>
                            <DescriptionList>
                              <DescriptionListGroup>
                                <DescriptionListTerm>
                                  Created Date
                                </DescriptionListTerm>
                                <DescriptionListDescription>
                                  <Flex
                                    spaceItems={{ default: 'spaceItemsSm' }}
                                    alignItems={{ default: 'alignItemsCenter' }}
                                  >
                                    <FlexItem>
                                      <Icon>
                                        <CalendarAltIcon />
                                      </Icon>
                                    </FlexItem>
                                    <FlexItem>
                                      {formatDate(user.createdDate)}
                                    </FlexItem>
                                  </Flex>
                                </DescriptionListDescription>
                              </DescriptionListGroup>
                              <DescriptionListGroup>
                                <DescriptionListTerm>
                                  Last Modified
                                </DescriptionListTerm>
                                <DescriptionListDescription>
                                  <Flex
                                    spaceItems={{ default: 'spaceItemsSm' }}
                                    alignItems={{ default: 'alignItemsCenter' }}
                                  >
                                    <FlexItem>
                                      <Icon>
                                        <CalendarAltIcon />
                                      </Icon>
                                    </FlexItem>
                                    <FlexItem>
                                      {formatDate(user.lastModified)}
                                    </FlexItem>
                                  </Flex>
                                </DescriptionListDescription>
                              </DescriptionListGroup>
                              <DescriptionListGroup>
                                <DescriptionListTerm>
                                  Last Login
                                </DescriptionListTerm>
                                <DescriptionListDescription>
                                  <Flex
                                    spaceItems={{ default: 'spaceItemsSm' }}
                                    alignItems={{ default: 'alignItemsCenter' }}
                                  >
                                    <FlexItem>
                                      <Icon>
                                        <CalendarAltIcon />
                                      </Icon>
                                    </FlexItem>
                                    <FlexItem>
                                      {formatDate(user.lastLogin)}
                                    </FlexItem>
                                  </Flex>
                                </DescriptionListDescription>
                              </DescriptionListGroup>
                            </DescriptionList>
                          </CardBody>
                        </Card>
                      </GridItem>

                      {/* Quick Actions */}
                      <GridItem span={6}>
                        <Card>
                          <CardTitle>Quick Actions</CardTitle>
                          <CardBody>
                            <Stack hasGutter>
                              {canManageUsers && (
                                <>
                                  <StackItem>
                                    <Button
                                      variant="secondary"
                                      icon={<KeyIcon />}
                                      onClick={() => setIsRoleManagerOpen(true)}
                                      isBlock
                                    >
                                      Manage Roles
                                    </Button>
                                  </StackItem>
                                  <StackItem>
                                    <Button
                                      variant="secondary"
                                      icon={<BuildingIcon />}
                                      onClick={() => setIsOrgManagerOpen(true)}
                                      isBlock
                                    >
                                      Change Organization
                                    </Button>
                                  </StackItem>
                                  <StackItem>
                                    <Button
                                      variant="secondary"
                                      icon={<EditIcon />}
                                      onClick={() => setIsEditMode(true)}
                                      isBlock
                                    >
                                      Edit Profile
                                    </Button>
                                  </StackItem>
                                </>
                              )}
                              {userOrganization && (
                                <StackItem>
                                  <Button
                                    variant="link"
                                    icon={<ExternalLinkAltIcon />}
                                    onClick={() =>
                                      navigate(
                                        `/organizations/${userOrganization.id}`
                                      )
                                    }
                                    isBlock
                                  >
                                    View Organization
                                  </Button>
                                </StackItem>
                              )}
                            </Stack>
                          </CardBody>
                        </Card>
                      </GridItem>
                    </Grid>
                  </TabContent>
                </Tab>

                <Tab
                  eventKey={1}
                  title={<TabTitleText>Permissions</TabTitleText>}
                  aria-label="User permissions tab"
                >
                  <TabContent
                    eventKey={1}
                    id="permissions-tab"
                    hidden={activeTabKey !== 1}
                  >
                    <Card>
                      <CardTitle>Role Permissions</CardTitle>
                      <CardBody>
                        {user.roleEntityRefs &&
                        user.roleEntityRefs.length > 0 ? (
                          <Stack hasGutter>
                            {user.roleEntityRefs.map((role, index) => (
                              <StackItem key={index}>
                                <Card>
                                  <CardTitle>
                                    <Flex
                                      spaceItems={{ default: 'spaceItemsSm' }}
                                      alignItems={{
                                        default: 'alignItemsCenter',
                                      }}
                                    >
                                      <FlexItem>
                                        <Icon>
                                          <KeyIcon />
                                        </Icon>
                                      </FlexItem>
                                      <FlexItem>{role.name}</FlexItem>
                                    </Flex>
                                  </CardTitle>
                                  <CardBody>
                                    <DescriptionList>
                                      <DescriptionListGroup>
                                        <DescriptionListTerm>
                                          Role ID
                                        </DescriptionListTerm>
                                        <DescriptionListDescription>
                                          <span className="pf-v6-u-font-family-monospace">
                                            {role.id}
                                          </span>
                                        </DescriptionListDescription>
                                      </DescriptionListGroup>
                                      <DescriptionListGroup>
                                        <DescriptionListTerm>
                                          Description
                                        </DescriptionListTerm>
                                        <DescriptionListDescription>
                                          {role.name ===
                                            'System Administrator' &&
                                            'Full system access and organization management'}
                                          {role.name ===
                                            'Organization Administrator' &&
                                            'Full access within assigned organization'}
                                          {role.name === 'vApp User' &&
                                            'Basic user access to assigned vApps'}
                                          {![
                                            'System Administrator',
                                            'Organization Administrator',
                                            'vApp User',
                                          ].includes(role.name) &&
                                            'Custom role with specific permissions'}
                                        </DescriptionListDescription>
                                      </DescriptionListGroup>
                                    </DescriptionList>
                                  </CardBody>
                                </Card>
                              </StackItem>
                            ))}
                          </Stack>
                        ) : (
                          <EmptyState icon={KeyIcon}>
                            <Title headingLevel="h4" size="lg">
                              No Roles Assigned
                            </Title>
                            <EmptyStateBody>
                              This user has no roles assigned. Contact your
                              administrator to assign appropriate roles.
                            </EmptyStateBody>
                          </EmptyState>
                        )}
                      </CardBody>
                    </Card>
                  </TabContent>
                </Tab>

                <Tab
                  eventKey={2}
                  title={<TabTitleText>Activity</TabTitleText>}
                  aria-label="User activity tab"
                >
                  <TabContent
                    eventKey={2}
                    id="activity-tab"
                    hidden={activeTabKey !== 2}
                  >
                    <Card>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardBody>
                        <EmptyState icon={ChartAreaIcon}>
                          <Title headingLevel="h4" size="lg">
                            Activity Tracking Coming Soon
                          </Title>
                          <EmptyStateBody>
                            User activity tracking and audit logs will be
                            available in a future update.
                          </EmptyStateBody>
                        </EmptyState>
                      </CardBody>
                    </Card>
                  </TabContent>
                </Tab>
              </Tabs>
            </CardBody>
          </Card>
        </StackItem>

        {/* Role Manager Modal */}
        {user && (
          <UserRoleManager
            user={user}
            isOpen={isRoleManagerOpen}
            onClose={() => setIsRoleManagerOpen(false)}
            onSuccess={() => {
              setIsRoleManagerOpen(false);
              // Optionally show success message
            }}
          />
        )}

        {/* Organization Manager Modal */}
        {user && (
          <UserOrganizationManager
            user={user}
            isOpen={isOrgManagerOpen}
            onClose={() => setIsOrgManagerOpen(false)}
            onSuccess={() => {
              setIsOrgManagerOpen(false);
              // Optionally show success message
            }}
          />
        )}
      </Stack>
    </PageSection>
  );
};

export default UserDetail;
