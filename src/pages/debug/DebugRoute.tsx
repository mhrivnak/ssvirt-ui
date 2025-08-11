import React from 'react';
import {
  PageSection,
  Title,
  Alert,
  AlertVariant,
} from '@patternfly/react-core';
import { useLocation } from 'react-router-dom';

const DebugRoute: React.FC = () => {
  const location = useLocation();

  return (
    <PageSection>
      <Title headingLevel="h1" size="xl">
        Debug Route Test
      </Title>
      <Alert variant={AlertVariant.success} title="Route Working!" isInline>
        <p>This debug route is working properly!</p>
        <p>
          <strong>Current path:</strong> {location.pathname}
        </p>
        <p>
          <strong>Search:</strong> {location.search}
        </p>
        <p>
          <strong>Hash:</strong> {location.hash}
        </p>
      </Alert>
    </PageSection>
  );
};

export default DebugRoute;
