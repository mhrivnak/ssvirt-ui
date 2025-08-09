import React, { useMemo } from 'react';
import {
  Nav,
  NavList,
  NavItem,
  NavExpandable,
} from '@patternfly/react-core';
import { Link, useLocation } from 'react-router-dom';
import { useRole } from '../../hooks/useRole';
import { getNavigationForRole } from '../../utils/roleBasedNavigation';
import type { NavigationItem } from '../../utils/roleBasedNavigation';

interface RoleAwareNavItemProps {
  item: NavigationItem;
  isActive?: boolean;
}

const RoleAwareNavItem: React.FC<RoleAwareNavItemProps> = ({ item, isActive = false }) => {
  const location = useLocation();
  
  if (item.children && item.children.length > 0) {
    const hasActiveChild = item.children.some(child => 
      child.to && location.pathname.startsWith(child.to)
    );
    
    return (
      <NavExpandable
        title={item.label}
        isActive={hasActiveChild}
        isExpanded={hasActiveChild}
      >
        {item.children.map(child => (
          <RoleAwareNavItem key={child.id} item={child} />
        ))}
      </NavExpandable>
    );
  }

  if (item.to) {
    const itemIsActive = location.pathname === item.to || 
                        (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
    
    return (
      <NavItem 
        isActive={itemIsActive}
        component={({ children, ...props }) => (
          <Link to={item.to!} {...props}>
            {children}
          </Link>
        )}
      >
        {item.label}
      </NavItem>
    );
  }

  return (
    <NavItem isActive={isActive}>
      {item.label}
    </NavItem>
  );
};

export const RoleAwareNavigation: React.FC = () => {
  const { capabilities, isLoading } = useRole();

  const navigationItems = useMemo(() => {
    if (isLoading) return [];
    return getNavigationForRole(capabilities);
  }, [capabilities, isLoading]);

  if (isLoading) {
    return (
      <Nav>
        <NavList>
          <NavItem>Loading...</NavItem>
        </NavList>
      </Nav>
    );
  }

  return (
    <Nav>
      <NavList>
        {navigationItems.map(item => (
          <RoleAwareNavItem key={item.id} item={item} />
        ))}
      </NavList>
    </Nav>
  );
};