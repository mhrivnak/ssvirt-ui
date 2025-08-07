import React from 'react';
import { PageSection, Title } from '@patternfly/react-core';

const VMs: React.FC = () => {
  return (
    <PageSection>
      <Title headingLevel="h1" size="lg">
        Virtual Machines
      </Title>
      <p>VM management will be implemented in a future PR.</p>
    </PageSection>
  );
};

export default VMs;
