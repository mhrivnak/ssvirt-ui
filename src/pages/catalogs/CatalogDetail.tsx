import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  Stack,
  StackItem,
  Badge,
  Split,
  SplitItem,
  Alert,
  AlertVariant,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Breadcrumb,
  BreadcrumbItem,
  Tabs,
  Tab,
  TabTitleText,
  Grid,
  GridItem,
  SearchInput,
  Pagination,
  EmptyState,
  EmptyStateVariant,
  EmptyStateBody,
} from '@patternfly/react-core';
import { VirtualMachineIcon } from '@patternfly/react-icons';
import { useCatalog, useCatalogItems } from '../../hooks/useCatalogs';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ROUTES } from '../../utils/constants';
import type { CatalogItemQueryParams } from '../../types';

const CatalogDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTabKey, setActiveTabKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const {
    data: catalog,
    isLoading: catalogLoading,
    error: catalogError,
  } = useCatalog(id || '');

  // Catalog items query parameters
  const catalogItemsParams: CatalogItemQueryParams = {
    page,
    pageSize,
  };

  const {
    data: catalogItemsResponse,
    isLoading: catalogItemsLoading,
    error: catalogItemsError,
  } = useCatalogItems(id || '', catalogItemsParams);

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

  if (catalogError) {
    return (
      <PageSection>
        <Alert
          variant={AlertVariant.danger}
          title="Error loading catalog"
          isInline
        >
          {catalogError instanceof Error
            ? catalogError.message
            : 'Failed to load catalog details. Please try again.'}
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

  return (
    <PageSection>
      <Stack hasGutter>
        {/* Breadcrumb */}
        <StackItem>
          <Breadcrumb>
            <BreadcrumbItem>
              <Link to={ROUTES.DASHBOARD}>Dashboard</Link>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <Link to={ROUTES.CATALOGS || '/catalogs'}>Catalogs</Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{catalog.name}</BreadcrumbItem>
          </Breadcrumb>
        </StackItem>

        {/* Header */}
        <StackItem>
          <Split hasGutter>
            <SplitItem isFilled>
              <Title headingLevel="h1" size="2xl">
                {catalog.name}
              </Title>
              <p>{catalog.description || 'No description available.'}</p>
            </SplitItem>
            <SplitItem>
              <Stack>
                <StackItem>
                  <Badge color={catalog.isPublished ? 'blue' : 'grey'}>
                    {catalog.isPublished ? 'Published' : 'Private'}
                  </Badge>
                </StackItem>
                <StackItem>
                  <Badge color="green">
                    {catalog.numberOfVAppTemplates} Templates
                  </Badge>
                </StackItem>
              </Stack>
            </SplitItem>
          </Split>
        </StackItem>

        {/* Tabs */}
        <StackItem>
          <Tabs
            activeKey={activeTabKey}
            onSelect={(_, tabIndex) => setActiveTabKey(tabIndex as number)}
            aria-label="Catalog details tabs"
          >
            <Tab eventKey={0} title={<TabTitleText>Overview</TabTitleText>}>
              <Card>
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
                        {catalog.org.id}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>
                        Publication Status
                      </DescriptionListTerm>
                      <DescriptionListDescription>
                        <Badge color={catalog.isPublished ? 'blue' : 'grey'}>
                          {catalog.isPublished ? 'Published' : 'Private'}
                        </Badge>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>
                        Subscription Status
                      </DescriptionListTerm>
                      <DescriptionListDescription>
                        <Badge color={catalog.isSubscribed ? 'blue' : 'grey'}>
                          {catalog.isSubscribed
                            ? 'Subscribed'
                            : 'Not Subscribed'}
                        </Badge>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>
                        Number of Templates
                      </DescriptionListTerm>
                      <DescriptionListDescription>
                        {catalog.numberOfVAppTemplates}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Local Catalog</DescriptionListTerm>
                      <DescriptionListDescription>
                        <Badge color={catalog.isLocal ? 'green' : 'orange'}>
                          {catalog.isLocal ? 'Yes' : 'No'}
                        </Badge>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Version</DescriptionListTerm>
                      <DescriptionListDescription>
                        {catalog.version}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Created</DescriptionListTerm>
                      <DescriptionListDescription>
                        {new Date(catalog.creationDate).toLocaleString()}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </CardBody>
              </Card>
            </Tab>
            <Tab
              eventKey={1}
              title={
                <TabTitleText>
                  Templates ({catalog.numberOfVAppTemplates})
                </TabTitleText>
              }
            >
              <Stack hasGutter>
                {/* Search */}
                <StackItem>
                  <Card>
                    <CardBody>
                      <SearchInput
                        placeholder="Search templates..."
                        value={searchTerm}
                        onChange={(_, value) => setSearchTerm(value)}
                        onClear={() => setSearchTerm('')}
                      />
                    </CardBody>
                  </Card>
                </StackItem>

                {/* Catalog Items */}
                <StackItem>
                  {catalogItemsLoading ? (
                    <LoadingSpinner message="Loading templates..." />
                  ) : catalogItemsError ? (
                    <Alert
                      variant={AlertVariant.danger}
                      title="Error loading templates"
                      isInline
                    >
                      {catalogItemsError instanceof Error
                        ? catalogItemsError.message
                        : 'Failed to load catalog templates. Please try again.'}
                    </Alert>
                  ) : !catalogItemsResponse?.values?.length ? (
                    <EmptyState variant={EmptyStateVariant.lg}>
                      <VirtualMachineIcon style={{ fontSize: '64px' }} />
                      <Title headingLevel="h2" size="lg">
                        No templates found
                      </Title>
                      <EmptyStateBody>
                        {searchTerm
                          ? 'No templates match your search criteria. Try adjusting your search.'
                          : 'This catalog does not contain any templates yet.'}
                      </EmptyStateBody>
                    </EmptyState>
                  ) : (
                    <Stack hasGutter>
                      <StackItem>
                        <Grid hasGutter>
                          {catalogItemsResponse.values
                            ?.filter(
                              (item) =>
                                !searchTerm ||
                                item.name
                                  .toLowerCase()
                                  .includes(searchTerm.toLowerCase()) ||
                                item.description
                                  .toLowerCase()
                                  .includes(searchTerm.toLowerCase())
                            )
                            .map((item) => (
                              <GridItem key={item.id} span={6}>
                                <Card isSelectable>
                                  <CardBody>
                                    <Stack hasGutter>
                                      <StackItem>
                                        <Split>
                                          <SplitItem>
                                            <VirtualMachineIcon
                                              style={{ fontSize: '24px' }}
                                            />
                                          </SplitItem>
                                          <SplitItem isFilled>
                                            <Title headingLevel="h4" size="md">
                                              {item.name}
                                            </Title>
                                          </SplitItem>
                                          <SplitItem>
                                            <Badge color="blue">
                                              v{item.versionNumber}
                                            </Badge>
                                          </SplitItem>
                                        </Split>
                                      </StackItem>
                                      <StackItem>
                                        <p className="pf-v6-u-color-200">
                                          {item.description}
                                        </p>
                                      </StackItem>
                                      <StackItem>
                                        <Stack>
                                          <StackItem>
                                            <Badge>
                                              {
                                                item.entity.templateSpec
                                                  .parameters.length
                                              }{' '}
                                              parameters
                                            </Badge>
                                          </StackItem>
                                          <StackItem>
                                            <small className="pf-v6-u-color-200">
                                              Created:{' '}
                                              {new Date(
                                                item.creationDate
                                              ).toLocaleDateString()}
                                            </small>
                                          </StackItem>
                                        </Stack>
                                      </StackItem>
                                    </Stack>
                                  </CardBody>
                                </Card>
                              </GridItem>
                            ))}
                        </Grid>
                      </StackItem>

                      {/* Pagination */}
                      {catalogItemsResponse?.pageCount &&
                        catalogItemsResponse.pageCount > 1 && (
                          <StackItem>
                            <Pagination
                              itemCount={catalogItemsResponse?.resultTotal || 0}
                              page={page}
                              perPage={pageSize}
                              onSetPage={(_, newPage) => setPage(newPage)}
                              variant="bottom"
                            />
                          </StackItem>
                        )}
                    </Stack>
                  )}
                </StackItem>
              </Stack>
            </Tab>
          </Tabs>
        </StackItem>
      </Stack>
    </PageSection>
  );
};

export default CatalogDetail;
