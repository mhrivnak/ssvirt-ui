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
} from '@patternfly/react-core';
import { BarsIcon } from '@patternfly/react-icons';
import { Link, useLocation } from 'react-router-dom';
import { CONFIG, ROUTES } from '../../utils/constants';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const location = useLocation();

  const onSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
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
          <Brand src="/logo.svg" alt={CONFIG.APP_TITLE} heights={{ default: '36px' }}>
            <source media="(min-width: 768px)" srcSet="/logo.svg" />
            <source media="(max-width: 767px)" srcSet="/logo-mobile.svg" />
          </Brand>
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>
        {/* TODO: Add user menu in PR #3 */}
      </MastheadContent>
    </Masthead>
  );

  const sidebar = (
    <PageSidebar>
      <Sidebar isPanelRight={false}>
        <SidebarPanel>
          {navigation}
        </SidebarPanel>
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