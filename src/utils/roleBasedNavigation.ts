import React from 'react';
import {
  TachometerAltIcon,
  BuildingIcon,
  UsersIcon,
  CogIcon,
  ChartLineIcon,
  ServerIcon,
  VirtualMachineIcon,
  ChartBarIcon,
  BookIcon,
} from '@patternfly/react-icons';
import type { RoleCapabilities } from '../types';

export interface NavigationItem {
  id: string;
  label: string;
  to?: string;
  icon?: React.ComponentType;
  children?: NavigationItem[];
  requiredCapabilities?: (keyof RoleCapabilities)[];
  roles?: string[];
}

/**
 * Get navigation structure based on user capabilities
 */
export const getNavigationForRole = (
  capabilities: RoleCapabilities
): NavigationItem[] => {
  const baseNavigation: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      to: '/dashboard',
      icon: TachometerAltIcon,
    },
  ];

  // System Administrator Navigation
  if (capabilities.canManageSystem) {
    return [
      ...baseNavigation,
      {
        id: 'organizations',
        label: 'Organizations',
        to: '/organizations',
        icon: BuildingIcon,
      },
      {
        id: 'users',
        label: 'User Management',
        to: '/admin/users',
        icon: UsersIcon,
      },
      {
        id: 'system',
        label: 'System Administration',
        icon: CogIcon,
        children: [
          { id: 'roles', label: 'Roles & Permissions', to: '/admin/roles' },
          {
            id: 'system-settings',
            label: 'System Settings',
            to: '/admin/settings',
          },
          {
            id: 'system-monitoring',
            label: 'System Monitoring',
            to: '/admin/monitoring',
          },
        ],
      },
      {
        id: 'vms',
        label: 'All Virtual Machines',
        to: '/vms',
        icon: VirtualMachineIcon,
      },
      {
        id: 'reports',
        label: 'Reports & Analytics',
        to: '/reports',
        icon: ChartLineIcon,
      },
    ];
  }

  // Organization Administrator Navigation
  if (capabilities.canManageOrganizations) {
    return [
      ...baseNavigation,
      {
        id: 'vdcs',
        label: 'Virtual Data Centers',
        to: '/vdcs',
        icon: ServerIcon,
      },
      {
        id: 'org-users',
        label: 'Organization Users',
        to: '/org-users',
        icon: UsersIcon,
      },
      {
        id: 'vms',
        label: 'Virtual Machines',
        to: '/vms',
        icon: VirtualMachineIcon,
      },
      {
        id: 'catalogs',
        label: 'Catalogs',
        to: '/catalogs',
        icon: BookIcon,
      },
      {
        id: 'resources',
        label: 'Resource Management',
        icon: ChartBarIcon,
        children: [
          {
            id: 'capacity',
            label: 'Capacity Planning',
            to: '/resources/capacity',
          },
          { id: 'usage', label: 'Usage Reports', to: '/resources/usage' },
          { id: 'cost', label: 'Cost Reports', to: '/resources/cost' },
        ],
      },
    ];
  }

  // vApp User Navigation
  return [
    ...baseNavigation,
    {
      id: 'my-vms',
      label: 'My Virtual Machines',
      to: '/my-vms',
      icon: VirtualMachineIcon,
    },
    {
      id: 'catalogs',
      label: 'Available Catalogs',
      to: '/catalogs',
      icon: BookIcon,
    },
  ];
};

/**
 * Check if a navigation item should be visible based on capabilities
 */
export const isNavigationItemVisible = (
  item: NavigationItem,
  capabilities: RoleCapabilities
): boolean => {
  if (item.requiredCapabilities) {
    return item.requiredCapabilities.every(
      (capability) => capabilities[capability]
    );
  }

  if (item.roles) {
    // This would need the actual role information, but capabilities work better
    return true;
  }

  return true;
};

/**
 * Filter navigation items based on capabilities
 */
export const filterNavigationItems = (
  items: NavigationItem[],
  capabilities: RoleCapabilities
): NavigationItem[] => {
  return items
    .filter((item) => isNavigationItemVisible(item, capabilities))
    .map((item) => ({
      ...item,
      children: item.children
        ? filterNavigationItems(item.children, capabilities)
        : undefined,
    }));
};
