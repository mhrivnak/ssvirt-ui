import React from 'react';
import {
  PageSection,
  Title,
  Alert,
  AlertVariant,
  Breadcrumb,
  BreadcrumbItem,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { Link, useParams } from 'react-router-dom';
import { useRole } from '../../hooks/useRole';
import { ROUTES } from '../../utils/constants';

const VDCForm: React.FC = () => {
  const { orgId, vdcId } = useParams<{ orgId: string; vdcId?: string }>();
  const { capabilities } = useRole();
  const isEditing = !!vdcId;

  // Check if user has system admin privileges
  if (!capabilities.canManageSystem) {
    return (
      <PageSection>
        <Alert variant={AlertVariant.warning} title="Access Denied" isInline>
          Only System Administrators can manage Virtual Data Centers.
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
              <Link to={ROUTES.ORGANIZATIONS}>Organizations</Link>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <Link to={`${ROUTES.ORGANIZATIONS}/${orgId}/vdcs`}>
                Virtual Data Centers
              </Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>
              {isEditing ? 'Edit VDC' : 'Create VDC'}
            </BreadcrumbItem>
          </Breadcrumb>
        </StackItem>

        {/* Header */}
        <StackItem>
          <Title headingLevel="h1" size="xl">
            {isEditing
              ? 'Edit Virtual Data Center'
              : 'Create Virtual Data Center'}
          </Title>
        </StackItem>

        {/* Coming Soon Notice */}
        <StackItem>
          <Alert
            variant={AlertVariant.info}
            title="Feature Coming Soon"
            isInline
          >
            VDC creation and editing forms will be available in a future update.
            This feature requires integration with provider VDCs and storage
            profiles.
          </Alert>
        </StackItem>
      </Stack>
    </PageSection>
  );
};

export default VDCForm;
