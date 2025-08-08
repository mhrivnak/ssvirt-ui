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
  Stack,
  StackItem,
  Gallery,
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
  Bullseye,
  Breadcrumb,
  BreadcrumbItem,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
} from '@patternfly/react-core';
import {
  ChartAreaIcon,
  PlusIcon,
  FilterIcon,
  EyeIcon,
  EditIcon,
  CopyIcon,
  TrashIcon,
} from '@patternfly/react-icons';
import { Link } from 'react-router-dom';
import {
  useCustomDashboards,
  useCreateCustomDashboard,
  useUpdateCustomDashboard,
  useDeleteCustomDashboard,
  useCloneCustomDashboard,
} from '../../hooks/useMonitoring';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ROUTES } from '../../utils/constants';
import type { MenuToggleElement } from '@patternfly/react-core';
import type { CustomDashboard } from '../../types';

const CustomDashboards: React.FC = () => {
  // Search and filter state
  const [searchValue, setSearchValue] = useState('');
  const [filterShared, setFilterShared] = useState<string>('');

  // UI state
  const [isSharedFilterOpen, setIsSharedFilterOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDashboard, setEditingDashboard] =
    useState<CustomDashboard | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dashboardToDelete, setDashboardToDelete] = useState<string | null>(
    null
  );
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [dashboardToClone, setDashboardToClone] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [cloneName, setCloneName] = useState('');

  // Create/edit dashboard form state
  const [dashboardName, setDashboardName] = useState('');
  const [dashboardDescription, setDashboardDescription] = useState('');
  const [dashboardShared, setDashboardShared] = useState(false);
  const [dashboardDefault, setDashboardDefault] = useState(false);

  // Build query parameters
  const queryParams = {
    is_shared: filterShared ? filterShared === 'true' : undefined,
  };

  const {
    data: dashboardsResponse,
    isLoading,
    error,
  } = useCustomDashboards(queryParams);
  const createDashboardMutation = useCreateCustomDashboard();
  const updateDashboardMutation = useUpdateCustomDashboard();
  const deleteDashboardMutation = useDeleteCustomDashboard();
  const cloneDashboardMutation = useCloneCustomDashboard();

  const handleSearch = (value: string) => {
    setSearchValue(value);
  };

  const handleSharedFilterChange = (value: string) => {
    setFilterShared(value);
    setIsSharedFilterOpen(false);
  };

  const clearFilters = () => {
    setSearchValue('');
    setFilterShared('');
  };

  const handleCreateDashboard = async () => {
    if (!dashboardName) return;

    try {
      await createDashboardMutation.mutateAsync({
        name: dashboardName,
        description: dashboardDescription,
        layout: {
          columns: 12,
          row_height: 150,
          margin: [10, 10],
          container_padding: [10, 10],
          breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
          responsive: true,
        },
        widgets: [],
        is_shared: dashboardShared,
        is_default: dashboardDefault,
      });

      resetForm();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create dashboard:', error);
    }
  };

  const handleUpdateDashboard = async () => {
    if (!editingDashboard || !dashboardName) return;

    try {
      await updateDashboardMutation.mutateAsync({
        dashboardId: editingDashboard.id,
        updates: {
          name: dashboardName,
          description: dashboardDescription,
          is_shared: dashboardShared,
          is_default: dashboardDefault,
        },
      });

      resetForm();
      setEditingDashboard(null);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to update dashboard:', error);
    }
  };

  const handleDeleteDashboard = (dashboardId: string) => {
    setDashboardToDelete(dashboardId);
    setShowDeleteModal(true);
  };

  const confirmDeleteDashboard = async () => {
    if (!dashboardToDelete) return;

    try {
      await deleteDashboardMutation.mutateAsync(dashboardToDelete);
      setShowDeleteModal(false);
      setDashboardToDelete(null);
    } catch (error) {
      console.error('Failed to delete dashboard:', error);
    }
  };

  const handleCloneDashboard = (dashboardId: string, name: string) => {
    setDashboardToClone({ id: dashboardId, name });
    setCloneName(`${name} (Copy)`);
    setShowCloneModal(true);
  };

  const confirmCloneDashboard = async () => {
    if (!dashboardToClone || !cloneName) return;

    try {
      await cloneDashboardMutation.mutateAsync({
        dashboardId: dashboardToClone.id,
        name: cloneName,
      });
      setShowCloneModal(false);
      setDashboardToClone(null);
      setCloneName('');
    } catch (error) {
      console.error('Failed to clone dashboard:', error);
    }
  };

  const resetForm = () => {
    setDashboardName('');
    setDashboardDescription('');
    setDashboardShared(false);
    setDashboardDefault(false);
  };

  const openEditModal = (dashboard: CustomDashboard) => {
    setEditingDashboard(dashboard);
    setDashboardName(dashboard.name);
    setDashboardDescription(dashboard.description);
    setDashboardShared(dashboard.is_shared);
    setDashboardDefault(dashboard.is_default);
    setShowCreateModal(true);
  };

  if (error) {
    return (
      <PageSection>
        <Alert
          variant={AlertVariant.danger}
          title="Error loading custom dashboards"
          isInline
        >
          {error.message ||
            'Failed to load custom dashboards. Please try again.'}
        </Alert>
      </PageSection>
    );
  }

  if (isLoading) {
    return (
      <PageSection>
        <LoadingSpinner message="Loading custom dashboards..." />
      </PageSection>
    );
  }

  const dashboards = dashboardsResponse?.data || [];

  // Filter dashboards by search term
  const filteredDashboards = dashboards.filter(
    (dashboard) =>
      dashboard.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      dashboard.description?.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <PageSection>
      <Stack hasGutter>
        {/* Breadcrumb */}
        <StackItem>
          <Breadcrumb>
            <BreadcrumbItem component={Link} to={ROUTES.DASHBOARD}>
              Dashboard
            </BreadcrumbItem>
            <BreadcrumbItem component={Link} to={ROUTES.MONITORING}>
              Resource Monitoring
            </BreadcrumbItem>
            <BreadcrumbItem isActive>Custom Dashboards</BreadcrumbItem>
          </Breadcrumb>
        </StackItem>

        {/* Header */}
        <StackItem>
          <Split hasGutter>
            <SplitItem isFilled>
              <Title headingLevel="h1" size="2xl">
                <ChartAreaIcon className="pf-v6-u-mr-sm" />
                Custom Dashboards
              </Title>
              <p>
                Create and manage personalized monitoring dashboards with custom
                widgets, charts, and layouts tailored to your specific needs.
              </p>
            </SplitItem>
            <SplitItem>
              <Button
                variant="primary"
                icon={<PlusIcon />}
                onClick={() => setShowCreateModal(true)}
              >
                Create Dashboard
              </Button>
            </SplitItem>
          </Split>
        </StackItem>

        {/* Filters and Controls */}
        <StackItem>
          <Card>
            <CardBody>
              <Toolbar>
                <ToolbarContent>
                  <ToolbarItem width="300px">
                    <SearchInput
                      placeholder="Search dashboards..."
                      value={searchValue}
                      onChange={(_event, value) => handleSearch(value)}
                      onClear={() => handleSearch('')}
                    />
                  </ToolbarItem>

                  <ToolbarItem>
                    <Select
                      isOpen={isSharedFilterOpen}
                      selected={filterShared}
                      onSelect={(_, selection) =>
                        handleSharedFilterChange(selection as string)
                      }
                      onOpenChange={setIsSharedFilterOpen}
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() =>
                            setIsSharedFilterOpen(!isSharedFilterOpen)
                          }
                          isExpanded={isSharedFilterOpen}
                          icon={<FilterIcon />}
                        >
                          {filterShared
                            ? filterShared === 'true'
                              ? 'Shared Only'
                              : 'Personal Only'
                            : 'All Dashboards'}
                        </MenuToggle>
                      )}
                    >
                      <SelectList>
                        <SelectOption value="">All Dashboards</SelectOption>
                        <SelectOption value="false">Personal Only</SelectOption>
                        <SelectOption value="true">Shared Only</SelectOption>
                      </SelectList>
                    </Select>
                  </ToolbarItem>

                  {(searchValue || filterShared) && (
                    <ToolbarItem>
                      <Button variant="link" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    </ToolbarItem>
                  )}
                </ToolbarContent>
              </Toolbar>
            </CardBody>
          </Card>
        </StackItem>

        {/* Dashboards Gallery */}
        <StackItem>
          {filteredDashboards.length === 0 ? (
            <Card>
              <CardBody>
                <EmptyState>
                  <Bullseye>
                    <ChartAreaIcon style={{ fontSize: '64px' }} />
                  </Bullseye>
                  <Title headingLevel="h4" size="lg">
                    No dashboards found
                  </Title>
                  <EmptyStateBody>
                    {searchValue || filterShared
                      ? 'No dashboards match your current filters. Try adjusting your search criteria.'
                      : 'No custom dashboards have been created yet. Create your first dashboard to get started.'}
                  </EmptyStateBody>
                  {searchValue || filterShared ? (
                    <EmptyStateActions>
                      <Button variant="primary" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    </EmptyStateActions>
                  ) : (
                    <EmptyStateActions>
                      <Button
                        variant="primary"
                        onClick={() => setShowCreateModal(true)}
                      >
                        Create Dashboard
                      </Button>
                    </EmptyStateActions>
                  )}
                </EmptyState>
              </CardBody>
            </Card>
          ) : (
            <Gallery hasGutter minWidths={{ default: '350px' }}>
              {filteredDashboards.map((dashboard) => (
                <Card
                  key={dashboard.id}
                  isSelectable
                  style={{ cursor: 'pointer' }}
                >
                  <CardBody>
                    <Stack hasGutter>
                      <StackItem>
                        <Split hasGutter>
                          <SplitItem isFilled>
                            <Title headingLevel="h3" size="lg">
                              {dashboard.name}
                            </Title>
                          </SplitItem>
                          <SplitItem>
                            {dashboard.is_default && (
                              <Badge color="blue">Default</Badge>
                            )}
                            {dashboard.is_shared && (
                              <Badge color="green">Shared</Badge>
                            )}
                          </SplitItem>
                        </Split>
                      </StackItem>

                      <StackItem>
                        <p>
                          {dashboard.description || 'No description available.'}
                        </p>
                      </StackItem>

                      <StackItem>
                        <DescriptionList isHorizontal isCompact>
                          <DescriptionListGroup>
                            <DescriptionListTerm>Widgets</DescriptionListTerm>
                            <DescriptionListDescription>
                              {dashboard.widgets.length}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>Layout</DescriptionListTerm>
                            <DescriptionListDescription>
                              {dashboard.layout.columns} columns
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                        </DescriptionList>
                      </StackItem>

                      <StackItem>
                        <small className="pf-v6-u-color-200">
                          Created:{' '}
                          {new Date(dashboard.created_at).toLocaleDateString()}
                        </small>
                      </StackItem>

                      <StackItem>
                        <Split hasGutter>
                          <SplitItem>
                            <Button
                              variant="plain"
                              icon={<EyeIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                // TODO: Navigate to dashboard view
                                console.log('View dashboard:', dashboard.id);
                              }}
                              aria-label={`View ${dashboard.name}`}
                            />
                          </SplitItem>
                          <SplitItem>
                            <Button
                              variant="plain"
                              icon={<EditIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(dashboard);
                              }}
                              aria-label={`Edit ${dashboard.name}`}
                            />
                          </SplitItem>
                          <SplitItem>
                            <Button
                              variant="plain"
                              icon={<CopyIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCloneDashboard(
                                  dashboard.id,
                                  dashboard.name
                                );
                              }}
                              aria-label={`Clone ${dashboard.name}`}
                            />
                          </SplitItem>
                          <SplitItem>
                            <Button
                              variant="plain"
                              icon={<TrashIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDashboard(dashboard.id);
                              }}
                              aria-label={`Delete ${dashboard.name}`}
                              isDanger
                            />
                          </SplitItem>
                        </Split>
                      </StackItem>
                    </Stack>
                  </CardBody>
                </Card>
              ))}
            </Gallery>
          )}
        </StackItem>

        {/* Info Alert */}
        <StackItem>
          <Alert
            variant={AlertVariant.info}
            title="Dashboard Builder Coming Soon"
            isInline
          >
            The interactive dashboard builder with drag-and-drop widgets, custom
            charts, and advanced layout options is currently in development. For
            now, you can create and manage basic dashboard configurations.
          </Alert>
        </StackItem>
      </Stack>

      {/* Create/Edit Dashboard Modal */}
      <Modal
        variant={ModalVariant.medium}
        title={editingDashboard ? 'Edit Dashboard' : 'Create Dashboard'}
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingDashboard(null);
          resetForm();
        }}
      >
        <Form>
          <FormGroup label="Dashboard Name" isRequired fieldId="dashboard-name">
            <TextInput
              isRequired
              id="dashboard-name"
              value={dashboardName}
              onChange={(_event, value) => setDashboardName(value)}
              placeholder="Enter dashboard name"
            />
          </FormGroup>

          <FormGroup label="Description" fieldId="dashboard-description">
            <TextArea
              id="dashboard-description"
              value={dashboardDescription}
              onChange={(_event, value) => setDashboardDescription(value)}
              placeholder="Enter dashboard description (optional)"
              rows={3}
            />
          </FormGroup>

          <FormGroup label="Shared Dashboard" fieldId="dashboard-shared">
            <Switch
              id="dashboard-shared"
              isChecked={dashboardShared}
              onChange={(_event, checked) => setDashboardShared(checked)}
              label="Make this dashboard available to other users"
            />
          </FormGroup>

          <FormGroup label="Default Dashboard" fieldId="dashboard-default">
            <Switch
              id="dashboard-default"
              isChecked={dashboardDefault}
              onChange={(_event, checked) => setDashboardDefault(checked)}
              label="Set as default dashboard"
            />
          </FormGroup>

          <div className="pf-v6-u-mt-lg">
            <Button
              variant="primary"
              onClick={
                editingDashboard ? handleUpdateDashboard : handleCreateDashboard
              }
              isLoading={
                createDashboardMutation.isPending ||
                updateDashboardMutation.isPending
              }
              isDisabled={!dashboardName}
              className="pf-v6-u-mr-sm"
            >
              {editingDashboard ? 'Update Dashboard' : 'Create Dashboard'}
            </Button>
            <Button
              variant="link"
              onClick={() => {
                setShowCreateModal(false);
                setEditingDashboard(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        variant={ModalVariant.small}
        title="Delete Dashboard"
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDashboardToDelete(null);
        }}
      >
        <p>
          Are you sure you want to delete this dashboard? This action cannot be
          undone.
        </p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem',
            marginTop: '1rem',
          }}
        >
          <Button
            variant="danger"
            onClick={confirmDeleteDashboard}
            isDisabled={deleteDashboardMutation.isPending}
            isLoading={deleteDashboardMutation.isPending}
          >
            Delete
          </Button>
          <Button
            variant="link"
            onClick={() => {
              setShowDeleteModal(false);
              setDashboardToDelete(null);
            }}
          >
            Cancel
          </Button>
        </div>
      </Modal>

      {/* Clone Dashboard Modal */}
      <Modal
        variant={ModalVariant.small}
        title="Clone Dashboard"
        isOpen={showCloneModal}
        onClose={() => {
          setShowCloneModal(false);
          setDashboardToClone(null);
          setCloneName('');
        }}
      >
        <Form>
          <FormGroup label="Clone Name" isRequired fieldId="clone-name">
            <TextInput
              id="clone-name"
              value={cloneName}
              onChange={(_, value) => setCloneName(value)}
              placeholder="Enter name for cloned dashboard"
            />
          </FormGroup>
        </Form>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem',
            marginTop: '1rem',
          }}
        >
          <Button
            variant="primary"
            onClick={confirmCloneDashboard}
            isDisabled={cloneDashboardMutation.isPending || !cloneName}
            isLoading={cloneDashboardMutation.isPending}
          >
            Clone
          </Button>
          <Button
            variant="link"
            onClick={() => {
              setShowCloneModal(false);
              setDashboardToClone(null);
              setCloneName('');
            }}
          >
            Cancel
          </Button>
        </div>
      </Modal>
    </PageSection>
  );
};

export default CustomDashboards;
