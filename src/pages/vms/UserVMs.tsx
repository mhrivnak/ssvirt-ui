import React from 'react';
import {
  PageSection,
  Title,
  Alert,
  AlertVariant,
} from '@patternfly/react-core';

const UserVMs: React.FC = () => {
  return (
    <PageSection>
      <Title headingLevel="h1" size="xl">
        My Virtual Machines
      </Title>
      <Alert variant={AlertVariant.info} title="Feature Coming Soon">
        User VM management features will be available in a future update.
      </Alert>
    </PageSection>
  );
};

export default UserVMs;
