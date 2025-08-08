import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Bullseye,
  Breadcrumb,
  BreadcrumbItem,
} from '@patternfly/react-core';
import {
  CatalogIcon,
  FilterIcon,
  StarIcon,
} from '@patternfly/react-icons';
import { useCatalogs } from '../../hooks/useCatalogs';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { Catalog, CatalogQueryParams } from '../../types';
import type { MenuToggleElement } from '@patternfly/react-core';

const Catalogs: React.FC = () => {
  const navigate = useNavigate();

  // Search and filter state
  const [searchValue, setSearchValue] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterOrganization, setFilterOrganization] = useState<string>('');
  const [filterShared, setFilterShared] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // Select state
  const [isSortSelectOpen, setIsSortSelectOpen] = useState(false);
  const [isSharedFilterOpen, setIsSharedFilterOpen] = useState(false);

  // Favorites state (using localStorage for persistence)
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('catalog-favorites');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  // Build query parameters
  const queryParams: CatalogQueryParams = {
    page: currentPage,
    per_page: perPage,
    sort_by: sortBy,
    sort_order: sortOrder,
    search: searchValue || undefined,
    organization: filterOrganization || undefined,
    is_shared: filterShared ? (filterShared === 'true') : undefined,
  };

  const { data: catalogsResponse, isLoading, error } = useCatalogs(queryParams);

  const handleSearch = (value: string) => {
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

  const handleSharedFilterChange = (value: string) => {
    setFilterShared(value);
    setCurrentPage(1);
    setIsSharedFilterOpen(false);
  };

  const toggleFavorite = (catalogId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(catalogId)) {
      newFavorites.delete(catalogId);
    } else {
      newFavorites.add(catalogId);
    }
    setFavorites(newFavorites);
    localStorage.setItem('catalog-favorites', JSON.stringify([...newFavorites]));
  };

  const handleCatalogClick = (catalog: Catalog) => {
    navigate(`/catalogs/${catalog.id}`);
  };

  const clearFilters = () => {
    setSearchValue('');
    setSortBy('name');
    setSortOrder('asc');
    setFilterOrganization('');
    setFilterShared('');
    setCurrentPage(1);
  };

  if (error) {
    return (
      <PageSection>
        <Alert
          variant={AlertVariant.danger}
          title="Error loading catalogs"
          isInline
        >
          {error.message || 'Failed to load catalogs. Please try again.'}
        </Alert>
      </PageSection>
    );
  }

  if (isLoading) {
    return (
      <PageSection>
        <LoadingSpinner message="Loading catalogs..." />
      </PageSection>
    );
  }

  const catalogs = catalogsResponse?.data || [];
  const pagination = catalogsResponse?.pagination;

  return (
    <PageSection>
      <Stack hasGutter>
        {/* Breadcrumb */}
        <StackItem>
          <Breadcrumb>
            <BreadcrumbItem>Dashboard</BreadcrumbItem>
            <BreadcrumbItem isActive>Catalogs</BreadcrumbItem>
          </Breadcrumb>
        </StackItem>

        <StackItem>
          <Split hasGutter>
            <SplitItem isFilled>
              <Title headingLevel="h1" size="2xl">
                <CatalogIcon className="pf-v6-u-mr-sm" />
                Template Catalogs
              </Title>
              <p>
                Browse and manage VM templates organized in catalogs. Templates provide pre-configured virtual machine specifications that can be used to quickly deploy new VMs.
              </p>
            </SplitItem>
          </Split>
        </StackItem>

        <StackItem>
          <Card>
            <CardBody>
              <Toolbar>
                <ToolbarContent>
                  <ToolbarItem width="300px">
                    <SearchInput
                      placeholder="Search catalogs..."
                      value={searchValue}
                      onChange={(_event, value) => handleSearch(value)}
                      onClear={() => handleSearch('')}
                    />
                  </ToolbarItem>

                  <ToolbarItem>
                    <Select
                      isOpen={isSortSelectOpen}
                      selected={`${sortBy}_${sortOrder}`}
                      onSelect={(_, selection) => handleSortChange(selection as string)}
                      onOpenChange={setIsSortSelectOpen}
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() => setIsSortSelectOpen(!isSortSelectOpen)}
                          isExpanded={isSortSelectOpen}
                        >
                          Sort by {sortBy === 'name' ? 'Name' : 'Date'} ({sortOrder === 'asc' ? 'A-Z' : 'Z-A'})
                        </MenuToggle>
                      )}
                    >
                      <SelectList>
                        <SelectOption value="name_asc">Name (A-Z)</SelectOption>
                        <SelectOption value="name_desc">Name (Z-A)</SelectOption>
                        <SelectOption value="created_at_desc">Newest First</SelectOption>
                        <SelectOption value="created_at_asc">Oldest First</SelectOption>
                      </SelectList>
                    </Select>
                  </ToolbarItem>

                  <ToolbarItem>
                    <Select
                      isOpen={isSharedFilterOpen}
                      selected={filterShared}
                      onSelect={(_, selection) => handleSharedFilterChange(selection as string)}
                      onOpenChange={setIsSharedFilterOpen}
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() => setIsSharedFilterOpen(!isSharedFilterOpen)}
                          isExpanded={isSharedFilterOpen}
                          icon={<FilterIcon />}
                        >
                          {filterShared ? (filterShared === 'true' ? 'Shared' : 'Private') : 'All Types'}
                        </MenuToggle>
                      )}
                    >
                      <SelectList>
                        <SelectOption value="">All Types</SelectOption>
                        <SelectOption value="true">Shared Only</SelectOption>
                        <SelectOption value="false">Private Only</SelectOption>
                      </SelectList>
                    </Select>
                  </ToolbarItem>

                  {(searchValue || filterOrganization || filterShared) && (
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
          {catalogs.length === 0 ? (
            <Card>
              <CardBody>
                <EmptyState>
                  <Bullseye>
                    <CatalogIcon style={{ fontSize: '64px' }} />
                  </Bullseye>
                  <Title headingLevel="h4" size="lg">
                    No catalogs found
                  </Title>
                  <EmptyStateBody>
                    {searchValue || filterOrganization || filterShared
                      ? 'No catalogs match your current filters. Try adjusting your search criteria.'
                      : 'No catalogs are available. Contact your administrator to create catalogs and add templates.'}
                  </EmptyStateBody>
                  {(searchValue || filterOrganization || filterShared) && (
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
            <Gallery hasGutter minWidths={{ default: '300px' }}>
              {catalogs.map((catalog) => (
                <Card
                  key={catalog.id}
                  isSelectable
                  onClick={() => handleCatalogClick(catalog)}
                  style={{ cursor: 'pointer' }}
                >
                  <CardBody>
                    <Stack hasGutter>
                      <StackItem>
                        <Split hasGutter>
                          <SplitItem isFilled>
                            <Title headingLevel="h3" size="lg">
                              {catalog.name}
                            </Title>
                          </SplitItem>
                          <SplitItem>
                            <Button
                              variant="plain"
                              icon={<StarIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(catalog.id);
                              }}
                              className={favorites.has(catalog.id) ? 'pf-v6-u-color-yellow' : ''}
                              aria-label={
                                favorites.has(catalog.id)
                                  ? 'Remove from favorites'
                                  : 'Add to favorites'
                              }
                            />
                          </SplitItem>
                        </Split>
                      </StackItem>

                      <StackItem>
                        <p>
                          {catalog.description || 'No description available.'}
                        </p>
                      </StackItem>

                      <StackItem>
                        <Split hasGutter>
                          <SplitItem>
                            <Badge color={catalog.is_shared ? 'blue' : 'grey'}>
                              {catalog.is_shared ? 'Shared' : 'Private'}
                            </Badge>
                          </SplitItem>
                          <SplitItem>
                            <small>
                              Organization: {catalog.organization}
                            </small>
                          </SplitItem>
                        </Split>
                      </StackItem>

                      <StackItem>
                        <small className="pf-v6-u-color-200">
                          Created: {new Date(catalog.created_at).toLocaleDateString()}
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
    </PageSection>
  );
};

export default Catalogs;