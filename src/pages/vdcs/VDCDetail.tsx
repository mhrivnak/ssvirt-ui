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
  Button,
  Badge,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Alert,
  AlertVariant,
  Breadcrumb,
  BreadcrumbItem,
} from '@patternfly/react-core';
import { NetworkIcon, EditIcon } from '@patternfly/react-icons';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useVDC, useUserPermissions } from '../../hooks';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ROUTES } from '../../utils/constants';

const VDCDetail: React.FC = () => {
  const { orgId, vdcId } = useParams<{ orgId: string; vdcId: string }>();
  const navigate = useNavigate();
  const { data: userPermissions } = useUserPermissions();

  // Call hooks before any early returns - use role-based API routing
  const {
    data: vdc,
    isLoading,
    error,
  } = useVDC(
    userPermissions?.canManageSystem ? orgId || '' : vdcId || '',
    userPermissions?.canManageSystem ? vdcId : undefined
  );

  // Check if user has permission to view VDCs
  if (!userPermissions?.canViewVDCs) {
    return (
      <PageSection>
        <Alert variant={AlertVariant.warning} title="Access Denied" isInline>
          You don't have permission to view Virtual Data Center details.
        </Alert>
      </PageSection>
    );
  }

  // For admin users, both orgId and vdcId are required. For regular users, only vdcId is needed
  if (
    (userPermissions?.canManageSystem && (!orgId || !vdcId)) ||
    (!userPermissions?.canManageSystem && !vdcId)
  ) {
    return (
      <PageSection>
        <Alert
          variant={AlertVariant.danger}
          title="Invalid Parameters"
          isInline
        >
          Organization ID and VDC ID are required.
        </Alert>
      </PageSection>
    );
  }

  if (isLoading) {
    return (
      <PageSection>
        <LoadingSpinner />
      </PageSection>
    );
  }

  if (error) {
    return (
      <PageSection>
        <Alert variant={AlertVariant.danger} title="Error Loading VDC" isInline>
          {error instanceof Error ? error.message : 'Unknown error occurred'}
        </Alert>
      </PageSection>
    );
  }

  if (!vdc) {
    return (
      <PageSection>
        <Alert variant={AlertVariant.warning} title="VDC Not Found" isInline>
          The requested Virtual Data Center could not be found.
        </Alert>
      </PageSection>
    );
  }

  const formatResourceCapacity = (capacity: {
    allocated: number;
    limit: number;
    units: string;
  }) => {
    return `${capacity.allocated.toLocaleString()} / ${capacity.limit.toLocaleString()} ${capacity.units}`;
  };

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
              <Link to={ROUTES.ORGANIZATIONS}>Organizations</Link>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <Link to={`${ROUTES.ORGANIZATIONS}/${orgId}/vdcs`}>
                Virtual Data Centers
              </Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{vdc.name}</BreadcrumbItem>
          </Breadcrumb>
        </StackItem>

        {/* Header */}
        <StackItem>
          <Split hasGutter>
            <SplitItem>
              <NetworkIcon />
            </SplitItem>
            <SplitItem isFilled>
              <Title headingLevel="h1" size="xl">
                {vdc.name}
              </Title>
              {vdc.description && (
                <p className="pf-v6-u-color-200">{vdc.description}</p>
              )}
            </SplitItem>
            <SplitItem>
              <Button
                variant="primary"
                icon={<EditIcon />}
                onClick={() =>
                  navigate(
                    `${ROUTES.ORGANIZATIONS}/${orgId}/vdcs/${vdcId}/edit`
                  )
                }
              >
                Edit VDC
              </Button>
            </SplitItem>
          </Split>
        </StackItem>

        {/* VDC Details */}
        <StackItem>
          <Card>
            <CardBody>
              <Title headingLevel="h2" size="lg">
                VDC Configuration
              </Title>
              <DescriptionList isHorizontal>
                <DescriptionListGroup>
                  <DescriptionListTerm>Status</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Badge color={vdc.isEnabled ? 'green' : 'red'}>
                      {vdc.isEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </DescriptionListDescription>
                </DescriptionListGroup>

                <DescriptionListGroup>
                  <DescriptionListTerm>Allocation Model</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Badge color="blue">{vdc.allocationModel}</Badge>
                  </DescriptionListDescription>
                </DescriptionListGroup>

                <DescriptionListGroup>
                  <DescriptionListTerm>CPU Capacity</DescriptionListTerm>
                  <DescriptionListDescription>
                    {formatResourceCapacity(vdc.computeCapacity.cpu)}
                  </DescriptionListDescription>
                </DescriptionListGroup>

                <DescriptionListGroup>
                  <DescriptionListTerm>Memory Capacity</DescriptionListTerm>
                  <DescriptionListDescription>
                    {formatResourceCapacity(vdc.computeCapacity.memory)}
                  </DescriptionListDescription>
                </DescriptionListGroup>

                <DescriptionListGroup>
                  <DescriptionListTerm>NIC Quota</DescriptionListTerm>
                  <DescriptionListDescription>
                    {vdc.nicQuota}
                  </DescriptionListDescription>
                </DescriptionListGroup>

                <DescriptionListGroup>
                  <DescriptionListTerm>Network Quota</DescriptionListTerm>
                  <DescriptionListDescription>
                    {vdc.networkQuota}
                  </DescriptionListDescription>
                </DescriptionListGroup>

                <DescriptionListGroup>
                  <DescriptionListTerm>Thin Provisioning</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Badge color={vdc.isThinProvision ? 'green' : 'grey'}>
                      {vdc.isThinProvision ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </DescriptionListDescription>
                </DescriptionListGroup>

                <DescriptionListGroup>
                  <DescriptionListTerm>Provider VDC</DescriptionListTerm>
                  <DescriptionListDescription>
                    <code>{vdc.providerVdc.id}</code>
                  </DescriptionListDescription>
                </DescriptionListGroup>

                {vdc.creationDate && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Created</DescriptionListTerm>
                    <DescriptionListDescription>
                      {new Date(vdc.creationDate).toLocaleString()}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}

                {vdc.lastModified && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Last Modified</DescriptionListTerm>
                    <DescriptionListDescription>
                      {new Date(vdc.lastModified).toLocaleString()}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}
              </DescriptionList>
            </CardBody>
          </Card>
        </StackItem>

        {/* Storage Profile */}
        <StackItem>
          <Card>
            <CardBody>
              <Title headingLevel="h2" size="lg">
                Storage Profile
              </Title>
              <DescriptionList isHorizontal>
                <DescriptionListGroup>
                  <DescriptionListTerm>Storage Profile ID</DescriptionListTerm>
                  <DescriptionListDescription>
                    <code>{vdc.vdcStorageProfiles[0]?.id || 'N/A'}</code>
                  </DescriptionListDescription>
                </DescriptionListGroup>

                <DescriptionListGroup>
                  <DescriptionListTerm>Storage Limit</DescriptionListTerm>
                  <DescriptionListDescription>
                    {vdc.vdcStorageProfiles[0]?.limit.toLocaleString() || 'N/A'}{' '}
                    {vdc.vdcStorageProfiles[0]?.units || ''}
                  </DescriptionListDescription>
                </DescriptionListGroup>

                <DescriptionListGroup>
                  <DescriptionListTerm>Default Profile</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Badge
                      color={
                        vdc.vdcStorageProfiles[0]?.default ? 'green' : 'grey'
                      }
                    >
                      {vdc.vdcStorageProfiles[0]?.default ? 'Yes' : 'No'}
                    </Badge>
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </CardBody>
          </Card>
        </StackItem>

        {/* Placeholder for future VMs, Users, etc. */}
        <StackItem>
          <Alert
            variant={AlertVariant.info}
            title="Additional Features Coming Soon"
            isInline
          >
            VM management, user access, and resource monitoring for this VDC
            will be available in a future update.
          </Alert>
        </StackItem>
      </Stack>
    </PageSection>
  );
};

export default VDCDetail;
