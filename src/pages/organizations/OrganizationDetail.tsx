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
  BuildingIcon,
  EditIcon,
  UsersIcon,
  NetworkIcon,
  CatalogIcon,
  PlusCircleIcon,
  ExternalLinkAltIcon,
  ChartAreaIcon,
} from '@patternfly/react-icons';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  useOrganization,
  useToggleOrganizationStatus,
  useOrganizationVDCs,
  useCatalogs,
  useUserPermissions,
} from '../../hooks';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { VDC, Catalog } from '../../types';
import { ROUTES } from '../../utils/constants';
import OrganizationForm from './OrganizationForm';

const OrganizationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTabKey, setActiveTabKey] = useState<string | number>(0);
  const [errorMessage, setErrorMessage] = useState('');
  const toggleStatusMutation = useToggleOrganizationStatus();

  // Check if this is the create route
  const isCreateMode = id === 'create';

  // Hooks must be called before any conditional returns, but skip organization fetch for create mode
  const {
    data: orgResponse,
    isLoading,
    error,
  } = useOrganization(isCreateMode ? '' : id || '');
  const { data: userPermissions } = useUserPermissions();

  // Use organization-scoped VDC access
  const { data: vdcsResponse } = useOrganizationVDCs();

  // Create permission guard for organization management
  const canManageThisOrg =
    userPermissions?.canManageSystem ||
    userPermissions?.canManageOrganization?.(id || '');
  const { data: catalogsResponse } = useCatalogs();

  // Early validation for id parameter (skip validation for create mode)
  if (!id) {
    return (
      <PageSection>
        <EmptyState icon={BuildingIcon}>
          <Title headingLevel="h4" size="lg">
            Invalid Organization
          </Title>
          <EmptyStateBody>
            No organization ID provided. Please select a valid organization.
          </EmptyStateBody>
          <Button
            variant="primary"
            onClick={() => navigate(ROUTES.ORGANIZATIONS)}
          >
            Back to Organizations
          </Button>
        </EmptyState>
      </PageSection>
    );
  }

  const organization = orgResponse?.data;
  const vdcs = vdcsResponse?.values || [];
  const catalogs = catalogsResponse?.values || [];

  const handleStatusToggle = async (enabled: boolean) => {
    if (!organization) return;
    try {
      await toggleStatusMutation.mutateAsync({ id: organization.id, enabled });
    } catch (error) {
      setErrorMessage(
        `Failed to toggle organization status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  // Handle create mode - use the OrganizationForm component
  if (isCreateMode) {
    return <OrganizationForm />;
  }

  if (isLoading) {
    return (
      <PageSection>
        <LoadingSpinner />
      </PageSection>
    );
  }

  if (error || !organization) {
    return (
      <PageSection>
        <EmptyState icon={BuildingIcon}>
          <Title headingLevel="h4" size="lg">
            Organization not found
          </Title>
          <EmptyStateBody>
            The organization you're looking for doesn't exist or you don't have
            permission to view it.
          </EmptyStateBody>
          <Button
            variant="primary"
            onClick={() => navigate(ROUTES.ORGANIZATIONS)}
          >
            Back to Organizations
          </Button>
        </EmptyState>
      </PageSection>
    );
  }

  const overviewTabContent = (
    <Grid hasGutter>
      <GridItem span={12} md={8}>
        <Card>
          <CardTitle>Organization Information</CardTitle>
          <CardBody>
            <DescriptionList isHorizontal>
              <DescriptionListGroup>
                <DescriptionListTerm>Name</DescriptionListTerm>
                <DescriptionListDescription>
                  {organization.name}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Display Name</DescriptionListTerm>
                <DescriptionListDescription>
                  {organization.displayName}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Description</DescriptionListTerm>
                <DescriptionListDescription>
                  {organization.description || (
                    <span className="pf-v6-u-color-200">
                      No description provided
                    </span>
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Status</DescriptionListTerm>
                <DescriptionListDescription>
                  <Split hasGutter>
                    <SplitItem>
                      <Badge color={organization.isEnabled ? 'green' : 'red'}>
                        {organization.isEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </SplitItem>
                    <SplitItem>
                      <Switch
                        id="org-status-toggle"
                        isChecked={organization.isEnabled}
                        onChange={(_, checked) => handleStatusToggle(checked)}
                        isDisabled={toggleStatusMutation.isPending}
                        aria-label="Toggle organization status"
                      />
                    </SplitItem>
                  </Split>
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </CardBody>
        </Card>
      </GridItem>

      <GridItem span={12} md={4}>
        <Stack hasGutter>
          <StackItem>
            <Card>
              <CardTitle>Quick Actions</CardTitle>
              <CardBody>
                <Stack hasGutter>
                  {canManageThisOrg && (
                    <StackItem>
                      <Button
                        variant="primary"
                        icon={<EditIcon />}
                        onClick={() =>
                          navigate(
                            ROUTES.ORGANIZATION_EDIT.replace(
                              ':id',
                              organization.id
                            )
                          )
                        }
                        isBlock
                      >
                        Edit Organization
                      </Button>
                    </StackItem>
                  )}
                  {canManageThisOrg && (
                    <StackItem>
                      <Button
                        variant="secondary"
                        icon={<UsersIcon />}
                        onClick={() =>
                          navigate(
                            ROUTES.ORGANIZATION_USERS.replace(
                              ':id',
                              organization.id
                            )
                          )
                        }
                        isBlock
                      >
                        Manage Users
                      </Button>
                    </StackItem>
                  )}
                  {canManageThisOrg && (
                    <StackItem>
                      <Button
                        variant="secondary"
                        icon={<PlusCircleIcon />}
                        onClick={() =>
                          navigate('/vdcs/create', {
                            state: { organizationId: organization.id },
                          })
                        }
                        isBlock
                      >
                        Create VDC
                      </Button>
                    </StackItem>
                  )}
                  <StackItem>
                    <Button
                      variant="link"
                      icon={<ChartAreaIcon />}
                      onClick={() =>
                        navigate(
                          ROUTES.ORGANIZATION_ANALYTICS.replace(
                            ':id',
                            organization.id
                          )
                        )
                      }
                      isBlock
                    >
                      View Analytics
                    </Button>
                  </StackItem>
                </Stack>
              </CardBody>
            </Card>
          </StackItem>

          <StackItem>
            <Card>
              <CardTitle>Resource Summary</CardTitle>
              <CardBody>
                <Stack hasGutter>
                  <StackItem>
                    <Split>
                      <SplitItem isFilled>
                        <Flex alignItems={{ default: 'alignItemsCenter' }}>
                          <FlexItem>
                            <Icon>
                              <NetworkIcon />
                            </Icon>
                          </FlexItem>
                          <FlexItem>Virtual Data Centers</FlexItem>
                        </Flex>
                      </SplitItem>
                      <SplitItem>
                        <strong>{vdcs.length}</strong>
                      </SplitItem>
                    </Split>
                  </StackItem>
                  <StackItem>
                    <Split>
                      <SplitItem isFilled>
                        <Flex alignItems={{ default: 'alignItemsCenter' }}>
                          <FlexItem>
                            <Icon>
                              <CatalogIcon />
                            </Icon>
                          </FlexItem>
                          <FlexItem>Catalogs</FlexItem>
                        </Flex>
                      </SplitItem>
                      <SplitItem>
                        <strong>{catalogs.length}</strong>
                      </SplitItem>
                    </Split>
                  </StackItem>
                </Stack>
              </CardBody>
            </Card>
          </StackItem>
        </Stack>
      </GridItem>
    </Grid>
  );

  const vdcsTabContent = (
    <Card>
      <CardTitle>
        <Split>
          <SplitItem isFilled>Virtual Data Centers</SplitItem>
          {canManageThisOrg && (
            <SplitItem>
              <Button
                variant="primary"
                size="sm"
                icon={<PlusCircleIcon />}
                onClick={() =>
                  navigate('/vdcs/create', {
                    state: { organizationId: organization.id },
                  })
                }
              >
                Create VDC
              </Button>
            </SplitItem>
          )}
        </Split>
      </CardTitle>
      <CardBody>
        {vdcs.length === 0 ? (
          <EmptyState icon={NetworkIcon}>
            <Title headingLevel="h4" size="lg">
              No Virtual Data Centers
            </Title>
            <EmptyStateBody>
              This organization doesn't have any VDCs yet.{' '}
              {canManageThisOrg
                ? 'Create one to get started.'
                : 'Contact an administrator to create VDCs.'}
            </EmptyStateBody>
            {canManageThisOrg && (
              <Button
                variant="primary"
                icon={<PlusCircleIcon />}
                onClick={() =>
                  navigate('/vdcs/create', {
                    state: { organizationId: organization.id },
                  })
                }
              >
                Create VDC
              </Button>
            )}
          </EmptyState>
        ) : (
          <Table aria-label="VDCs table" variant="compact">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Namespace</Th>
                <Th>Allocation Model</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {vdcs.map((vdc: VDC) => (
                <Tr key={vdc.id}>
                  <Td dataLabel="Name">
                    <Button
                      variant="link"
                      isInline
                      onClick={() => navigate(`/vdcs/${vdc.id}`)}
                    >
                      {vdc.name}
                    </Button>
                  </Td>
                  <Td dataLabel="Namespace">
                    <code>{vdc.id}</code>
                  </Td>
                  <Td dataLabel="Allocation Model">{vdc.allocationModel}</Td>
                  <Td dataLabel="Status">
                    <Badge color={vdc.isEnabled ? 'green' : 'red'}>
                      {vdc.isEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </Td>
                  <Td dataLabel="Created">
                    {vdc.creationDate
                      ? new Date(vdc.creationDate).toLocaleDateString()
                      : 'N/A'}
                  </Td>
                  <Td dataLabel="Actions">
                    <ActionsColumn
                      items={[
                        {
                          title: 'View Details',
                          onClick: () => navigate(`/vdcs/${vdc.id}`),
                        },
                        {
                          title: 'Edit',
                          onClick: () => navigate(`/vdcs/${vdc.id}/edit`),
                        },
                        {
                          title: 'View VMs',
                          onClick: () => navigate(`/vms?vdc=${vdc.id}`),
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
  );

  const catalogsTabContent = (
    <Card>
      <CardTitle>Catalogs</CardTitle>
      <CardBody>
        {catalogs.length === 0 ? (
          <EmptyState icon={CatalogIcon}>
            <Title headingLevel="h4" size="lg">
              No Catalogs
            </Title>
            <EmptyStateBody>
              This organization doesn't have any catalogs yet.
            </EmptyStateBody>
            <Button
              variant="link"
              icon={<ExternalLinkAltIcon />}
              onClick={() => navigate('/catalogs')}
            >
              Browse All Catalogs
            </Button>
          </EmptyState>
        ) : (
          <Table aria-label="Catalogs table" variant="compact">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Description</Th>
                <Th>Published</Th>
                <Th>Created</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {catalogs.map((catalog: Catalog) => (
                <Tr key={catalog.id}>
                  <Td dataLabel="Name">
                    <Button
                      variant="link"
                      isInline
                      onClick={() => navigate(`/catalogs/${catalog.id}`)}
                    >
                      {catalog.name}
                    </Button>
                  </Td>
                  <Td dataLabel="Description">
                    {catalog.description || (
                      <span className="pf-v6-u-color-200">No description</span>
                    )}
                  </Td>
                  <Td dataLabel="Published">
                    <Badge color={catalog.isPublished ? 'blue' : 'grey'}>
                      {catalog.isPublished ? 'Published' : 'Private'}
                    </Badge>
                  </Td>
                  <Td dataLabel="Created">
                    {catalog.creationDate
                      ? new Date(catalog.creationDate).toLocaleDateString()
                      : 'N/A'}
                  </Td>
                  <Td dataLabel="Actions">
                    <ActionsColumn
                      items={[
                        {
                          title: 'View Details',
                          onClick: () => navigate(`/catalogs/${catalog.id}`),
                        },
                        {
                          title: 'Browse Templates',
                          onClick: () =>
                            navigate(`/catalogs/${catalog.id}/templates`),
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
  );

  return (
    <PageSection>
      <Stack hasGutter>
        {/* Breadcrumb */}
        <StackItem>
          <Breadcrumb>
            <BreadcrumbItem>
              <Link to={ROUTES.ORGANIZATIONS}>Organizations</Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{organization.displayName}</BreadcrumbItem>
          </Breadcrumb>
        </StackItem>

        {/* Header */}
        <StackItem>
          <Split hasGutter>
            <SplitItem isFilled>
              <Stack>
                <StackItem>
                  <Title headingLevel="h1" size="xl">
                    {organization.displayName}
                  </Title>
                </StackItem>
                <StackItem>
                  <p className="pf-v6-u-color-200">
                    Organization: {organization.name}
                  </p>
                </StackItem>
              </Stack>
            </SplitItem>
            <SplitItem>
              <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                {canManageThisOrg && (
                  <FlexItem>
                    <Button
                      variant="secondary"
                      icon={<EditIcon />}
                      onClick={() =>
                        navigate(
                          ROUTES.ORGANIZATION_EDIT.replace(
                            ':id',
                            organization.id
                          )
                        )
                      }
                    >
                      Edit
                    </Button>
                  </FlexItem>
                )}
                {canManageThisOrg && (
                  <FlexItem>
                    <Button
                      variant="secondary"
                      icon={<UsersIcon />}
                      onClick={() =>
                        navigate(
                          ROUTES.ORGANIZATION_USERS.replace(
                            ':id',
                            organization.id
                          )
                        )
                      }
                    >
                      Manage Users
                    </Button>
                  </FlexItem>
                )}
              </Flex>
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

        {/* Status Alert */}
        {!organization.isEnabled && (
          <StackItem>
            <Alert
              variant={AlertVariant.warning}
              title="Organization is disabled"
              isInline
            >
              This organization is currently disabled. Users will not be able to
              access resources within this organization.
            </Alert>
          </StackItem>
        )}

        {/* Tabs */}
        <StackItem>
          <Tabs
            activeKey={activeTabKey}
            onSelect={(_, tabIndex) => setActiveTabKey(tabIndex)}
            aria-label="Organization details tabs"
          >
            <Tab
              eventKey={0}
              title={<TabTitleText>Overview</TabTitleText>}
              aria-label="Overview tab"
            >
              <TabContent id="overview-tab">{overviewTabContent}</TabContent>
            </Tab>
            <Tab
              eventKey={1}
              title={
                <TabTitleText>
                  Virtual Data Centers ({vdcs.length})
                </TabTitleText>
              }
              aria-label="VDCs tab"
            >
              <TabContent id="vdcs-tab">{vdcsTabContent}</TabContent>
            </Tab>
            <Tab
              eventKey={2}
              title={<TabTitleText>Catalogs ({catalogs.length})</TabTitleText>}
              aria-label="Catalogs tab"
            >
              <TabContent id="catalogs-tab">{catalogsTabContent}</TabContent>
            </Tab>
          </Tabs>
        </StackItem>
      </Stack>
    </PageSection>
  );
};

export default OrganizationDetail;
