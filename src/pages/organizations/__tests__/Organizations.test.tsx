import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Organizations from '../Organizations';

// Mock the hooks
vi.mock('../../../hooks', () => ({
  useOrganizations: () => ({
    data: {
      data: [],
      pagination: { total: 0, page: 1, per_page: 20, total_pages: 1 }
    },
    isLoading: false,
    error: null
  }),
  useDeleteOrganization: () => ({
    mutateAsync: vi.fn(),
    isPending: false
  }),
  useToggleOrganizationStatus: () => ({
    mutateAsync: vi.fn(),
    isPending: false
  })
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Organizations', () => {
  it('renders organizations page title', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <Organizations />
      </Wrapper>
    );

    expect(screen.getByText('Organizations')).toBeInTheDocument();
    expect(screen.getByText('Manage organizations and their settings')).toBeInTheDocument();
  });

  it('renders empty state when no organizations', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <Organizations />
      </Wrapper>
    );

    expect(screen.getByText('No organizations found')).toBeInTheDocument();
    expect(screen.getByText('Get started by creating your first organization.')).toBeInTheDocument();
  });

  it('renders create organization button', () => {
    const Wrapper = createWrapper();
    
    render(
      <Wrapper>
        <Organizations />
      </Wrapper>
    );

    const createButtons = screen.getAllByText('Create Organization');
    expect(createButtons.length).toBeGreaterThan(0);
  });
});