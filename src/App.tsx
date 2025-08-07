import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layouts/AppLayout';
import Dashboard from './pages/dashboard/Dashboard';
import Login from './pages/auth/Login';
import Organizations from './pages/organizations/Organizations';
import VMs from './pages/vms/VMs';
import { ROUTES } from './utils/constants';

// Import PatternFly CSS
import '@patternfly/react-core/dist/styles/base.css';

const App: React.FC = () => {
  // TODO: Replace with actual authentication check in PR #2
  const isAuthenticated = false;

  if (!isAuthenticated) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route
            path={ROUTES.HOME}
            element={<Navigate to={ROUTES.DASHBOARD} replace />}
          />
          <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
          <Route path={ROUTES.ORGANIZATIONS} element={<Organizations />} />
          <Route path={ROUTES.VMS} element={<VMs />} />
          <Route
            path={ROUTES.VDCS}
            element={<div>VDCs - Coming in future PR</div>}
          />
          <Route
            path={ROUTES.CATALOGS}
            element={<div>Catalogs - Coming in future PR</div>}
          />
          <Route
            path={ROUTES.PROFILE}
            element={<div>Profile - Coming in future PR</div>}
          />
          <Route
            path="*"
            element={<Navigate to={ROUTES.DASHBOARD} replace />}
          />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
};

export default App;
