import React from 'react';
import {
  Page,
  PageSection,
  Masthead,
  MastheadToggle,
  MastheadMain,
  MastheadBrand,
  MastheadContent,
  Sidebar,
  SidebarContent,
  SidebarPanel,
  PageSidebar,
  Nav,
  NavItem,
  NavList,
  NavExpandable,
  Button,
  Brand,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  type MenuToggleElement,
  Divider,
  Avatar,
} from '@patternfly/react-core';
import {
  BarsIcon,
  UserIcon,
  CogIcon,
  ExternalLinkAltIcon,
  QuestionCircleIcon,
} from '@patternfly/react-icons';
import { Link, useLocation } from 'react-router-dom';
import { CONFIG, ROUTES } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';
import { useLogoutMutation } from '../../hooks/useAuthQueries';
import { useNavigation } from '../../hooks/useNavigation';
import AppBreadcrumb from '../common/AppBreadcrumb';
import ErrorBoundary from '../common/ErrorBoundary';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const [isManageNavOpen, setIsManageNavOpen] = React.useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const logoutMutation = useLogoutMutation();
  const { isSidebarOpen, toggleSidebar, isMobile } = useNavigation();

  const onUserMenuToggle = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const onUserMenuSelect = () => {
    setIsUserMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Helper function to determine if nav item is active
  const isNavItemActive = (routePath: string): boolean => {
    return location.pathname === routePath;
  };

  const navigation = (
    <Nav>
      <NavList>
        {/* Main Dashboard */}
        <NavItem isActive={isNavItemActive(ROUTES.DASHBOARD)}>
          <Link to={ROUTES.DASHBOARD}>Dashboard</Link>
        </NavItem>

        {/* Compute Resources */}
        <NavItem isActive={isNavItemActive(ROUTES.VMS)}>
          <Link to={ROUTES.VMS}>Virtual Machines</Link>
        </NavItem>

        {/* Management Section */}
        <NavExpandable
          title="Manage"
          isExpanded={isManageNavOpen}
          onExpand={() => setIsManageNavOpen(!isManageNavOpen)}
          isActive={
            isNavItemActive(ROUTES.ORGANIZATIONS) ||
            isNavItemActive(ROUTES.VDCS) ||
            isNavItemActive(ROUTES.CATALOGS)
          }
        >
          <NavItem isActive={isNavItemActive(ROUTES.ORGANIZATIONS)}>
            <Link to={ROUTES.ORGANIZATIONS}>Organizations</Link>
          </NavItem>
          <NavItem isActive={isNavItemActive(ROUTES.VDCS)}>
            <Link to={ROUTES.VDCS}>Virtual Data Centers</Link>
          </NavItem>
          <NavItem isActive={isNavItemActive(ROUTES.CATALOGS)}>
            <Link to={ROUTES.CATALOGS}>Catalogs</Link>
          </NavItem>
        </NavExpandable>
      </NavList>
    </Nav>
  );

  const masthead = (
    <Masthead>
      <MastheadToggle>
        <Button
          variant="plain"
          onClick={toggleSidebar}
          aria-label="Global navigation"
        >
          <BarsIcon />
        </Button>
      </MastheadToggle>
      <MastheadMain>
        <MastheadBrand>
          <Link to={ROUTES.DASHBOARD}>
            <Brand
              src={CONFIG.LOGO_URL}
              alt={CONFIG.APP_TITLE}
              heights={{ default: '36px' }}
            >
              <source media="(min-width: 768px)" srcSet={CONFIG.LOGO_URL} />
              <source media="(max-width: 767px)" srcSet={CONFIG.LOGO_URL} />
            </Brand>
          </Link>
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>
        <Dropdown
          isOpen={isUserMenuOpen}
          onSelect={onUserMenuSelect}
          onOpenChange={setIsUserMenuOpen}
          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
            <MenuToggle
              ref={toggleRef}
              onClick={onUserMenuToggle}
              isExpanded={isUserMenuOpen}
              variant="plainText"
            >
              <Avatar
                src={user?.avatar_url}
                alt={
                  user?.first_name && user?.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user?.username || 'User'
                }
                size="sm"
              />
              {!isMobile && (
                <span style={{ marginLeft: '8px' }}>
                  {user?.first_name && user?.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user?.username || 'User'}
                </span>
              )}
            </MenuToggle>
          )}
        >
          <DropdownList>
            <DropdownItem
              key="profile"
              to={ROUTES.PROFILE}
              component={(props: React.ComponentProps<typeof Link>) => (
                <Link {...props} />
              )}
              icon={<UserIcon />}
            >
              My Profile
            </DropdownItem>
            <DropdownItem
              key="settings"
              icon={<CogIcon />}
              description="Account settings and preferences"
            >
              Settings
            </DropdownItem>
            <Divider />
            <DropdownItem
              key="help"
              icon={<QuestionCircleIcon />}
              component="button"
              onClick={() => window.open('/docs', '_blank')}
            >
              Help & Documentation
              <ExternalLinkAltIcon style={{ marginLeft: '8px' }} />
            </DropdownItem>
            <Divider />
            <DropdownItem
              key="logout"
              onClick={handleLogout}
              isDisabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? 'Signing out...' : 'Sign out'}
            </DropdownItem>
          </DropdownList>
        </Dropdown>
      </MastheadContent>
    </Masthead>
  );

  const sidebar = (
    <PageSidebar>
      <Sidebar isPanelRight={false}>
        <SidebarPanel>{navigation}</SidebarPanel>
        <SidebarContent>
          <div>{/* Additional sidebar content can go here */}</div>
        </SidebarContent>
      </Sidebar>
    </PageSidebar>
  );

  return (
    <Page
      masthead={masthead}
      sidebar={isSidebarOpen ? sidebar : undefined}
      isManagedSidebar
      breadcrumb={
        <PageSection variant="default" padding={{ default: 'noPadding' }}>
          <div style={{ padding: '1rem 1.5rem' }}>
            <AppBreadcrumb />
          </div>
        </PageSection>
      }
    >
      <ErrorBoundary>{children}</ErrorBoundary>
    </Page>
  );
};

export default AppLayout;
