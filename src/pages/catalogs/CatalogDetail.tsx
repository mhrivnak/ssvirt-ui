import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  Gallery,
  Badge,
  Split,
  SplitItem,
  Alert,
  AlertVariant,
  EmptyState,
  EmptyStateBody,
  EmptyStateActions,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Tabs,
  Tab,
  TabTitleText,
  Modal,
  ModalVariant,
  Checkbox,
  Breadcrumb,
  BreadcrumbItem,
  Bullseye,
} from '@patternfly/react-core';
import {
  ServerIcon,
  FilterIcon,
  StarIcon,
  InfoIcon,
} from '@patternfly/react-icons';
import { useCatalog, useCatalogItems } from '../../hooks/useCatalogs';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { CatalogItem, CatalogQueryParams } from '../../types';
import type { MenuToggleElement } from '@patternfly/react-core';

const CatalogDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Template search and filter state
  const [searchValue, setSearchValue] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterOsType, setFilterOsType] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // UI state
  const [activeTabKey, setActiveTabKey] = useState<string | number>(
    'templates'
  );
  const [isSortSelectOpen, setIsSortSelectOpen] = useState(false);
  const [isOsFilterOpen, setIsOsFilterOpen] = useState(false);
  const [showTemplateDetail, setShowTemplateDetail] =
    useState<CatalogItem | null>(null);

  // Template comparison state
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(
    new Set()
  );
  const [showComparison, setShowComparison] = useState(false);

  // Favorites state
  const [templateFavorites, setTemplateFavorites] = useState<Set<string>>(
    () => {
      try {
        const stored = localStorage.getItem('template-favorites');
        return stored ? new Set(JSON.parse(stored)) : new Set();
      } catch (error) {
        console.error('Failed to parse template favorites from localStorage:', error);
        // Clear corrupted data
        try {
          localStorage.removeItem('template-favorites');
        } catch (clearError) {
          console.error('Failed to clear corrupted template favorites:', clearError);
        }
        return new Set();
      }
    }
  );

  // Handle missing id parameter
  if (!id) {
    return (
      <PageSection>
        <Alert
          variant={AlertVariant.warning}
          title="Invalid catalog ID"
          isInline
        >
          No catalog ID was provided in the URL.
        </Alert>
      </PageSection>
    );
  }

  const {
    data: catalogResponse,
    isLoading: catalogLoading,
    error: catalogError,
  } = useCatalog(id);

  // Build query parameters for templates
  const templateQueryParams: CatalogQueryParams = {
    page: currentPage,
    per_page: perPage,
    sort_by: sortBy,
    sort_order: sortOrder,
    search: searchValue || undefined,
  };

  const {
    data: templatesResponse,
    isLoading: templatesLoading,
    error: templatesError,
  } = useCatalogItems(id, templateQueryParams);

  const catalog = catalogResponse?.data;
  const templates = templatesResponse?.data || [];
  const pagination = templatesResponse?.pagination;

  const handleTemplateSearch = (value: string) => {
    setSearchValue(value);
    setCurrentPage(1);
  };

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split('_');
    setSortBy(newSortBy);
    setSortOrder(newSortOrder as 'asc' | 'desc');
    setCurrentPage(1);
    setIsSortSelectOpen(false);
  };

  const handleOsFilterChange = (value: string) => {
    setFilterOsType(value);
    setCurrentPage(1);
    setIsOsFilterOpen(false);
  };

  const toggleTemplateFavorite = (templateId: string) => {
    const newFavorites = new Set(templateFavorites);
    if (newFavorites.has(templateId)) {
      newFavorites.delete(templateId);
    } else {
      newFavorites.add(templateId);
    }
    setTemplateFavorites(newFavorites);
    
    // Save to localStorage with error handling
    try {
      localStorage.setItem(
        'template-favorites',
        JSON.stringify([...newFavorites])
      );
    } catch (error) {
      console.error('Failed to save template favorites to localStorage:', error);
      // Note: The favorites state is still updated in memory, so the UI will reflect the change
      // even if localStorage fails. This ensures the user sees their action was successful.
    }
  };

  const handleTemplateSelection = (templateId: string, checked: boolean) => {
    const newSelection = new Set(selectedTemplates);
    if (checked) {
      newSelection.add(templateId);
    } else {
      newSelection.delete(templateId);
    }
    setSelectedTemplates(newSelection);
  };

  const handleCompareTemplates = () => {
    if (selectedTemplates.size > 1) {
      setShowComparison(true);
    }
  };

  const clearFilters = () => {
    setSearchValue('');
    setSortBy('name');
    setSortOrder('asc');
    setFilterOsType('');
    setCurrentPage(1);
  };

  const clearSelection = () => {
    setSelectedTemplates(new Set());
  };

  const getSelectedTemplateDetails = () => {
    return templates.filter((template) => selectedTemplates.has(template.id));
  };

  if (catalogError) {
    return (
      <PageSection>
        <Alert
          variant={AlertVariant.danger}
          title="Error loading catalog"
          isInline
        >
          {catalogError.message ||
            'Failed to load catalog details. Please try again.'}
        </Alert>
      </PageSection>
    );
  }

  if (catalogLoading) {
    return (
      <PageSection>
        <LoadingSpinner message="Loading catalog..." />
      </PageSection>
    );
  }

  if (!catalog) {
    return (
      <PageSection>
        <Alert
          variant={AlertVariant.warning}
          title="Catalog not found"
          isInline
        >
          The requested catalog could not be found.
        </Alert>
      </PageSection>
    );
  }

  // Filter templates by OS type if filter is applied
  const filteredTemplates = filterOsType
    ? templates.filter((template) => template.os_type.includes(filterOsType))
    : templates;

  return (
    <PageSection>
      <Stack hasGutter>
        {/* Breadcrumb */}
        <StackItem>
          <Breadcrumb>
            <BreadcrumbItem component={Link} to="/dashboard">
              Dashboard
            </BreadcrumbItem>
            <BreadcrumbItem component={Link} to="/catalogs">
              Catalogs
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{catalog.name}</BreadcrumbItem>
          </Breadcrumb>
        </StackItem>

        <StackItem>
          <Split hasGutter>
            <SplitItem isFilled>
              <Title headingLevel="h1" size="2xl">
                {catalog.name}
              </Title>
              <p>{catalog.description || 'No description available.'}</p>
            </SplitItem>
            <SplitItem>
              <Badge color={catalog.is_shared ? 'blue' : 'grey'}>
                {catalog.is_shared ? 'Shared Catalog' : 'Private Catalog'}
              </Badge>
            </SplitItem>
          </Split>
        </StackItem>

        <StackItem>
          <Tabs
            activeKey={activeTabKey}
            onSelect={(_, tabIndex) => setActiveTabKey(tabIndex)}
          >
            <Tab
              eventKey="templates"
              title={
                <TabTitleText>
                  Templates ({filteredTemplates.length})
                </TabTitleText>
              }
            >
              <Stack hasGutter style={{ marginTop: '1rem' }}>
                {selectedTemplates.size > 0 && (
                  <StackItem>
                    <Alert
                      variant={AlertVariant.info}
                      title={`${selectedTemplates.size} templates selected`}
                      isInline
                      actionLinks={
                        <>
                          <Button
                            variant="link"
                            onClick={handleCompareTemplates}
                            isDisabled={selectedTemplates.size < 2}
                          >
                            Compare Selected ({selectedTemplates.size})
                          </Button>
                          <Button variant="link" onClick={clearSelection}>
                            Clear Selection
                          </Button>
                        </>
                      }
                    />
                  </StackItem>
                )}

                <StackItem>
                  <Card>
                    <CardBody>
                      <Toolbar>
                        <ToolbarContent>
                          <ToolbarItem width="300px">
                            <SearchInput
                              placeholder="Search templates..."
                              value={searchValue}
                              onChange={(_event, value) =>
                                handleTemplateSearch(value)
                              }
                              onClear={() => handleTemplateSearch('')}
                            />
                          </ToolbarItem>

                          <ToolbarItem>
                            <Select
                              isOpen={isSortSelectOpen}
                              selected={`${sortBy}_${sortOrder}`}
                              onSelect={(_, selection) =>
                                handleSortChange(selection as string)
                              }
                              onOpenChange={setIsSortSelectOpen}
                              toggle={(
                                toggleRef: React.Ref<MenuToggleElement>
                              ) => (
                                <MenuToggle
                                  ref={toggleRef}
                                  onClick={() =>
                                    setIsSortSelectOpen(!isSortSelectOpen)
                                  }
                                  isExpanded={isSortSelectOpen}
                                >
                                  Sort by {sortBy === 'name' ? 'Name' : 'Date'}{' '}
                                  ({sortOrder === 'asc' ? 'A-Z' : 'Z-A'})
                                </MenuToggle>
                              )}
                            >
                              <SelectList>
                                <SelectOption value="name_asc">
                                  Name (A-Z)
                                </SelectOption>
                                <SelectOption value="name_desc">
                                  Name (Z-A)
                                </SelectOption>
                                <SelectOption value="created_at_desc">
                                  Newest First
                                </SelectOption>
                                <SelectOption value="created_at_asc">
                                  Oldest First
                                </SelectOption>
                              </SelectList>
                            </Select>
                          </ToolbarItem>

                          <ToolbarItem>
                            <Select
                              isOpen={isOsFilterOpen}
                              selected={filterOsType}
                              onSelect={(_, selection) =>
                                handleOsFilterChange(selection as string)
                              }
                              onOpenChange={setIsOsFilterOpen}
                              toggle={(
                                toggleRef: React.Ref<MenuToggleElement>
                              ) => (
                                <MenuToggle
                                  ref={toggleRef}
                                  onClick={() =>
                                    setIsOsFilterOpen(!isOsFilterOpen)
                                  }
                                  isExpanded={isOsFilterOpen}
                                  icon={<FilterIcon />}
                                >
                                  {filterOsType
                                    ? `OS: ${filterOsType}`
                                    : 'All OS Types'}
                                </MenuToggle>
                              )}
                            >
                              <SelectList>
                                <SelectOption value="">
                                  All OS Types
                                </SelectOption>
                                <SelectOption value="ubuntu">
                                  Ubuntu
                                </SelectOption>
                                <SelectOption value="centos">
                                  CentOS
                                </SelectOption>
                                <SelectOption value="rhel">
                                  Red Hat Enterprise Linux
                                </SelectOption>
                                <SelectOption value="windows">
                                  Windows
                                </SelectOption>
                                <SelectOption value="debian">
                                  Debian
                                </SelectOption>
                              </SelectList>
                            </Select>
                          </ToolbarItem>

                          {(searchValue || filterOsType) && (
                            <ToolbarItem>
                              <Button variant="link" onClick={clearFilters}>
                                Clear filters
                              </Button>
                            </ToolbarItem>
                          )}

                          <ToolbarItem align={{ default: 'alignEnd' }}>
                            {pagination && (
                              <Pagination
                                itemCount={pagination.total}
                                perPage={perPage}
                                page={currentPage}
                                onSetPage={(_, page) => setCurrentPage(page)}
                                onPerPageSelect={(_, newPerPage) => {
                                  setPerPage(newPerPage);
                                  setCurrentPage(1);
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

                <StackItem>
                  {templatesLoading ? (
                    <LoadingSpinner message="Loading templates..." />
                  ) : templatesError ? (
                    <Alert
                      variant={AlertVariant.danger}
                      title="Error loading templates"
                      isInline
                    >
                      {templatesError.message || 'Failed to load templates.'}
                    </Alert>
                  ) : filteredTemplates.length === 0 ? (
                    <Card>
                      <CardBody>
                        <EmptyState>
                          <Bullseye>
                            <ServerIcon style={{ fontSize: '64px' }} />
                          </Bullseye>
                          <Title headingLevel="h4" size="lg">
                            No templates found
                          </Title>
                          <EmptyStateBody>
                            {searchValue || filterOsType
                              ? 'No templates match your current filters. Try adjusting your search criteria.'
                              : 'This catalog does not contain any templates.'}
                          </EmptyStateBody>
                          {(searchValue || filterOsType) && (
                            <EmptyStateActions>
                              <Button variant="primary" onClick={clearFilters}>
                                Clear filters
                              </Button>
                            </EmptyStateActions>
                          )}
                        </EmptyState>
                      </CardBody>
                    </Card>
                  ) : (
                    <Gallery hasGutter minWidths={{ default: '350px' }}>
                      {filteredTemplates.map((template) => (
                        <Card
                          key={template.id}
                          isSelectable
                          style={{ cursor: 'pointer' }}
                        >
                          <CardBody>
                            <Stack hasGutter>
                              <StackItem>
                                <Split hasGutter>
                                  <SplitItem>
                                    <Checkbox
                                      id={`template-${template.id}`}
                                      isChecked={selectedTemplates.has(
                                        template.id
                                      )}
                                      onChange={(_event, checked) =>
                                        handleTemplateSelection(
                                          template.id,
                                          checked
                                        )
                                      }
                                      aria-label={`Select ${template.name}`}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </SplitItem>
                                  <SplitItem isFilled>
                                    <Title headingLevel="h3" size="lg">
                                      {template.name}
                                    </Title>
                                  </SplitItem>
                                  <SplitItem>
                                    <Button
                                      variant="plain"
                                      icon={<StarIcon />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleTemplateFavorite(template.id);
                                      }}
                                      className={
                                        templateFavorites.has(template.id)
                                          ? 'pf-v6-u-color-yellow'
                                          : ''
                                      }
                                      aria-label={
                                        templateFavorites.has(template.id)
                                          ? 'Remove from favorites'
                                          : 'Add to favorites'
                                      }
                                    />
                                  </SplitItem>
                                  <SplitItem>
                                    <Button
                                      variant="plain"
                                      icon={<InfoIcon />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowTemplateDetail(template);
                                      }}
                                      aria-label={`View ${template.name} details`}
                                    />
                                  </SplitItem>
                                </Split>
                              </StackItem>

                              <StackItem>
                                <p>
                                  {template.description ||
                                    'No description available.'}
                                </p>
                              </StackItem>

                              <StackItem>
                                <DescriptionList isHorizontal isCompact>
                                  <DescriptionListGroup>
                                    <DescriptionListTerm>
                                      OS Type
                                    </DescriptionListTerm>
                                    <DescriptionListDescription>
                                      <Badge>{template.os_type}</Badge>
                                    </DescriptionListDescription>
                                  </DescriptionListGroup>
                                  <DescriptionListGroup>
                                    <DescriptionListTerm>
                                      Instance Type
                                    </DescriptionListTerm>
                                    <DescriptionListDescription>
                                      {template.vm_instance_type}
                                    </DescriptionListDescription>
                                  </DescriptionListGroup>
                                </DescriptionList>
                              </StackItem>

                              <StackItem>
                                <Split hasGutter>
                                  <SplitItem>
                                    <small>{template.cpu_count} CPU</small>
                                  </SplitItem>
                                  <SplitItem>
                                    <small>
                                      {Math.round(template.memory_mb / 1024)} GB
                                      RAM
                                    </small>
                                  </SplitItem>
                                  <SplitItem>
                                    <small>
                                      {template.disk_size_gb} GB Disk
                                    </small>
                                  </SplitItem>
                                </Split>
                              </StackItem>

                              <StackItem>
                                <small className="pf-v6-u-color-200">
                                  Created:{' '}
                                  {new Date(
                                    template.created_at
                                  ).toLocaleDateString()}
                                </small>
                              </StackItem>
                            </Stack>
                          </CardBody>
                        </Card>
                      ))}
                    </Gallery>
                  )}
                </StackItem>

                {pagination && pagination.total > perPage && (
                  <StackItem>
                    <Pagination
                      itemCount={pagination.total}
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
            </Tab>

            <Tab
              eventKey="details"
              title={<TabTitleText>Catalog Details</TabTitleText>}
            >
              <Card style={{ marginTop: '1rem' }}>
                <CardBody>
                  <DescriptionList>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Name</DescriptionListTerm>
                      <DescriptionListDescription>
                        {catalog.name}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Description</DescriptionListTerm>
                      <DescriptionListDescription>
                        {catalog.description || 'No description available.'}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Organization</DescriptionListTerm>
                      <DescriptionListDescription>
                        {catalog.organization}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Type</DescriptionListTerm>
                      <DescriptionListDescription>
                        <Badge color={catalog.is_shared ? 'blue' : 'grey'}>
                          {catalog.is_shared ? 'Shared' : 'Private'}
                        </Badge>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Created</DescriptionListTerm>
                      <DescriptionListDescription>
                        {new Date(catalog.created_at).toLocaleString()}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Last Updated</DescriptionListTerm>
                      <DescriptionListDescription>
                        {new Date(catalog.updated_at).toLocaleString()}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </CardBody>
              </Card>
            </Tab>
          </Tabs>
        </StackItem>
      </Stack>

      {/* Template Detail Modal */}
      {showTemplateDetail && (
        <Modal
          variant={ModalVariant.large}
          title={showTemplateDetail.name}
          isOpen={true}
          onClose={() => setShowTemplateDetail(null)}
        >
          <Stack hasGutter>
            <StackItem>
              <p>
                {showTemplateDetail.description || 'No description available.'}
              </p>
            </StackItem>
            <StackItem>
              <DescriptionList>
                <DescriptionListGroup>
                  <DescriptionListTerm>Operating System</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Badge>{showTemplateDetail.os_type}</Badge>
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Instance Type</DescriptionListTerm>
                  <DescriptionListDescription>
                    {showTemplateDetail.vm_instance_type}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>CPU Cores</DescriptionListTerm>
                  <DescriptionListDescription>
                    {showTemplateDetail.cpu_count}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Memory</DescriptionListTerm>
                  <DescriptionListDescription>
                    {Math.round(showTemplateDetail.memory_mb / 1024)} GB
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Disk Size</DescriptionListTerm>
                  <DescriptionListDescription>
                    {showTemplateDetail.disk_size_gb} GB
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Created</DescriptionListTerm>
                  <DescriptionListDescription>
                    {new Date(showTemplateDetail.created_at).toLocaleString()}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Last Updated</DescriptionListTerm>
                  <DescriptionListDescription>
                    {new Date(showTemplateDetail.updated_at).toLocaleString()}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </StackItem>
          </Stack>
        </Modal>
      )}

      {/* Template Comparison Modal */}
      {showComparison && (
        <Modal
          variant={ModalVariant.large}
          title={`Template Comparison (${selectedTemplates.size} templates)`}
          isOpen={true}
          onClose={() => setShowComparison(false)}
        >
          <div style={{ overflowX: 'auto' }}>
            <table className="pf-v6-c-table pf-m-compact pf-m-grid-md">
              <thead>
                <tr>
                  <th>Specification</th>
                  {getSelectedTemplateDetails().map((template) => (
                    <th key={template.id}>{template.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Description</strong>
                  </td>
                  {getSelectedTemplateDetails().map((template) => (
                    <td key={template.id}>{template.description || 'N/A'}</td>
                  ))}
                </tr>
                <tr>
                  <td>
                    <strong>OS Type</strong>
                  </td>
                  {getSelectedTemplateDetails().map((template) => (
                    <td key={template.id}>
                      <Badge>{template.os_type}</Badge>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>
                    <strong>Instance Type</strong>
                  </td>
                  {getSelectedTemplateDetails().map((template) => (
                    <td key={template.id}>{template.vm_instance_type}</td>
                  ))}
                </tr>
                <tr>
                  <td>
                    <strong>CPU Cores</strong>
                  </td>
                  {getSelectedTemplateDetails().map((template) => (
                    <td key={template.id}>{template.cpu_count}</td>
                  ))}
                </tr>
                <tr>
                  <td>
                    <strong>Memory</strong>
                  </td>
                  {getSelectedTemplateDetails().map((template) => (
                    <td key={template.id}>
                      {Math.round(template.memory_mb / 1024)} GB
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>
                    <strong>Disk Size</strong>
                  </td>
                  {getSelectedTemplateDetails().map((template) => (
                    <td key={template.id}>{template.disk_size_gb} GB</td>
                  ))}
                </tr>
                <tr>
                  <td>
                    <strong>Created</strong>
                  </td>
                  {getSelectedTemplateDetails().map((template) => (
                    <td key={template.id}>
                      {new Date(template.created_at).toLocaleDateString()}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </PageSection>
  );
};

export default CatalogDetail;
