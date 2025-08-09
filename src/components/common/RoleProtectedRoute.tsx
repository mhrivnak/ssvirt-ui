import React from 'react';
import {
  PageSection,
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateActions,
  Title,
} from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import { Navigate, useLocation } from 'react-router-dom';
import { useRole } from '../../hooks/useRole';
import {
  canAccessRoute,
  getDefaultRouteForUser,
} from '../../utils/routeProtection';
import type { RouteConfig } from '../../utils/routeProtection';
import LoadingSpinner from './LoadingSpinner';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  route: RouteConfig;
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  children,
  route,
}) => {
  const { sessionData, capabilities, isLoading } = useRole();
  const location = useLocation();

  if (isLoading) {
    return (
      <PageSection>
        <LoadingSpinner />
      </PageSection>
    );
  }

  if (!sessionData) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRoles = sessionData.roles;
  const hasAccess = canAccessRoute(route, userRoles, capabilities);

  if (!hasAccess) {
    // Show access denied page
    return (
      <PageSection>
        <EmptyState>
          <ExclamationTriangleIcon />
          <Title headingLevel="h4" size="lg">
            Access Denied
          </Title>
          <EmptyStateBody>
            You don't have permission to access this page. Your current role "
            {userRoles.join(', ')}" doesn't have the required permissions.
          </EmptyStateBody>
          <EmptyStateActions>
            <Button variant="primary" onClick={() => window.history.back()}>
              Go Back
            </Button>
            <Button
              variant="link"
              component="a"
              href={getDefaultRouteForUser(userRoles)}
            >
              Go to Dashboard
            </Button>
          </EmptyStateActions>
        </EmptyState>
      </PageSection>
    );
  }

  return <>{children}</>;
};

interface RequireRoleProps {
  children: React.ReactNode;
  roles?: string[];
  capabilities?: string[];
  fallback?: React.ReactNode;
}

/**
 * Component that conditionally renders content based on user roles/capabilities
 */
export const RequireRole: React.FC<RequireRoleProps> = ({
  children,
  roles,
  capabilities: requiredCapabilities,
  fallback = null,
}) => {
  const { sessionData, capabilities } = useRole();

  if (!sessionData) {
    return <>{fallback}</>;
  }

  const userRoles = sessionData.roles;

  // Check roles
  if (roles && roles.length > 0) {
    const hasRole = roles.some((role) => userRoles.includes(role));
    if (!hasRole) {
      return <>{fallback}</>;
    }
  }

  // Check capabilities
  if (requiredCapabilities && requiredCapabilities.length > 0) {
    const hasCapabilities = requiredCapabilities.every(
      (capability) => capabilities[capability as keyof typeof capabilities]
    );
    if (!hasCapabilities) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};
