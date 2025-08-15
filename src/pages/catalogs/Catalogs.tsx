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
  Bullseye,
  Breadcrumb,
  BreadcrumbItem,
} from '@patternfly/react-core';
import { CatalogIcon, StarIcon, PlusIcon } from '@patternfly/react-icons';
import { useCatalogs } from '../../hooks/useCatalogs';
import { useUserPermissions } from '../../hooks/usePermissions';
import { useOrganizations } from '../../hooks/useOrganizations';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import CreateCatalogModal from '../../components/catalogs/CreateCatalogModal';
import type { Catalog, CatalogQueryParams } from '../../types';

const Catalogs: React.FC = () => {
  const navigate = useNavigate();

  // Search and filter state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [selectedOrgName, setSelectedOrgName] = useState<string>('');

  // User permissions
  const { data: userPermissions } = useUserPermissions();

  // Organizations (for System Admins)
  const { data: organizationsResponse } = useOrganizations(undefined);

  // Favorites state (using localStorage for persistence)
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('catalog-favorites');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (error) {
      console.error(
        'Failed to parse catalog favorites from localStorage:',
        error
      );
      localStorage.removeItem('catalog-favorites');
      return new Set();
    }
  });

  // Build query parameters
  const queryParams: CatalogQueryParams = {
    page: currentPage,
    pageSize: perPage,
  };

  const { data: catalogsResponse, isLoading, error } = useCatalogs(queryParams);

  const toggleFavorite = (catalogId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(catalogId)) {
      newFavorites.delete(catalogId);
    } else {
      newFavorites.add(catalogId);
    }
    setFavorites(newFavorites);

    // Save to localStorage with error handling
    try {
      localStorage.setItem(
        'catalog-favorites',
        JSON.stringify([...newFavorites])
      );
    } catch (error) {
      console.error('Failed to save catalog favorites to localStorage:', error);
    }
  };

  const handleCatalogClick = (catalog: Catalog) => {
    navigate(`/catalogs/${catalog.id}`);
  };

  const handleCreateCatalogClick = () => {
    const organizations = organizationsResponse?.data || [];

    if (organizations.length === 0) {
      console.error('No organizations available for catalog creation');
      return;
    }

    // For System Admins, default to the first organization
    // In a real implementation, this could open an organization selector first
    const defaultOrg = organizations[0];
    setSelectedOrgId(defaultOrg.id);
    setSelectedOrgName(defaultOrg.name);
    setIsCreateModalOpen(true);
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

  const catalogs = catalogsResponse?.values || [];
  const totalCount = catalogsResponse?.resultTotal || 0;

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
                Browse and manage VM templates organized in catalogs. Templates
                provide pre-configured virtual machine specifications that can
                be used to quickly deploy new VMs.
              </p>
            </SplitItem>
          </Split>
        </StackItem>

        <StackItem>
          <Card>
            <CardBody>
              <Toolbar>
                <ToolbarContent>
                  {/* Create Catalog Button - only for System Admins */}
                  {userPermissions?.canManageSystem && (
                    <ToolbarItem>
                      <Button
                        variant="primary"
                        icon={<PlusIcon />}
                        onClick={() => handleCreateCatalogClick()}
                      >
                        Create Catalog
                      </Button>
                    </ToolbarItem>
                  )}

                  <ToolbarItem align={{ default: 'alignEnd' }}>
                    {totalCount > 0 && (
                      <Pagination
                        itemCount={totalCount}
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
                    No catalogs are available. Contact your administrator to
                    create catalogs and add templates.
                  </EmptyStateBody>
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
                              className={
                                favorites.has(catalog.id)
                                  ? 'pf-v6-u-color-yellow'
                                  : ''
                              }
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
                            <Badge
                              color={catalog.isPublished ? 'blue' : 'grey'}
                            >
                              {catalog.isPublished ? 'Published' : 'Private'}
                            </Badge>
                          </SplitItem>
                          <SplitItem>
                            <Badge color="green">
                              {catalog.numberOfVAppTemplates} Templates
                            </Badge>
                          </SplitItem>
                        </Split>
                      </StackItem>

                      <StackItem>
                        <small className="pf-v6-u-color-200">
                          Created:{' '}
                          {new Date(catalog.creationDate).toLocaleDateString()}
                        </small>
                      </StackItem>
                    </Stack>
                  </CardBody>
                </Card>
              ))}
            </Gallery>
          )}
        </StackItem>

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

      {/* Create Catalog Modal */}
      {userPermissions?.canManageSystem && selectedOrgId && (
        <CreateCatalogModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setSelectedOrgId('');
            setSelectedOrgName('');
          }}
          organizationId={selectedOrgId}
          organizationName={selectedOrgName}
        />
      )}
    </PageSection>
  );
};

export default Catalogs;
