import React, { useState } from 'react';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  Stack,
  StackItem,
  Grid,
  GridItem,
  EmptyState,
  EmptyStateBody,
  Button,
  Breadcrumb,
  BreadcrumbItem,
  Alert,
  AlertVariant,
  TextInput,
  InputGroup,
  InputGroupItem,
  Flex,
  FlexItem,
  Badge,
  Pagination,
  PaginationVariant,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarGroup,
} from '@patternfly/react-core';
import {
  CatalogIcon,
  SearchIcon,
  ThIcon,
  ListIcon,
} from '@patternfly/react-icons';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCatalog, useCatalogItems } from '../../hooks';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import CatalogItemCard from '../../components/catalogs/CatalogItemCard';
import type { CatalogItem } from '../../types';
import { ROUTES } from '../../utils/constants';

type ViewMode = 'grid' | 'list';

const CatalogItems: React.FC = () => {
  const { catalogId } = useParams<{ catalogId: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const {
    data: catalog,
    isLoading: isCatalogLoading,
    error: catalogError,
  } = useCatalog(catalogId || '');

  const {
    data: catalogItemsResponse,
    isLoading: isItemsLoading,
    error: itemsError,
  } = useCatalogItems(catalogId || '', {
    page,
    pageSize,
    filter: searchTerm ? `name==${searchTerm}*` : undefined,
  });

  if (!catalogId) {
    return (
      <PageSection>
        <EmptyState icon={CatalogIcon}>
          <Title headingLevel="h4" size="lg">
            Invalid Catalog
          </Title>
          <EmptyStateBody>
            No catalog ID provided. Please select a valid catalog.
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
  const catalogItems = catalogItemsResponse?.values || [];
  const totalItems = catalogItemsResponse?.resultTotal || 0;

  const handleItemSelect = (item: CatalogItem) => {
    console.log('Selected catalog item:', item);
  };

  const handleItemViewDetails = (item: CatalogItem) => {
    navigate(
      ROUTES.CATALOG_ITEM_DETAIL.replace(':catalogId', catalogId!).replace(
        ':itemId',
        item.id
      )
    );
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handlePageChange = (
    _event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    newPage: number
  ) => {
    setPage(newPage);
  };

  const handlePerPageSelect = (
    _event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    newPerPage: number
  ) => {
    setPageSize(newPerPage);
    setPage(1);
  };

  // Handle catalog-level loading and errors
  if (isCatalogLoading) {
    return (
      <PageSection>
        <LoadingSpinner message="Loading catalog..." />
      </PageSection>
    );
  }

  if (catalogError || !catalog) {
    return (
      <PageSection>
        <EmptyState icon={CatalogIcon}>
          <Title headingLevel="h4" size="lg">
            Catalog not found
          </Title>
          <EmptyStateBody>
            {catalogError instanceof Error
              ? catalogError.message
              : "The catalog you're looking for doesn't exist or you don't have permission to view it."}
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

  const toolbar = (
    <Toolbar>
      <ToolbarContent>
        <ToolbarGroup>
          <ToolbarItem>
            <InputGroup>
              <InputGroupItem isFill>
                <TextInput
                  type="search"
                  placeholder="Search catalog items..."
                  value={searchTerm}
                  onChange={(_event, value) => handleSearch(value)}
                  aria-label="Search catalog items"
                />
              </InputGroupItem>
              <InputGroupItem>
                <Button
                  variant="control"
                  icon={<SearchIcon />}
                  aria-label="Search"
                />
              </InputGroupItem>
            </InputGroup>
          </ToolbarItem>
        </ToolbarGroup>

        <ToolbarGroup align={{ default: 'alignEnd' }}>
          <ToolbarItem>
            <Flex spaceItems={{ default: 'spaceItemsSm' }}>
              <FlexItem>
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'secondary'}
                  icon={<ThIcon />}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                />
              </FlexItem>
              <FlexItem>
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'secondary'}
                  icon={<ListIcon />}
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                />
              </FlexItem>
            </Flex>
          </ToolbarItem>
        </ToolbarGroup>
      </ToolbarContent>
    </Toolbar>
  );

  const renderCatalogItems = () => {
    if (catalogItems.length === 0) {
      return (
        <EmptyState icon={CatalogIcon}>
          <Title headingLevel="h4" size="lg">
            No Catalog Items
          </Title>
          <EmptyStateBody>
            {searchTerm
              ? `No catalog items found matching "${searchTerm}".`
              : "This catalog doesn't have any items yet."}
          </EmptyStateBody>
          {searchTerm && (
            <Button variant="primary" onClick={() => handleSearch('')}>
              Clear Search
            </Button>
          )}
        </EmptyState>
      );
    }

    if (viewMode === 'grid') {
      return (
        <Grid hasGutter>
          {catalogItems.map((item) => (
            <GridItem key={item.id} span={12} md={6} lg={4}>
              <CatalogItemCard
                catalogItem={item}
                onSelect={handleItemSelect}
                onViewDetails={handleItemViewDetails}
              />
            </GridItem>
          ))}
        </Grid>
      );
    }

    return (
      <Stack hasGutter>
        {catalogItems.map((item) => (
          <StackItem key={item.id}>
            <CatalogItemCard
              catalogItem={item}
              onSelect={handleItemSelect}
              onViewDetails={handleItemViewDetails}
            />
          </StackItem>
        ))}
      </Stack>
    );
  };

  return (
    <PageSection>
      <Stack hasGutter>
        <StackItem>
          <Breadcrumb>
            <BreadcrumbItem>
              <Link to={ROUTES.ORGANIZATIONS}>Organizations</Link>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <Link
                to={`/organizations/${catalog.orgId || catalog.org?.id?.split(':').pop()}`}
              >
                {catalog.orgName || 'Organization'}
              </Link>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <Link to={`/catalogs/${catalog.id}`}>{catalog.name}</Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>Catalog Items</BreadcrumbItem>
          </Breadcrumb>
        </StackItem>

        <StackItem>
          <Flex
            justifyContent={{ default: 'justifyContentSpaceBetween' }}
            alignItems={{ default: 'alignItemsCenter' }}
          >
            <FlexItem>
              <Stack>
                <StackItem>
                  <Title headingLevel="h1" size="xl">
                    {catalog.name} - Catalog Items
                  </Title>
                </StackItem>
                <StackItem>
                  <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                    <FlexItem>
                      <p className="pf-v6-u-color-200">
                        {catalog.description || 'No description available'}
                      </p>
                    </FlexItem>
                    <FlexItem>
                      <Badge color={catalog.isPublished ? 'blue' : 'grey'}>
                        {catalog.isPublished ? 'Published' : 'Private'}
                      </Badge>
                    </FlexItem>
                  </Flex>
                </StackItem>
              </Stack>
            </FlexItem>
            <FlexItem>
              <Button
                variant="secondary"
                onClick={() => navigate(`/catalogs/${catalog.id}`)}
              >
                View Catalog Details
              </Button>
            </FlexItem>
          </Flex>
        </StackItem>

        {itemsError && (
          <StackItem>
            <Alert
              variant={AlertVariant.danger}
              title="Error loading catalog items"
              isInline
            >
              {(itemsError as Error)?.message || 'Failed to load catalog items'}
            </Alert>
          </StackItem>
        )}

        <StackItem>
          <Card>
            <CardBody>
              <Stack hasGutter>
                <StackItem>{toolbar}</StackItem>

                <StackItem>
                  {isItemsLoading ? (
                    <LoadingSpinner message="Loading catalog items..." />
                  ) : (
                    renderCatalogItems()
                  )}
                </StackItem>

                {totalItems > pageSize && (
                  <StackItem>
                    <Pagination
                      itemCount={totalItems}
                      perPage={pageSize}
                      page={page}
                      onSetPage={handlePageChange}
                      onPerPageSelect={handlePerPageSelect}
                      variant={PaginationVariant.bottom}
                      perPageOptions={[
                        { title: '10', value: 10 },
                        { title: '20', value: 20 },
                        { title: '50', value: 50 },
                        { title: '100', value: 100 },
                      ]}
                    />
                  </StackItem>
                )}
              </Stack>
            </CardBody>
          </Card>
        </StackItem>
      </Stack>
    </PageSection>
  );
};

export default CatalogItems;
