import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppLayout from './components/layouts/AppLayout';
import Dashboard from './pages/dashboard/Dashboard';
import Login from './pages/auth/Login';
import {
  Organizations,
  OrganizationDetail,
  OrganizationUsers,
  OrganizationForm,
} from './pages/organizations';
import { VDCs, VDCDetail, VDCForm, VDCUsers } from './pages/vdcs';
import VMs from './pages/vms/VMs';
import ProtectedRoute from './components/common/ProtectedRoute';
import { AuthProvider } from './contexts/AuthProvider';
import { NavigationProvider } from './contexts/NavigationContext';
import { ROUTES } from './utils/constants';

// Import PatternFly CSS
import '@patternfly/react-core/dist/styles/base.css';

// Create a client for React Query with enhanced configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        const axiosError = error as { response?: { status?: number } };
        const status = axiosError?.response?.status;

        // Don't retry on client errors (4xx) or specific server errors
        if (status && status >= 400 && status < 500) {
          return false;
        }

        // Don't retry on network errors after 1 attempt
        if (!status && failureCount >= 1) {
          return false;
        }

        // Retry up to 3 times for server errors (5xx)
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: (failureCount, error: unknown) => {
        const axiosError = error as { response?: { status?: number } };
        const status = axiosError?.response?.status;

        // Only retry on network errors or 5xx server errors
        if (status && status >= 500 && failureCount < 2) {
          return true;
        }
        return false;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NavigationProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path={ROUTES.LOGIN} element={<Login />} />

              {/* Protected routes */}
              <Route
                path={ROUTES.HOME}
                element={
                  <ProtectedRoute>
                    <Navigate to={ROUTES.DASHBOARD} replace />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.DASHBOARD}
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Dashboard />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.ORGANIZATIONS}
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Organizations />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.ORGANIZATION_CREATE}
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <OrganizationForm />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.ORGANIZATION_DETAIL}
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <OrganizationDetail />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.ORGANIZATION_EDIT}
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <OrganizationForm />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.ORGANIZATION_USERS}
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <OrganizationUsers />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.ORGANIZATION_ANALYTICS}
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <div>Organization Analytics - Coming in future PR</div>
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.VMS}
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <VMs />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.VDCS}
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <VDCs />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.VDC_CREATE}
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <VDCForm />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.VDC_DETAIL}
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <VDCDetail />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.VDC_EDIT}
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <VDCForm />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.VDC_USERS}
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <VDCUsers />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.CATALOGS}
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <div>Catalogs - Coming in future PR</div>
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.PROFILE}
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <div>Profile - Coming in future PR</div>
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* Catch-all route */}
              <Route
                path="*"
                element={
                  <ProtectedRoute>
                    <Navigate to={ROUTES.DASHBOARD} replace />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </NavigationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
