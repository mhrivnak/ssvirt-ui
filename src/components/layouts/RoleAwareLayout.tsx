import React from 'react';
import {
  Page,
  PageHeader,
  PageHeaderTools,
  PageSidebar,
  Brand,
  Button,
  Alert,
  AlertVariant,
  Spinner,
  Bullseye,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import {
  UserIcon,
  BellIcon,
  SignOutAltIcon,
} from '@patternfly/react-icons';
import { Link, useNavigate } from 'react-router-dom';
import { useRole } from '../../hooks/useRole';
import { RoleSelector } from '../common/RoleSelector';
import { RoleAwareNavigation } from '../common/RoleAwareNavigation';
import { AuthService } from '../../services/api';

interface RoleAwareLayoutProps {
  children: React.ReactNode;
}

const RoleContextIndicator: React.FC = () => {
  const { activeRole, sessionData } = useRole();
  
  if (!sessionData) return null;

  return (
    <Alert
      variant={AlertVariant.info}
      title={`Acting as ${activeRole} in ${sessionData.org.name}`}
      isInline
      isPlain
      className="pf-v6-u-mb-md"
    />
  );
};

const UserDropdown: React.FC = () => {
  const { sessionData } = useRole();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigation to login even if server logout fails
      navigate('/login');
    }
  };

  if (!sessionData) return null;

  return (
    <Flex alignItems={{ default: 'alignItemsCenter' }}>
      <FlexItem>
        <Button
          component={Link}
          to="/profile"
          variant="plain"
          icon={<UserIcon />}
          aria-label="User profile"
        >
          {sessionData.user.name}
        </Button>
      </FlexItem>
      <FlexItem>
        <Button
          variant="plain"
          icon={<SignOutAltIcon />}
          onClick={handleLogout}
          aria-label="Logout"
        >
          Logout
        </Button>
      </FlexItem>
    </Flex>
  );
};

const NotificationsDropdown: React.FC = () => {
  return (
    <Button
      variant="plain"
      icon={<BellIcon />}
      aria-label="Notifications"
    >
      {/* Notification count badge would go here */}
    </Button>
  );
};

export const RoleAwareLayout: React.FC<RoleAwareLayoutProps> = ({ children }) => {
  const { sessionData, isLoading, isMultiRole } = useRole();

  if (isLoading) {
    return (
      <Bullseye>
        <Spinner size="xl" />
      </Bullseye>
    );
  }

  if (!sessionData) {
    return (
      <Page>
        <Alert
          variant={AlertVariant.danger}
          title="Authentication Required"
          isInline
        >
          Please log in to access the application.
        </Alert>
      </Page>
    );
  }

  const header = (
    <PageHeader
      logo={
        <Brand 
          src="/logo.svg" 
          alt="VMware Cloud Director"
          component={Link}
          to="/dashboard"
        />
      }
      headerTools={
        <PageHeaderTools>
          <Flex alignItems={{ default: 'alignItemsCenter' }}>
            {isMultiRole && (
              <FlexItem>
                <RoleSelector />
              </FlexItem>
            )}
            <FlexItem>
              <NotificationsDropdown />
            </FlexItem>
            <FlexItem>
              <UserDropdown />
            </FlexItem>
          </Flex>
        </PageHeaderTools>
      }
    />
  );

  const sidebar = (
    <PageSidebar>
      <RoleAwareNavigation />
    </PageSidebar>
  );

  return (
    <Page header={header} sidebar={sidebar}>
      <RoleContextIndicator />
      {children}
    </Page>
  );
};