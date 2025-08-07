import React from 'react';
import {
  Page,
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
  Button,
  Brand,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  type MenuToggleElement,
} from '@patternfly/react-core';
import { BarsIcon, UserIcon } from '@patternfly/react-icons';
import { Link, useLocation } from 'react-router-dom';
import { CONFIG, ROUTES } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';
import { useLogoutMutation } from '../../hooks/useAuthQueries';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const logoutMutation = useLogoutMutation();

  const onSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

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

  const navigation = (
    <Nav>
      <NavList>
        <NavItem isActive={location.pathname === ROUTES.DASHBOARD}>
          <Link to={ROUTES.DASHBOARD}>Dashboard</Link>
        </NavItem>
        <NavItem isActive={location.pathname === ROUTES.VMS}>
          <Link to={ROUTES.VMS}>Virtual Machines</Link>
        </NavItem>
        <NavItem isActive={location.pathname === ROUTES.ORGANIZATIONS}>
          <Link to={ROUTES.ORGANIZATIONS}>Organizations</Link>
        </NavItem>
        <NavItem isActive={location.pathname === ROUTES.VDCS}>
          <Link to={ROUTES.VDCS}>Virtual Data Centers</Link>
        </NavItem>
        <NavItem isActive={location.pathname === ROUTES.CATALOGS}>
          <Link to={ROUTES.CATALOGS}>Catalogs</Link>
        </NavItem>
      </NavList>
    </Nav>
  );

  const masthead = (
    <Masthead>
      <MastheadToggle>
        <Button
          variant="plain"
          onClick={onSidebarToggle}
          aria-label="Global navigation"
        >
          <BarsIcon />
        </Button>
      </MastheadToggle>
      <MastheadMain>
        <MastheadBrand>
          <Brand
            src={CONFIG.LOGO_URL}
            alt={CONFIG.APP_TITLE}
            heights={{ default: '36px' }}
          >
            <source media="(min-width: 768px)" srcSet={CONFIG.LOGO_URL} />
            <source media="(max-width: 767px)" srcSet={CONFIG.LOGO_URL} />
          </Brand>
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
              icon={<UserIcon />}
            >
              {user?.first_name} {user?.last_name}
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
            >
              Profile
            </DropdownItem>
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
    >
      {children}
    </Page>
  );
};

export default AppLayout;
