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
  Gallery,
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
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
} from '@patternfly/react-core';
import { ActionsColumn } from '@patternfly/react-table';
import {
  PlayIcon,
  CopyIcon,
  EditIcon,
  TrashIcon,
  CodeIcon,
  LayerGroupIcon,
  StarIcon,
} from '@patternfly/react-icons';
import { Link } from 'react-router-dom';
import {
  useDeploymentTemplates,
  useCreateDeploymentTemplate,
  useUpdateDeploymentTemplate,
  useCloneDeploymentTemplate,
  useDeployFromTemplate,
  useDeleteDeploymentTemplate,
} from '../../hooks/useAutomation';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ROUTES } from '../../utils/constants';
import type { MenuToggleElement } from '@patternfly/react-core';
import type {
  DeploymentTemplate,
  CreateDeploymentTemplateRequest,
} from '../../types';

const DeploymentTemplates: React.FC = () => {
  // Search and filter state
  const [searchValue, setSearchValue] = useState('');
  const [templateTypeFilter, setTemplateTypeFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [isSharedFilter, setIsSharedFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // UI state
  const [isTemplateTypeFilterOpen, setIsTemplateTypeFilterOpen] =
    useState(false);
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);
  const [isSharedFilterOpen, setIsSharedFilterOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<DeploymentTemplate | null>(null);

  // Create/edit template form state
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateType, setTemplateType] = useState<'vm' | 'vapp' | 'vdc'>('vm');
  const [templateCategory, setTemplateCategory] = useState<
    'development' | 'testing' | 'production' | 'custom'
  >('development');
  const [templateShared, setTemplateShared] = useState(false);

  // Build query parameters
  const queryParams = {
    search: searchValue || undefined,
    template_type: templateTypeFilter as 'vm' | 'vapp' | 'vdc' | undefined,
    category: categoryFilter as 'development' | 'testing' | 'production' | 'custom' | undefined,
    is_shared: isSharedFilter ? isSharedFilter === 'true' : undefined,
    page: currentPage,
    per_page: perPage,
  };

  const {
    data: templatesResponse,
    isLoading,
    error,
  } = useDeploymentTemplates(queryParams);
  const createTemplateMutation = useCreateDeploymentTemplate();
  const updateTemplateMutation = useUpdateDeploymentTemplate();
  const cloneTemplateMutation = useCloneDeploymentTemplate();
  const deployFromTemplateMutation = useDeployFromTemplate();
  const deleteTemplateMutation = useDeleteDeploymentTemplate();

  const templates = templatesResponse?.data?.templates || [];
  const totalCount = templatesResponse?.data?.total || 0;

  const handleSearch = (value: string) => {
    setSearchValue(value);
    setCurrentPage(1);
  };

  const handleTemplateTypeFilter = (selection: string) => {
    setTemplateTypeFilter(selection === templateTypeFilter ? '' : selection);
    setCurrentPage(1);
    setIsTemplateTypeFilterOpen(false);
  };

  const handleCategoryFilter = (selection: string) => {
    setCategoryFilter(selection === categoryFilter ? '' : selection);
    setCurrentPage(1);
    setIsCategoryFilterOpen(false);
  };

  const handleSharedFilter = (selection: string) => {
    setIsSharedFilter(selection === isSharedFilter ? '' : selection);
    setCurrentPage(1);
    setIsSharedFilterOpen(false);
  };

  const clearAllFilters = () => {
    setSearchValue('');
    setTemplateTypeFilter('');
    setCategoryFilter('');
    setIsSharedFilter('');
    setCurrentPage(1);
  };

  const resetForm = () => {
    setTemplateName('');
    setTemplateDescription('');
    setTemplateType('vm');
    setTemplateCategory('development');
    setTemplateShared(false);
  };

  const handleCreateTemplate = async () => {
    if (!templateName) return;

    try {
      const templateData: CreateDeploymentTemplateRequest = {
        name: templateName,
        description: templateDescription,
        template_type: templateType,
        category: templateCategory,
        is_shared: templateShared,
        configuration: {
          // Basic configuration - in real implementation this would be more complex
          vm_templates:
            templateType === 'vm'
              ? [
                  {
                    catalog_item_id: 'placeholder',
                    name_pattern: 'vm-${index}',
                    count: 1,
                    cpu_count: 2,
                    memory_mb: 4096,
                  },
                ]
              : undefined,
        },
      };

      if (editingTemplate) {
        await updateTemplateMutation.mutateAsync({
          templateId: editingTemplate.id,
          updates: templateData,
        });
      } else {
        await createTemplateMutation.mutateAsync(templateData);
      }

      resetForm();
      setShowCreateModal(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error('Failed to save deployment template:', error);
    }
  };

  const handleEditTemplate = (template: DeploymentTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateDescription(template.description || '');
    setTemplateType(template.template_type);
    setTemplateCategory(template.category);
    setTemplateShared(template.is_shared);
    setShowCreateModal(true);
  };

  const handleCloneTemplate = async (templateId: string, name: string) => {
    const cloneName = prompt(
      'Enter name for cloned template:',
      `${name} (Copy)`
    );
    if (!cloneName) return;

    try {
      await cloneTemplateMutation.mutateAsync({ templateId, name: cloneName });
    } catch (error) {
      console.error('Failed to clone template:', error);
    }
  };

  const handleDeployFromTemplate = async (templateId: string) => {
    try {
      await deployFromTemplateMutation.mutateAsync({
        templateId,
        config: {
          // Basic deployment config
          environment: 'development',
        },
      });
    } catch (error) {
      console.error('Failed to deploy from template:', error);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (
      window.confirm(
        'Are you sure you want to delete this deployment template?'
      )
    ) {
      try {
        await deleteTemplateMutation.mutateAsync(templateId);
      } catch (error) {
        console.error('Failed to delete template:', error);
      }
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'production':
        return 'red';
      case 'testing':
        return 'orange';
      case 'development':
        return 'blue';
      case 'custom':
        return 'purple';
      default:
        return 'grey';
    }
  };

  const getTemplateTypeIcon = (type: string) => {
    switch (type) {
      case 'vm':
        return <LayerGroupIcon />;
      case 'vapp':
        return <CodeIcon />;
      case 'vdc':
        return <StarIcon />;
      default:
        return <LayerGroupIcon />;
    }
  };

  if (error) {
    return (
      <PageSection>
        <Alert
          variant={AlertVariant.danger}
          title="Error loading deployment templates"
        >
          Failed to load deployment templates. Please try again.
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
            <BreadcrumbItem isActive>Deployment Templates</BreadcrumbItem>
          </Breadcrumb>
        </StackItem>

        {/* Header */}
        <StackItem>
          <Split hasGutter>
            <SplitItem isFilled>
              <Title headingLevel="h1" size="2xl">
                Deployment Templates
              </Title>
            </SplitItem>
            <SplitItem>
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
              >
                Create Template
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
                      placeholder="Search templates..."
                      value={searchValue}
                      onChange={(_, value) => handleSearch(value)}
                      onClear={() => handleSearch('')}
                    />
                  </ToolbarItem>
                  <ToolbarItem>
                    <Select
                      isOpen={isTemplateTypeFilterOpen}
                      selected={templateTypeFilter}
                      onSelect={(_, selection) =>
                        handleTemplateTypeFilter(selection as string)
                      }
                      onOpenChange={setIsTemplateTypeFilterOpen}
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() =>
                            setIsTemplateTypeFilterOpen(
                              !isTemplateTypeFilterOpen
                            )
                          }
                        >
                          {templateTypeFilter || 'All Types'}
                        </MenuToggle>
                      )}
                    >
                      <SelectList>
                        <SelectOption value="vm">VM Templates</SelectOption>
                        <SelectOption value="vapp">vApp Templates</SelectOption>
                        <SelectOption value="vdc">VDC Templates</SelectOption>
                      </SelectList>
                    </Select>
                  </ToolbarItem>
                  <ToolbarItem>
                    <Select
                      isOpen={isCategoryFilterOpen}
                      selected={categoryFilter}
                      onSelect={(_, selection) =>
                        handleCategoryFilter(selection as string)
                      }
                      onOpenChange={setIsCategoryFilterOpen}
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() =>
                            setIsCategoryFilterOpen(!isCategoryFilterOpen)
                          }
                        >
                          {categoryFilter || 'All Categories'}
                        </MenuToggle>
                      )}
                    >
                      <SelectList>
                        <SelectOption value="development">
                          Development
                        </SelectOption>
                        <SelectOption value="testing">Testing</SelectOption>
                        <SelectOption value="production">
                          Production
                        </SelectOption>
                        <SelectOption value="custom">Custom</SelectOption>
                      </SelectList>
                    </Select>
                  </ToolbarItem>
                  <ToolbarItem>
                    <Select
                      isOpen={isSharedFilterOpen}
                      selected={isSharedFilter}
                      onSelect={(_, selection) =>
                        handleSharedFilter(selection as string)
                      }
                      onOpenChange={setIsSharedFilterOpen}
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() =>
                            setIsSharedFilterOpen(!isSharedFilterOpen)
                          }
                        >
                          {isSharedFilter === 'true'
                            ? 'Shared'
                            : isSharedFilter === 'false'
                              ? 'Private'
                              : 'All Templates'}
                        </MenuToggle>
                      )}
                    >
                      <SelectList>
                        <SelectOption value="true">Shared</SelectOption>
                        <SelectOption value="false">Private</SelectOption>
                      </SelectList>
                    </Select>
                  </ToolbarItem>
                  {(searchValue ||
                    templateTypeFilter ||
                    categoryFilter ||
                    isSharedFilter) && (
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

        {/* Templates Gallery */}
        <StackItem isFilled>
          {isLoading ? (
            <LoadingSpinner />
          ) : templates.length === 0 ? (
            <EmptyState variant="lg">
              <Title headingLevel="h4" size="lg">
                No deployment templates found
              </Title>
              <EmptyStateBody>
                {searchValue ||
                templateTypeFilter ||
                categoryFilter ||
                isSharedFilter
                  ? 'No templates match your current filters.'
                  : 'No deployment templates have been created yet. Create your first template to automate deployments.'}
              </EmptyStateBody>
              {searchValue ||
              templateTypeFilter ||
              categoryFilter ||
              isSharedFilter ? (
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
                    Create Template
                  </Button>
                </EmptyStateActions>
              )}
            </EmptyState>
          ) : (
            <Gallery hasGutter>
              {templates.map((template: DeploymentTemplate) => (
                <Card key={template.id} isClickable>
                  <CardBody>
                    <Stack hasGutter>
                      <StackItem>
                        <Split hasGutter>
                          <SplitItem>
                            {getTemplateTypeIcon(template.template_type)}
                          </SplitItem>
                          <SplitItem isFilled>
                            <Stack>
                              <StackItem>
                                <strong>{template.name}</strong>
                                {template.is_default && (
                                  <Badge color="blue" className="pf-v6-u-ml-sm">
                                    Default
                                  </Badge>
                                )}
                                {template.is_shared && (
                                  <Badge
                                    color="green"
                                    className="pf-v6-u-ml-sm"
                                  >
                                    Shared
                                  </Badge>
                                )}
                              </StackItem>
                              <StackItem>
                                <Badge
                                  color={getCategoryColor(template.category)}
                                >
                                  {template.category}
                                </Badge>
                                <Badge className="pf-v6-u-ml-sm">
                                  {template.template_type.toUpperCase()}
                                </Badge>
                              </StackItem>
                            </Stack>
                          </SplitItem>
                          <SplitItem>
                            <ActionsColumn
                              items={[
                                {
                                  title: 'Deploy',
                                  icon: <PlayIcon />,
                                  onClick: () =>
                                    handleDeployFromTemplate(template.id),
                                },
                                {
                                  title: 'Edit',
                                  icon: <EditIcon />,
                                  onClick: () => handleEditTemplate(template),
                                },
                                {
                                  title: 'Clone',
                                  icon: <CopyIcon />,
                                  onClick: () =>
                                    handleCloneTemplate(
                                      template.id,
                                      template.name
                                    ),
                                },
                                {
                                  title: 'Delete',
                                  icon: <TrashIcon />,
                                  onClick: () =>
                                    handleDeleteTemplate(template.id),
                                },
                              ]}
                            />
                          </SplitItem>
                        </Split>
                      </StackItem>

                      {template.description && (
                        <StackItem>
                          <small className="pf-v6-u-color-200">
                            {template.description}
                          </small>
                        </StackItem>
                      )}

                      <StackItem>
                        <DescriptionList isCompact>
                          <DescriptionListGroup>
                            <DescriptionListTerm>Usage</DescriptionListTerm>
                            <DescriptionListDescription>
                              {template.usage_count} deployments
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>Created</DescriptionListTerm>
                            <DescriptionListDescription>
                              {new Date(
                                template.created_at
                              ).toLocaleDateString()}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>
                              Created by
                            </DescriptionListTerm>
                            <DescriptionListDescription>
                              {template.created_by}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                        </DescriptionList>
                      </StackItem>
                    </Stack>
                  </CardBody>
                </Card>
              ))}
            </Gallery>
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

      {/* Create/Edit Template Modal */}
      <Modal
        variant={ModalVariant.medium}
        title={
          editingTemplate
            ? 'Edit Deployment Template'
            : 'Create Deployment Template'
        }
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingTemplate(null);
          resetForm();
        }}
      >
        <Form>
          <FormGroup label="Template Name" isRequired fieldId="template-name">
            <TextInput
              isRequired
              id="template-name"
              value={templateName}
              onChange={(_event, value) => setTemplateName(value)}
              placeholder="Enter template name"
            />
          </FormGroup>

          <FormGroup label="Description" fieldId="template-description">
            <TextArea
              id="template-description"
              value={templateDescription}
              onChange={(_event, value) => setTemplateDescription(value)}
              placeholder="Enter template description (optional)"
              rows={3}
            />
          </FormGroup>

          <FormGroup label="Template Type" isRequired fieldId="template-type">
            <Select
              isOpen={false}
              selected={templateType}
              onSelect={(_, selection) =>
                setTemplateType(selection as 'vm' | 'vapp' | 'vdc')
              }
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle ref={toggleRef}>
                  {templateType.toUpperCase()}
                </MenuToggle>
              )}
            >
              <SelectList>
                <SelectOption value="vm">VM Template</SelectOption>
                <SelectOption value="vapp">vApp Template</SelectOption>
                <SelectOption value="vdc">VDC Template</SelectOption>
              </SelectList>
            </Select>
          </FormGroup>

          <FormGroup label="Category" isRequired fieldId="template-category">
            <Select
              isOpen={false}
              selected={templateCategory}
              onSelect={(_, selection) =>
                setTemplateCategory(
                  selection as
                    | 'development'
                    | 'testing'
                    | 'production'
                    | 'custom'
                )
              }
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle ref={toggleRef}>
                  {templateCategory.charAt(0).toUpperCase() +
                    templateCategory.slice(1)}
                </MenuToggle>
              )}
            >
              <SelectList>
                <SelectOption value="development">Development</SelectOption>
                <SelectOption value="testing">Testing</SelectOption>
                <SelectOption value="production">Production</SelectOption>
                <SelectOption value="custom">Custom</SelectOption>
              </SelectList>
            </Select>
          </FormGroup>

          <FormGroup fieldId="template-shared">
            <Switch
              id="template-shared"
              label="Share this template with other users"
              isChecked={templateShared}
              onChange={(_event, checked) => setTemplateShared(checked)}
            />
          </FormGroup>
        </Form>

        <div className="pf-v6-u-mt-lg">
          <Button
            variant="primary"
            onClick={handleCreateTemplate}
            isLoading={
              createTemplateMutation.isPending ||
              updateTemplateMutation.isPending
            }
            isDisabled={!templateName}
          >
            {editingTemplate ? 'Update Template' : 'Create Template'}
          </Button>
          <Button
            variant="link"
            onClick={() => {
              setShowCreateModal(false);
              setEditingTemplate(null);
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

export default DeploymentTemplates;
