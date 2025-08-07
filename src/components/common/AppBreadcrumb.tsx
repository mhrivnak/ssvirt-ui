import React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbHeading,
} from '@patternfly/react-core';
import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';

interface BreadcrumbConfig {
  [key: string]: {
    label: string;
    parent?: string;
  };
}

const breadcrumbConfig: BreadcrumbConfig = {
  [ROUTES.DASHBOARD]: {
    label: 'Dashboard',
  },
  [ROUTES.VMS]: {
    label: 'Virtual Machines',
  },
  [ROUTES.ORGANIZATIONS]: {
    label: 'Organizations',
  },
  [ROUTES.VDCS]: {
    label: 'Virtual Data Centers',
  },
  [ROUTES.CATALOGS]: {
    label: 'Catalogs',
  },
  [ROUTES.PROFILE]: {
    label: 'Profile',
  },
};

const AppBreadcrumb: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Don't show breadcrumb on login page
  if (currentPath === ROUTES.LOGIN) {
    return null;
  }

  const currentConfig = breadcrumbConfig[currentPath];

  // If we don't have config for this route, don't show breadcrumb
  if (!currentConfig) {
    return null;
  }

  const breadcrumbItems: Array<{
    path: string;
    label: string;
    isActive: boolean;
  }> = [];

  // Always include home/dashboard as first item unless we're already on dashboard
  if (currentPath !== ROUTES.DASHBOARD) {
    breadcrumbItems.push({
      path: ROUTES.DASHBOARD,
      label: 'Dashboard',
      isActive: false,
    });
  }

  // Add current page
  breadcrumbItems.push({
    path: currentPath,
    label: currentConfig.label,
    isActive: true,
  });

  return (
    <Breadcrumb>
      {breadcrumbItems.map((item) => {
        if (item.isActive) {
          return (
            <BreadcrumbHeading key={item.path}>{item.label}</BreadcrumbHeading>
          );
        }

        return (
          <BreadcrumbItem key={item.path} to={item.path} component={Link}>
            {item.label}
          </BreadcrumbItem>
        );
      })}
    </Breadcrumb>
  );
};

export default AppBreadcrumb;
