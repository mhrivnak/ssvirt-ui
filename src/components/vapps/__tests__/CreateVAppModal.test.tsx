import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import CreateVAppModal from '../CreateVAppModal';
import { generateMockOrgAdminPermissions } from '../../../mocks/data';
import type { CatalogItem } from '../../../types';

// Mock the hooks
const mockUseCreateVApp = vi.fn();
const mockUseVAppNameValidation = vi.fn();
const mockUserPermissions = vi.fn();
const mockUseAccessibleVDCs = vi.fn();

vi.mock('../../../hooks/useVApps', () => ({
  useCreateVApp: () => mockUseCreateVApp(),
  useVAppNameValidation: () => mockUseVAppNameValidation(),
}));

vi.mock('../../../hooks/usePermissions', () => ({
  useUserPermissions: () => mockUserPermissions(),
}));

vi.mock('../../../hooks/useVDC', () => ({
  useAccessibleVDCs: () => mockUseAccessibleVDCs(),
}));

const mockCatalogItem: CatalogItem = {
  id: 'urn:vcloud:catalogitem:test-item',
  name: 'Test Template',
  description: 'Test catalog item template',
  catalogEntityRef: {
    id: 'urn:vcloud:catalog:test-catalog',
    name: 'Test Catalog',
  },
  entity: {
    name: 'Test Template Entity',
    description: 'Test template entity description',
    templateSpec: {
      kind: 'Template',
      apiVersion: 'template.openshift.io/v1',
      metadata: {
        name: 'test-template',
        labels: {},
        annotations: {},
      },
      parameters: [],
      objects: [],
    },
    deploymentLeases: [],
  },
  isVappTemplate: true,
  status: 'RESOLVED',
  owner: {
    id: 'urn:vcloud:user:admin',
    name: 'Administrator',
  },
  isPublished: false,
  creationDate: '2024-01-15T10:30:00.000Z',
  modificationDate: '2024-01-15T10:30:00.000Z',
  versionNumber: 1,
  os_type: 'Ubuntu 20.04 LTS',
  cpu_count: 2,
  memory_mb: 4096,
  disk_size_gb: 50,
  vm_instance_type: 'Development',
  catalog_id: 'urn:vcloud:catalog:test-catalog',
};

describe('CreateVAppModal with Organization Administrator permissions', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    });

    // Set up default mock return values
    mockUseCreateVApp.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ id: 'test-vapp-id' }),
      isPending: false,
      error: null,
    });

    mockUseVAppNameValidation.mockReturnValue({
      data: true,
      isLoading: false,
      error: null,
    });

    mockUserPermissions.mockReturnValue({
      data: generateMockOrgAdminPermissions(),
      isLoading: false,
    });

    mockUseAccessibleVDCs.mockReturnValue({
      data: {
        values: [
          {
            id: 'urn:vcloud:vdc:test-vdc-1',
            name: 'Test VDC 1',
            description: 'Test VDC for Organization',
          },
          {
            id: 'urn:vcloud:vdc:test-vdc-2',
            name: 'Test VDC 2',
            description: 'Another test VDC',
          },
        ],
        resultTotal: 2,
        pageCount: 1,
        page: 1,
        pageSize: 25,
      },
      isLoading: false,
      error: null,
    });
  });

  const renderModal = (isOpen = true) => {
    return render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <CreateVAppModal
            isOpen={isOpen}
            onClose={vi.fn()}
            catalogItem={mockCatalogItem}
          />
        </QueryClientProvider>
      </MemoryRouter>
    );
  };

  it('should display the modal when open', () => {
    renderModal();
    // The modal title is in the aria-labelledby and title attributes, but we can find the template name
    expect(screen.getByText('Test Template')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveAttribute(
      'title',
      'Create vApp from Template'
    );
  });

  it('should show VDC selector with available VDCs for Organization Administrator', async () => {
    renderModal();

    // Wait for VDCs to load
    await waitFor(() => {
      expect(screen.getByLabelText('Select VDC')).toBeInTheDocument();
    });

    // Should show VDC options
    const vdcSelect = screen.getByLabelText('Select VDC');
    expect(vdcSelect).toBeInTheDocument();

    // Open the select dropdown
    await userEvent.click(vdcSelect);

    // Check that VDCs are available (not showing "No VDCs available")
    await waitFor(() => {
      expect(screen.queryByText('No VDCs available')).not.toBeInTheDocument();
    });
  });

  it('should enable vApp creation controls for Organization Administrator', async () => {
    renderModal();

    // vApp name field should be present and enabled
    const nameInput = screen.getByRole('textbox', { name: /vApp Name/i });
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).not.toBeDisabled();

    // Description field should be present and enabled
    const descriptionInput = screen.getByRole('textbox', {
      name: /Description/i,
    });
    expect(descriptionInput).toBeInTheDocument();
    expect(descriptionInput).not.toBeDisabled();

    // Submit button should be present but disabled until form is valid
    const createButton = screen.getByRole('button', { name: /create vapp/i });
    expect(createButton).toBeInTheDocument();
  });

  it('should allow Organization Administrator to interact with form elements', async () => {
    const user = userEvent.setup();
    renderModal();

    // Wait for form to load with auto-generated name
    await waitFor(() => {
      const nameInput = screen.getByRole('textbox', { name: /vApp Name/i });
      expect(nameInput).toBeInTheDocument();
      expect(nameInput).toHaveValue();
    });

    // Verify Organization Administrator can edit the name field
    const nameInput = screen.getByRole('textbox', { name: /vApp Name/i });
    expect(nameInput).not.toBeDisabled();
    expect(nameInput).toHaveValue();

    // Verify we can type additional text
    await user.click(nameInput);
    await user.type(nameInput, '-additional');
    expect((nameInput as HTMLInputElement).value).toContain('-additional');

    // Verify Organization Administrator can select a VDC
    const vdcSelect = screen.getByLabelText('Select VDC');

    // Select a VDC using selectOptions
    await user.selectOptions(vdcSelect, 'urn:vcloud:vdc:test-vdc-1');

    // Verify the VDC was selected
    expect(vdcSelect).toHaveValue('urn:vcloud:vdc:test-vdc-1');
  });

  it('should not show "No VDCs available" warning for Organization Administrator', async () => {
    renderModal();

    // Wait for component to fully load
    await waitFor(() => {
      expect(screen.getByLabelText('Select VDC')).toBeInTheDocument();
    });

    // Should not display the "No VDCs available" error message
    expect(screen.queryByText('No VDCs available')).not.toBeInTheDocument();
    expect(
      screen.queryByText("You don't have access to any VDCs")
    ).not.toBeInTheDocument();
  });
});
