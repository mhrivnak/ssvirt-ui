import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  PageSection,
  Title,
  Alert,
  AlertVariant,
} from '@patternfly/react-core';
import { Users, UserDetail, UserForm } from '../users';

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
      <Route path="users" element={<Users />} />
      <Route path="users/create" element={<UserForm />} />
      <Route path="users/:id" element={<UserDetail />} />
      <Route path="users/:id/edit" element={<UserForm />} />
      <Route path="roles" element={<AdminRoles />} />
      <Route path="settings" element={<AdminSettings />} />
      <Route path="monitoring" element={<AdminMonitoring />} />
      <Route path="" element={<Navigate to="users" replace />} />
    </Routes>
  );
};

export default AdminRoutes;
