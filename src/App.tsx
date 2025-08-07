import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppLayout from './components/layouts/AppLayout';
import Dashboard from './pages/dashboard/Dashboard';
import Login from './pages/auth/Login';
import Organizations from './pages/organizations/Organizations';
import VMs from './pages/vms/VMs';
import ProtectedRoute from './components/common/ProtectedRoute';
import { AuthProvider } from './contexts/AuthProvider';
import { NavigationProvider } from './contexts/NavigationContext';
import { ROUTES } from './utils/constants';

// Import PatternFly CSS
import '@patternfly/react-core/dist/styles/base.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        // Don't retry on 401 errors (authentication issues)
        if (
          (error as { response?: { status?: number } })?.response?.status ===
          401
        ) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: false,
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
                      <div>VDCs - Coming in future PR</div>
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
