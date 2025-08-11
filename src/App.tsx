import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Spinner, Bullseye, PageSection } from '@patternfly/react-core';
import { RoleAwareLayout } from './components/layouts/RoleAwareLayout';
import { RoleProvider } from './contexts/RoleContext';
import { RoleProtectedRoute } from './components/common/RoleProtectedRoute';
import Login from './pages/auth/Login';
import { RoleBasedDashboard } from './pages/dashboard/RoleBasedDashboard';
import { ConfigLoader } from './components/common/ConfigLoader';
import { roleBasedRoutes } from './utils/routeProtection';
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

// Loading fallback component
const LoadingFallback: React.FC = () => (
  <PageSection>
    <Bullseye>
      <Spinner size="xl" />
    </Bullseye>
  </PageSection>
);

const App: React.FC = () => {
  return (
    <ConfigLoader>
      <QueryClientProvider client={queryClient}>
        <RoleProvider>
          <BrowserRouter>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Public routes */}
                <Route path={ROUTES.LOGIN} element={<Login />} />

                {/* Protected dashboard route */}
                <Route
                  path={ROUTES.DASHBOARD}
                  element={
                    <RoleProtectedRoute
                      route={{
                        path: ROUTES.DASHBOARD,
                        component: RoleBasedDashboard,
                      }}
                    >
                      <RoleAwareLayout>
                        <RoleBasedDashboard />
                      </RoleAwareLayout>
                    </RoleProtectedRoute>
                  }
                />

                {/* Home route redirects to dashboard */}
                <Route
                  path={ROUTES.HOME}
                  element={<Navigate to={ROUTES.DASHBOARD} replace />}
                />

                {/* Role-based protected routes */}
                {roleBasedRoutes.map((route) => {
                  const Component = route.component;
                  return (
                    <Route
                      key={route.path}
                      path={route.path}
                      element={
                        <RoleProtectedRoute route={route}>
                          <RoleAwareLayout>
                            <Component />
                          </RoleAwareLayout>
                        </RoleProtectedRoute>
                      }
                    />
                  );
                })}

                {/* Catch-all route */}
                <Route
                  path="*"
                  element={<Navigate to={ROUTES.DASHBOARD} replace />}
                />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </RoleProvider>
      </QueryClientProvider>
    </ConfigLoader>
  );
};

export default App;
