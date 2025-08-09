import React from 'react';
import {
  PageSection,
  Title,
  Alert,
  AlertVariant,
} from '@patternfly/react-core';

const VDCUsers: React.FC = () => {
  return (
    <PageSection>
      <Title headingLevel="h1" size="xl">
        VDC User Management
      </Title>
      <Alert variant={AlertVariant.info} title="Feature Deprecated" isInline>
        VDC-specific user management has been deprecated. User access is now
        managed at the organization level with role-based permissions.
      </Alert>
    </PageSection>
  );
};

export default VDCUsers;
