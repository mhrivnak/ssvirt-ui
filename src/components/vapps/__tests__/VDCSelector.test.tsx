import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import VDCSelector from '../VDCSelector';
import {
  generateMockOrgAdminPermissions,
  generateMockUserPermissions,
} from '../../../mocks/data';

// Mock the permissions hook
const mockUserPermissions = vi.fn();
vi.mock('../../../hooks/usePermissions', () => ({
  useUserPermissions: () => mockUserPermissions(),
}));

// Mock the VDC hook
const mockUseAccessibleVDCs = vi.fn();
vi.mock('../../../hooks/useVDC', () => ({
  useAccessibleVDCs: () => mockUseAccessibleVDCs(),
}));

const mockVDCs = [
  {
    id: 'urn:vcloud:vdc:org-admin-vdc-1',
    name: 'Org Admin VDC 1',
    description: 'VDC accessible to Organization Administrator',
  },
  {
    id: 'urn:vcloud:vdc:org-admin-vdc-2',
    name: 'Org Admin VDC 2',
    description: 'Another VDC for Organization Administrator',
  },
];

describe('VDCSelector with Organization Administrator permissions', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const renderSelector = (
    permissions = generateMockOrgAdminPermissions(),
    vdcData = mockVDCs
  ) => {
    // Set up the mock return values
    mockUserPermissions.mockReturnValue({
      data: permissions,
      isLoading: false,
    });

    mockUseAccessibleVDCs.mockReturnValue({
      data: {
        values: vdcData,
        resultTotal: vdcData.length,
        pageCount: 1,
        page: 1,
        pageSize: 25,
      },
      isLoading: false,
      error: null,
    });

    const onChange = vi.fn();
    return render(
      <QueryClientProvider client={queryClient}>
        <VDCSelector value="" onChange={onChange} />
      </QueryClientProvider>
    );
  };

  it('should show available VDCs for Organization Administrator', async () => {
    renderSelector();

    // Should show VDC selector
    expect(screen.getByLabelText('Select VDC')).toBeInTheDocument();

    // Should not show error messages
    expect(screen.queryByText('No VDCs available')).not.toBeInTheDocument();
    expect(
      screen.queryByText("You don't have access to any VDCs")
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Error loading VDCs')).not.toBeInTheDocument();
  });

  it('should populate VDC options in select dropdown', async () => {
    renderSelector();

    const selectElement = screen.getByLabelText('Select VDC');
    expect(selectElement).toBeInTheDocument();

    // Check that the options are present in the select element
    expect(selectElement.children).toHaveLength(3); // Default option + 2 VDCs
    expect(selectElement).toHaveDisplayValue('Select a VDC...');
  });

  it('should show "No VDCs available" for regular users without permissions', async () => {
    // Use regular user permissions (no canCreateVApps) and empty VDC list
    renderSelector(generateMockUserPermissions(), []);

    // Should show the "No VDCs available" message
    expect(screen.getByText('No VDCs available')).toBeInTheDocument();
    expect(
      screen.getByText(
        /You don't have access to any VDCs where you can create vApps/
      )
    ).toBeInTheDocument();
  });

  it('should handle VDC loading errors gracefully', async () => {
    // Mock error state
    mockUserPermissions.mockReturnValue({
      data: generateMockOrgAdminPermissions(),
      isLoading: false,
    });

    mockUseAccessibleVDCs.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Network error'),
    });

    const onChange = vi.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <VDCSelector value="" onChange={onChange} />
      </QueryClientProvider>
    );

    // Should show error message
    expect(screen.getByText('Error loading VDCs')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('should call onChange when VDC is selected', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    // Set up mocks
    mockUserPermissions.mockReturnValue({
      data: generateMockOrgAdminPermissions(),
      isLoading: false,
    });

    mockUseAccessibleVDCs.mockReturnValue({
      data: {
        values: mockVDCs,
        resultTotal: mockVDCs.length,
        pageCount: 1,
        page: 1,
        pageSize: 25,
      },
      isLoading: false,
      error: null,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <VDCSelector value="" onChange={onChange} />
      </QueryClientProvider>
    );

    const selectElement = screen.getByLabelText('Select VDC');

    // Change the select value directly
    await user.selectOptions(selectElement, 'urn:vcloud:vdc:org-admin-vdc-1');

    expect(onChange).toHaveBeenCalledWith('urn:vcloud:vdc:org-admin-vdc-1');
  });
});
