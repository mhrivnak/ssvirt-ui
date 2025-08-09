import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  PageSection,
  Title,
  Alert,
  AlertVariant,
} from '@patternfly/react-core';

const AdminUsers: React.FC = () => (
  <PageSection>
    <Title headingLevel="h1" size="xl">
      System User Management
    </Title>
    <Alert variant={AlertVariant.info} title="Feature Coming Soon">
      System user management features will be available in a future update.
    </Alert>
  </PageSection>
);

const AdminRoles: React.FC = () => (
  <PageSection>
    <Title headingLevel="h1" size="xl">
      Roles & Permissions
    </Title>
    <Alert variant={AlertVariant.info} title="Feature Coming Soon">
      Role and permission management features will be available in a future
      update.
    </Alert>
  </PageSection>
);

const AdminSettings: React.FC = () => (
  <PageSection>
    <Title headingLevel="h1" size="xl">
      System Settings
    </Title>
    <Alert variant={AlertVariant.info} title="Feature Coming Soon">
      System settings management will be available in a future update.
    </Alert>
  </PageSection>
);

const AdminMonitoring: React.FC = () => (
  <PageSection>
    <Title headingLevel="h1" size="xl">
      System Monitoring
    </Title>
    <Alert variant={AlertVariant.info} title="Feature Coming Soon">
      System monitoring features will be available in a future update.
    </Alert>
  </PageSection>
);

const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="users/*" element={<AdminUsers />} />
      <Route path="roles" element={<AdminRoles />} />
      <Route path="settings" element={<AdminSettings />} />
      <Route path="monitoring" element={<AdminMonitoring />} />
      <Route path="" element={<Navigate to="users" replace />} />
    </Routes>
  );
};

export default AdminRoutes;
