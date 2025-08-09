import React from 'react';
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
} from '@patternfly/react-core';
import { useCatalog } from '../../hooks/useCatalogs';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ROUTES } from '../../utils/constants';

const CatalogDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const {
    data: catalog,
    isLoading: catalogLoading,
    error: catalogError,
  } = useCatalog(id || '');

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

        {/* Catalog Details */}
        <StackItem>
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
                  <DescriptionListTerm>Publication Status</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Badge color={catalog.isPublished ? 'blue' : 'grey'}>
                      {catalog.isPublished ? 'Published' : 'Private'}
                    </Badge>
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Subscription Status</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Badge color={catalog.isSubscribed ? 'blue' : 'grey'}>
                      {catalog.isSubscribed ? 'Subscribed' : 'Not Subscribed'}
                    </Badge>
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Number of Templates</DescriptionListTerm>
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
        </StackItem>
      </Stack>
    </PageSection>
  );
};

export default CatalogDetail;
