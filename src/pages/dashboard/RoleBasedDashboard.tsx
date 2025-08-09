import React from 'react';
import { useRole } from '../../hooks/useRole';
import { SystemAdminDashboard } from './SystemAdminDashboard';
import { OrgAdminDashboard } from './OrgAdminDashboard';
import { VAppUserDashboard } from './VAppUserDashboard';
import { ROLE_NAMES } from '../../types';
import { 
  PageSection,
  Alert,
  AlertVariant,
  Spinner,
  Bullseye 
} from '@patternfly/react-core';

/**
 * Main dashboard component that renders the appropriate role-specific dashboard
 */
export const RoleBasedDashboard: React.FC = () => {
  const { activeRole, capabilities, isLoading, sessionData } = useRole();

  if (isLoading) {
    return (
      <PageSection>
        <Bullseye>
          <Spinner size="xl" />
        </Bullseye>
      </PageSection>
    );
  }

  if (!sessionData) {
    return (
      <PageSection>
        <Alert variant={AlertVariant.danger} title="Authentication Error">
          Unable to load session data. Please log in again.
        </Alert>
      </PageSection>
    );
  }

  // Route to appropriate dashboard based on active role
  if (activeRole === ROLE_NAMES.SYSTEM_ADMIN && capabilities.canManageSystem) {
    return <SystemAdminDashboard />;
  }

  if (activeRole === ROLE_NAMES.ORG_ADMIN && capabilities.canManageOrganizations) {
    return <OrgAdminDashboard />;
  }

  if (activeRole === ROLE_NAMES.VAPP_USER) {
    return <VAppUserDashboard />;
  }

  // Fallback for unknown roles
  return (
    <PageSection>
      <Alert variant={AlertVariant.warning} title="Unknown Role">
        Your role "{activeRole}" is not recognized. Please contact your administrator.
      </Alert>
    </PageSection>
  );
};