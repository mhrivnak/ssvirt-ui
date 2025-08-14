import React from 'react';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  Stack,
  StackItem,
  Split,
  SplitItem,
  Badge,
  Alert,
  AlertVariant,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Breadcrumb,
  BreadcrumbItem,
  Button,
} from '@patternfly/react-core';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCatalog, useCatalogItem } from '../../hooks';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ROUTES } from '../../utils/constants';

const CatalogItemDetail: React.FC = () => {
  const { catalogId, itemId } = useParams<{
    catalogId: string;
    itemId: string;
  }>();
  const navigate = useNavigate();

  const {
    data: catalog,
    isLoading: catalogLoading,
    error: catalogError,
  } = useCatalog(catalogId || '');

  const {
    data: catalogItem,
    isLoading: itemLoading,
    error: itemError,
  } = useCatalogItem(catalogId || '', itemId || '');

  // Handle missing parameters
  if (!catalogId || !itemId) {
    return (
      <PageSection>
        <Alert
          variant={AlertVariant.warning}
          title="Invalid parameters"
          isInline
        >
          Both catalog ID and item ID are required.
        </Alert>
      </PageSection>
    );
  }

  // Handle catalog loading and errors
  if (catalogLoading) {
    return (
      <PageSection>
        <LoadingSpinner message="Loading catalog..." />
      </PageSection>
    );
  }

  if (catalogError || !catalog) {
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

  // Handle item loading and errors
  if (itemLoading) {
    return (
      <PageSection>
        <Stack hasGutter>
          {/* Breadcrumb */}
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
                <Link to={ROUTES.CATALOG_DETAIL.replace(':id', catalog.id)}>
                  {catalog.name}
                </Link>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <Link
                  to={ROUTES.CATALOG_ITEMS.replace(':catalogId', catalog.id)}
                >
                  Catalog Items
                </Link>
              </BreadcrumbItem>
              <BreadcrumbItem isActive>Loading...</BreadcrumbItem>
            </Breadcrumb>
          </StackItem>
          <StackItem>
            <LoadingSpinner message="Loading catalog item..." />
          </StackItem>
        </Stack>
      </PageSection>
    );
  }

  if (itemError || !catalogItem) {
    return (
      <PageSection>
        <Stack hasGutter>
          {/* Breadcrumb */}
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
                <Link to={ROUTES.CATALOG_DETAIL.replace(':id', catalog.id)}>
                  {catalog.name}
                </Link>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <Link
                  to={ROUTES.CATALOG_ITEMS.replace(':catalogId', catalog.id)}
                >
                  Catalog Items
                </Link>
              </BreadcrumbItem>
              <BreadcrumbItem isActive>Item Not Found</BreadcrumbItem>
            </Breadcrumb>
          </StackItem>
          <StackItem>
            <Alert
              variant={AlertVariant.danger}
              title="Error loading catalog item"
              isInline
            >
              {itemError instanceof Error
                ? itemError.message
                : 'Failed to load catalog item details. Please try again.'}
            </Alert>
          </StackItem>
        </Stack>
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
              <Link to={ROUTES.CATALOG_DETAIL.replace(':id', catalog.id)}>
                {catalog.name}
              </Link>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <Link to={ROUTES.CATALOG_ITEMS.replace(':catalogId', catalog.id)}>
                Catalog Items
              </Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{catalogItem.name}</BreadcrumbItem>
          </Breadcrumb>
        </StackItem>

        {/* Header */}
        <StackItem>
          <Split hasGutter>
            <SplitItem isFilled>
              <Title headingLevel="h1" size="2xl">
                {catalogItem.name}
              </Title>
              <p>{catalogItem.description || 'No description available.'}</p>
            </SplitItem>
            <SplitItem>
              <Stack>
                {catalogItem.status && (
                  <StackItem>
                    <Badge
                      color={
                        catalogItem.status.toLowerCase() === 'resolved'
                          ? 'green'
                          : 'orange'
                      }
                    >
                      {catalogItem.status}
                    </Badge>
                  </StackItem>
                )}
                {catalogItem.versionNumber && (
                  <StackItem>
                    <Badge color="blue">v{catalogItem.versionNumber}</Badge>
                  </StackItem>
                )}
              </Stack>
            </SplitItem>
          </Split>
        </StackItem>

        {/* Details Card */}
        <StackItem>
          <Card>
            <CardBody>
              <DescriptionList>
                <DescriptionListGroup>
                  <DescriptionListTerm>Name</DescriptionListTerm>
                  <DescriptionListDescription>
                    {catalogItem.name}
                  </DescriptionListDescription>
                </DescriptionListGroup>

                <DescriptionListGroup>
                  <DescriptionListTerm>Description</DescriptionListTerm>
                  <DescriptionListDescription>
                    {catalogItem.description || 'No description available.'}
                  </DescriptionListDescription>
                </DescriptionListGroup>

                <DescriptionListGroup>
                  <DescriptionListTerm>Catalog</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Link to={ROUTES.CATALOG_DETAIL.replace(':id', catalog.id)}>
                      {catalog.name}
                    </Link>
                  </DescriptionListDescription>
                </DescriptionListGroup>

                {catalogItem.entity?.name && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Template Name</DescriptionListTerm>
                    <DescriptionListDescription>
                      {catalogItem.entity.name}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}

                {catalogItem.entity?.description && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>
                      Template Description
                    </DescriptionListTerm>
                    <DescriptionListDescription>
                      {catalogItem.entity.description}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}

                {catalogItem.status && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Status</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Badge
                        color={
                          catalogItem.status.toLowerCase() === 'resolved'
                            ? 'green'
                            : 'orange'
                        }
                      >
                        {catalogItem.status}
                      </Badge>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}

                {catalogItem.versionNumber && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Version</DescriptionListTerm>
                    <DescriptionListDescription>
                      {catalogItem.versionNumber}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}

                {catalogItem.creationDate && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Created</DescriptionListTerm>
                    <DescriptionListDescription>
                      {new Date(catalogItem.creationDate).toLocaleString()}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}

                {catalogItem.modificationDate && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Last Modified</DescriptionListTerm>
                    <DescriptionListDescription>
                      {new Date(catalogItem.modificationDate).toLocaleString()}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}
              </DescriptionList>
            </CardBody>
          </Card>
        </StackItem>

        {/* Actions */}
        <StackItem>
          <Split hasGutter>
            <SplitItem>
              <Button
                variant="secondary"
                onClick={() =>
                  navigate(
                    ROUTES.CATALOG_ITEMS.replace(':catalogId', catalogId)
                  )
                }
              >
                Back to Catalog Items
              </Button>
            </SplitItem>
            <SplitItem>
              <Button
                variant="primary"
                onClick={() => {
                  console.log('Deploy catalog item:', catalogItem);
                  // TODO: Implement deployment logic
                }}
              >
                Deploy Template
              </Button>
            </SplitItem>
          </Split>
        </StackItem>
      </Stack>
    </PageSection>
  );
};

export default CatalogItemDetail;
