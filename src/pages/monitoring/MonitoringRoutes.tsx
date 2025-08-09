import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  PageSection,
  Title,
  Alert,
  AlertVariant,
} from '@patternfly/react-core';

const ReportsOverview: React.FC = () => (
  <PageSection>
    <Title headingLevel="h1" size="xl">
      Reports & Analytics
    </Title>
    <Alert variant={AlertVariant.info} title="Feature Coming Soon">
      Reporting and analytics features will be available in a future update.
    </Alert>
  </PageSection>
);

const MonitoringRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="" element={<ReportsOverview />} />
      <Route path="*" element={<Navigate to="" replace />} />
    </Routes>
  );
};

export default MonitoringRoutes;
