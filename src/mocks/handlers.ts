import { http, HttpResponse } from 'msw';
import type {
  PaginatedResponse,
  ApiResponse,
  VCloudPaginatedResponse,
} from '../types';

// Types for request bodies
interface UserUpdateRequest {
  name?: string;
  fullName?: string;
  FullName?: string;
  email?: string;
  enabled?: boolean;
  orgEntityRef?: { id: string; name: string };
  organizationID?: string;
  roleEntityRefs?: Array<{ id: string; name: string }>;
  password?: string;
}

interface UserCreateRequest {
  username: string;
  name?: string;
  FullName?: string;
  email?: string;
  enabled?: boolean;
  orgEntityRef?: { id: string; name: string };
  organizationID?: string;
  roleEntityRefs?: Array<{ id: string; name: string }>;
  password: string;
}
import {
  generateMockOrganizations,
  generateMockVDCs,
  generateMockVMs,
  generateMockCatalogs,
  generateMockCatalogItems,
  generateMockDashboardStats,
  generateMockRecentActivity,
  generateMockUser,
  generateMockRoles,
  generateMockVApp,
  generateMockCloudApiVMs,
  generateMockVApps,
} from './data';

const BASE_URL = '/api/v1';

// Module-level stores for stable data across requests
const vmStore = generateMockCloudApiVMs();
const vappStore = generateMockVApps();

// Helper function to create paginated response
const createPaginatedResponse = <T>(
  data: T[],
  page: number = 1,
  perPage: number = 10
): PaginatedResponse<T> => {
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;
  const paginatedData = data.slice(startIndex, endIndex);

  return {
    success: true,
    data: paginatedData,
    pagination: {
      page,
      per_page: perPage,
      total: data.length,
      total_pages: Math.ceil(data.length / perPage),
    },
  };
};

// Helper function to create API response
const createApiResponse = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data,
});

// Helper function to create CloudAPI paginated response
const createCloudApiPaginatedResponse = <T>(
  data: T[],
  page: number = 1,
  pageSize: number = 25
): VCloudPaginatedResponse<T> => {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = data.slice(startIndex, endIndex);

  return {
    resultTotal: data.length,
    pageCount: Math.ceil(data.length / pageSize),
    page,
    pageSize,
    values: paginatedData,
  };
};

export const handlers = [
  // Auth endpoints
  http.get(`${BASE_URL}/user/profile`, () => {
    return HttpResponse.json(createApiResponse(generateMockUser()));
  }),

  // Dashboard endpoints
  http.get(`${BASE_URL}/dashboard/stats`, () => {
    return HttpResponse.json(createApiResponse(generateMockDashboardStats()));
  }),

  http.get(`${BASE_URL}/dashboard/activity`, ({ request }) => {
    const url = new URL(request.url);
    const perPage = parseInt(url.searchParams.get('per_page') || '10');
    const page = parseInt(url.searchParams.get('page') || '1');

    const activities = generateMockRecentActivity();
    return HttpResponse.json(
      createPaginatedResponse(activities, page, perPage)
    );
  }),

  // Organizations endpoints
  http.get(`${BASE_URL}/organizations`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = parseInt(url.searchParams.get('per_page') || '10');
    const search = url.searchParams.get('search');

    let organizations = generateMockOrganizations();

    // Apply search filter
    if (search) {
      organizations = organizations.filter(
        (org) =>
          org.name.toLowerCase().includes(search.toLowerCase()) ||
          org.displayName.toLowerCase().includes(search.toLowerCase())
      );
    }

    return HttpResponse.json(
      createPaginatedResponse(organizations, page, perPage)
    );
  }),

  http.get(`${BASE_URL}/organizations/:id`, ({ params }) => {
    const { id } = params;
    const organizations = generateMockOrganizations();
    const organization = organizations.find((org) => org.id === id);

    if (!organization) {
      return HttpResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json(createApiResponse(organization));
  }),

  // VDCs endpoints
  http.get(`${BASE_URL}/vdcs`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = parseInt(url.searchParams.get('per_page') || '10');
    const organizationId = url.searchParams.get('organization_id');

    let vdcs = generateMockVDCs();

    // Apply organization filter
    if (organizationId) {
      vdcs = vdcs.filter((vdc) => vdc.org?.id === organizationId);
    }

    return HttpResponse.json(createPaginatedResponse(vdcs, page, perPage));
  }),

  http.get(`${BASE_URL}/organizations/:orgId/vdcs`, ({ params, request }) => {
    const { orgId } = params;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = parseInt(url.searchParams.get('per_page') || '10');

    const vdcs = generateMockVDCs().filter((vdc) => vdc.org?.id === orgId);
    return HttpResponse.json(createPaginatedResponse(vdcs, page, perPage));
  }),

  http.get(`${BASE_URL}/vdcs/:id`, ({ params }) => {
    const { id } = params;
    const vdcs = generateMockVDCs();
    const vdc = vdcs.find((v) => v.id === id);

    if (!vdc) {
      return HttpResponse.json(
        { success: false, error: 'VDC not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json(createApiResponse(vdc));
  }),

  // VMs endpoints
  http.get(`${BASE_URL}/vms`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = parseInt(url.searchParams.get('per_page') || '10');
    const status = url.searchParams.get('vm_status');
    const vdcId = url.searchParams.get('vdc_id');

    let vms = generateMockVMs();

    // Apply filters
    if (status) {
      vms = vms.filter((vm) => vm.status === status);
    }
    if (vdcId) {
      vms = vms.filter((vm) => vm.vapp_id.includes(vdcId)); // Simplified filter
    }

    return HttpResponse.json(createPaginatedResponse(vms, page, perPage));
  }),

  http.get(`${BASE_URL}/vdcs/:vdcId/vms`, ({ params, request }) => {
    const { vdcId } = params;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = parseInt(url.searchParams.get('per_page') || '10');

    // For demo purposes, return VMs that belong to the VDC
    const vdcs = generateMockVDCs();
    const vdc = vdcs.find((v) => v.id === vdcId);
    const vms = vdc
      ? generateMockVMs().filter((vm) => vm.vdc_id === vdcId)
      : [];

    return HttpResponse.json(createPaginatedResponse(vms, page, perPage));
  }),

  http.get(`${BASE_URL}/vms/:id`, ({ params }) => {
    const { id } = params;
    const vms = generateMockVMs();
    const vm = vms.find((v) => v.id === id);

    if (!vm) {
      return HttpResponse.json(
        { success: false, error: 'VM not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json(createApiResponse(vm));
  }),

  // VM Power operations
  http.post(`${BASE_URL}/vms/:id/power-on`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json(
      createApiResponse({
        vm_id: id,
        action: 'power-on',
        status: 'POWERED_ON',
        message: 'VM power on operation initiated',
        timestamp: new Date().toISOString(),
        task: {
          id: 'task-' + Date.now(),
          status: 'running',
          type: 'power-on',
        },
      })
    );
  }),

  http.post(`${BASE_URL}/vms/:id/power-off`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json(
      createApiResponse({
        vm_id: id,
        action: 'power-off',
        status: 'POWERED_OFF',
        message: 'VM power off operation initiated',
        timestamp: new Date().toISOString(),
        task: {
          id: 'task-' + Date.now(),
          status: 'running',
          type: 'power-off',
        },
      })
    );
  }),

  // CloudAPI Catalogs endpoints
  http.get('/cloudapi/1.0.0/catalogs', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '25');

    const catalogs = generateMockCatalogs();
    return HttpResponse.json(
      createCloudApiPaginatedResponse(catalogs, page, pageSize)
    );
  }),

  http.get('/cloudapi/1.0.0/catalogs/:catalogUrn', ({ params }) => {
    const { catalogUrn } = params;
    const catalogs = generateMockCatalogs();
    const catalog = catalogs.find(
      (c) => c.id === decodeURIComponent(catalogUrn as string)
    );

    if (!catalog) {
      return HttpResponse.json(
        {
          error: 'Catalog not found',
          message: 'The requested catalog could not be found',
          details: `Catalog with URN ${catalogUrn} not found`,
        },
        { status: 404 }
      );
    }

    return HttpResponse.json(catalog);
  }),

  http.post('/cloudapi/1.0.0/catalogs', async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      description?: string;
      orgId: string;
      isPublished?: boolean;
    };

    // Create a new catalog with CloudAPI structure
    const newCatalog = {
      id: `urn:vcloud:catalog:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: body.name,
      description: body.description || '',
      org: {
        id: body.orgId,
      },
      isPublished: body.isPublished || false,
      isSubscribed: false,
      creationDate: new Date().toISOString(),
      numberOfVAppTemplates: 0,
      numberOfMedia: 0,
      catalogStorageProfiles: [],
      publishConfig: {
        isPublished: body.isPublished || false,
      },
      subscriptionConfig: {
        isSubscribed: false,
      },
      distributedCatalogConfig: {},
      owner: {
        id: '',
      },
      isLocal: true,
      version: 1,
    };

    return HttpResponse.json(newCatalog, { status: 201 });
  }),

  http.put(
    '/cloudapi/1.0.0/catalogs/:catalogUrn',
    async ({ params, request }) => {
      const { catalogUrn } = params;
      const body = (await request.json()) as {
        name?: string;
        description?: string;
        isPublished?: boolean;
      };
      const catalogs = generateMockCatalogs();
      const catalog = catalogs.find(
        (c) => c.id === decodeURIComponent(catalogUrn as string)
      );

      if (!catalog) {
        return HttpResponse.json(
          {
            error: 'Catalog not found',
            message: 'The requested catalog could not be found',
            details: `Catalog with URN ${catalogUrn} not found`,
          },
          { status: 404 }
        );
      }

      // Update catalog with provided fields
      const updatedCatalog = {
        ...catalog,
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && {
          description: body.description,
        }),
        ...(body.isPublished !== undefined && {
          isPublished: body.isPublished,
          publishConfig: { isPublished: body.isPublished },
        }),
      };

      return HttpResponse.json(updatedCatalog);
    }
  ),

  http.delete('/cloudapi/1.0.0/catalogs/:catalogUrn', ({ params }) => {
    const { catalogUrn } = params;
    const catalogs = generateMockCatalogs();
    const catalog = catalogs.find(
      (c) => c.id === decodeURIComponent(catalogUrn as string)
    );

    if (!catalog) {
      return HttpResponse.json(
        {
          error: 'Catalog not found',
          message: 'The requested catalog could not be found',
          details: `Catalog with URN ${catalogUrn} not found`,
        },
        { status: 404 }
      );
    }

    // For demo purposes, just return 204 No Content
    return new HttpResponse(null, { status: 204 });
  }),

  // Catalog Items endpoints
  http.get(
    '/cloudapi/1.0.0/catalogs/:catalogUrn/catalogItems',
    ({ params, request }) => {
      const { catalogUrn } = params;
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const pageSize = parseInt(url.searchParams.get('pageSize') || '25');

      const allCatalogItems = generateMockCatalogItems();
      const catalogItems = allCatalogItems.filter(
        (item) =>
          item.catalogEntityRef.id === decodeURIComponent(catalogUrn as string)
      );

      return HttpResponse.json(
        createCloudApiPaginatedResponse(catalogItems, page, pageSize)
      );
    }
  ),

  http.get(
    '/cloudapi/1.0.0/catalogs/:catalogUrn/catalogItems/:itemUrn',
    ({ params }) => {
      const { catalogUrn, itemUrn } = params;
      const allCatalogItems = generateMockCatalogItems();
      const catalogItem = allCatalogItems.find(
        (item) =>
          item.id === decodeURIComponent(itemUrn as string) &&
          item.catalogEntityRef.id === decodeURIComponent(catalogUrn as string)
      );

      if (!catalogItem) {
        return HttpResponse.json(
          {
            error: 'Catalog item not found',
            message: 'The requested catalog item could not be found',
            details: `Catalog item with URN ${itemUrn} not found in catalog ${catalogUrn}`,
          },
          { status: 404 }
        );
      }

      return HttpResponse.json(catalogItem);
    }
  ),

  // CloudAPI VDCs endpoints (Public API for regular users)
  http.get('/cloudapi/1.0.0/vdcs', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '25');

    // For public API, return VDCs that regular users can access
    // In a real implementation, this would be filtered based on user's organization membership
    const vdcs = generateMockVDCs();
    return HttpResponse.json(
      createCloudApiPaginatedResponse(vdcs, page, pageSize)
    );
  }),

  http.get('/cloudapi/1.0.0/vdcs/:vdcUrn', ({ params }) => {
    const { vdcUrn } = params;
    const vdcs = generateMockVDCs();
    const vdc = vdcs.find((v) => v.id === decodeURIComponent(vdcUrn as string));

    if (!vdc) {
      return HttpResponse.json(
        {
          error: 'VDC not found',
          message: 'The requested VDC could not be found',
          details: `VDC with URN ${vdcUrn} not found`,
        },
        { status: 404 }
      );
    }

    return HttpResponse.json(vdc);
  }),

  // CloudAPI Admin VDCs endpoints (Admin API)
  http.get('/api/admin/org/:orgId/vdcs', ({ params, request }) => {
    const { orgId } = params;
    const decodedOrgId = decodeURIComponent(orgId as string);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '25');

    // For admin API, return VDCs for the specific organization
    const vdcs = generateMockVDCs().filter(
      (vdc) => vdc.org?.id === decodedOrgId
    );
    return HttpResponse.json(
      createCloudApiPaginatedResponse(vdcs, page, pageSize)
    );
  }),

  http.get('/api/admin/org/:orgId/vdcs/:vdcId', ({ params }) => {
    const { orgId, vdcId } = params;
    const decodedOrgId = decodeURIComponent(orgId as string);
    const decodedVdcId = decodeURIComponent(vdcId as string);
    const vdcs = generateMockVDCs();
    const vdc = vdcs.find(
      (v) => v.id === decodedVdcId && v.org?.id === decodedOrgId
    );

    if (!vdc) {
      return HttpResponse.json(
        {
          error: 'VDC not found',
          message: 'The requested VDC could not be found',
          details: `VDC with ID ${vdcId} not found in organization ${orgId}`,
        },
        { status: 404 }
      );
    }

    return HttpResponse.json(vdc);
  }),

  // CloudAPI VM Management endpoints

  // Get all VMs
  http.get('/cloudapi/1.0.0/vms', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '25');

    return HttpResponse.json(
      createCloudApiPaginatedResponse(vmStore, page, pageSize)
    );
  }),

  // Get specific VM
  http.get('/cloudapi/1.0.0/vms/:vmUrn', ({ params }) => {
    const { vmUrn } = params;
    const vm = vmStore.find(
      (v) => v.id === decodeURIComponent(vmUrn as string)
    );

    if (!vm) {
      return HttpResponse.json(
        {
          error: 'VM not found',
          message: 'The requested VM could not be found',
          details: `VM with URN ${vmUrn} not found`,
        },
        { status: 404 }
      );
    }

    return HttpResponse.json(vm);
  }),

  // Get VM hardware configuration
  http.get(
    '/cloudapi/1.0.0/vms/:vmUrn/virtualHardwareSection',
    ({ params }) => {
      const { vmUrn } = params;

      // Mock hardware section
      const hardwareSection = {
        items: [
          {
            id: 1,
            resourceType: 3,
            elementName: 'CPU',
            quantity: 2,
            virtualQuantity: 2,
            virtualQuantityUnits: 'hertz * 10^6',
          },
          {
            id: 2,
            resourceType: 4,
            elementName: 'Memory',
            quantity: 4096,
            virtualQuantity: 4096,
            virtualQuantityUnits: 'byte * 2^20',
          },
          {
            id: 3,
            resourceType: 17,
            elementName: 'Hard Disk 1',
            quantity: 50,
            virtualQuantity: 50,
            virtualQuantityUnits: 'byte * 2^30',
          },
        ],
        links: [
          {
            rel: 'edit',
            href: `https://vcd.example.com/cloudapi/1.0.0/vms/${vmUrn}/virtualHardwareSection`,
            type: 'application/json',
          },
        ],
      };

      return HttpResponse.json(hardwareSection);
    }
  ),

  // VM Power Operations
  http.post('/cloudapi/1.0.0/vms/:vmUrn/actions/powerOn', () => {
    return HttpResponse.json(
      { message: 'VM power on initiated' },
      { status: 202 }
    );
  }),

  http.post('/cloudapi/1.0.0/vms/:vmUrn/actions/powerOff', () => {
    return HttpResponse.json(
      { message: 'VM power off initiated' },
      { status: 202 }
    );
  }),

  http.post('/cloudapi/1.0.0/vms/:vmUrn/actions/reboot', () => {
    return HttpResponse.json(
      { message: 'VM reboot initiated' },
      { status: 202 }
    );
  }),

  http.post('/cloudapi/1.0.0/vms/:vmUrn/actions/suspend', () => {
    return HttpResponse.json(
      { message: 'VM suspend initiated' },
      { status: 202 }
    );
  }),

  http.post('/cloudapi/1.0.0/vms/:vmUrn/actions/reset', () => {
    return HttpResponse.json(
      { message: 'VM reset initiated' },
      { status: 202 }
    );
  }),

  // Delete VM
  http.delete('/cloudapi/1.0.0/vms/:vmUrn', ({ params }) => {
    const { vmUrn } = params;
    const vmIndex = vmStore.findIndex(
      (v) => v.id === decodeURIComponent(vmUrn as string)
    );
    if (vmIndex !== -1) {
      vmStore.splice(vmIndex, 1);
    }
    return HttpResponse.json(
      { message: 'VM deletion initiated' },
      { status: 202 }
    );
  }),

  // CloudAPI vApp Management endpoints

  // Get all vApps
  http.get('/cloudapi/1.0.0/vapps', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '25');

    return HttpResponse.json(
      createCloudApiPaginatedResponse(vappStore, page, pageSize)
    );
  }),

  // Get vApps for a specific VDC
  http.get('/cloudapi/1.0.0/vdcs/:vdcId/vapps', ({ params, request }) => {
    const { vdcId } = params;
    const decodedVdcId = decodeURIComponent(vdcId as string);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '25');

    // Filter vApps by VDC
    const vdcVApps = vappStore.filter((vapp) => vapp.vdc?.id === decodedVdcId);

    return HttpResponse.json(
      createCloudApiPaginatedResponse(vdcVApps, page, pageSize)
    );
  }),

  // Get specific vApp
  http.get('/cloudapi/1.0.0/vapps/:vappUrn', ({ params }) => {
    const { vappUrn } = params;
    const vapp = vappStore.find(
      (v) => v.id === decodeURIComponent(vappUrn as string)
    );

    if (!vapp) {
      return HttpResponse.json(
        {
          error: 'vApp not found',
          message: 'The requested vApp could not be found',
          details: `vApp with URN ${vappUrn} not found`,
        },
        { status: 404 }
      );
    }

    return HttpResponse.json(vapp);
  }),

  // Delete vApp
  http.delete('/cloudapi/1.0.0/vapps/:vappUrn', ({ params }) => {
    const { vappUrn } = params;
    const vappIndex = vappStore.findIndex(
      (v) => v.id === decodeURIComponent(vappUrn as string)
    );
    if (vappIndex !== -1) {
      vappStore.splice(vappIndex, 1);
    }
    return HttpResponse.json(
      { message: 'vApp deletion initiated' },
      { status: 202 }
    );
  }),

  // Template instantiation endpoint
  http.post(
    '/cloudapi/1.0.0/vdcs/:vdcUrn/actions/instantiateTemplate',
    async ({ params, request }) => {
      const { vdcUrn } = params;
      const decodedVdcUrn = decodeURIComponent(vdcUrn as string);

      const body = (await request.json()) as {
        name?: string;
        description?: string;
        [key: string]: unknown;
      };

      // Look up the matching VDC from generateMockVDCs()
      const vdcs = generateMockVDCs();
      const targetVdc = vdcs.find((vdc) => vdc.id === decodedVdcUrn);

      // Create a new vApp based on the template instantiation request
      const vapp = generateMockVApp(body?.name, body?.description);

      // Update status to INSTANTIATING initially
      vapp.status = 'INSTANTIATING';

      // Assign the correct VDC and organization information
      if (targetVdc) {
        vapp.vdc = { id: targetVdc.id, name: targetVdc.name };
        if (targetVdc.org) {
          vapp.org = {
            id: targetVdc.org.id,
            name: targetVdc.org.name ?? targetVdc.org.id,
          };
        }
      }

      // Add to store for consistent access
      vappStore.push(vapp);

      return HttpResponse.json(vapp, {
        status: 201,
      });
    }
  ),

  // Users API endpoints
  http.get('/cloudapi/1.0.0/users', ({ request }) => {
    const url = new URL(request.url);
    const searchParam = url.searchParams.get('search');

    // Generate mock users
    let users = [
      generateMockUser(),
      {
        ...generateMockUser(),
        id: 'urn:vcloud:user:2',
        username: 'jane.smith@example.com',
        fullName: 'Jane Smith',
        email: 'jane.smith@example.com',
        roleEntityRefs: [
          { name: 'System Administrator', id: 'urn:vcloud:role:system-admin' },
        ],
      },
      {
        ...generateMockUser(),
        id: 'urn:vcloud:user:3',
        username: 'bob.wilson@example.com',
        fullName: 'Bob Wilson',
        email: 'bob.wilson@example.com',
        roleEntityRefs: [
          { name: 'vApp User', id: 'urn:vcloud:role:vapp-user' },
        ],
      },
    ];

    // Filter by search if provided
    if (searchParam) {
      users = users.filter(
        (user) =>
          user.username.toLowerCase().includes(searchParam.toLowerCase()) ||
          user.fullName?.toLowerCase().includes(searchParam.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchParam.toLowerCase())
      );
    }

    return HttpResponse.json(createCloudApiPaginatedResponse(users, 1, 25));
  }),

  http.get('/cloudapi/1.0.0/users/:userUrn', ({ params }) => {
    const { userUrn } = params;
    const decodedUrn = decodeURIComponent(userUrn as string);

    // Generate mock user based on URN
    let user = generateMockUser();
    if (decodedUrn.includes('user:2')) {
      user = {
        ...user,
        id: 'urn:vcloud:user:2',
        username: 'jane.smith@example.com',
        fullName: 'Jane Smith',
        email: 'jane.smith@example.com',
        roleEntityRefs: [
          { name: 'System Administrator', id: 'urn:vcloud:role:system-admin' },
        ],
      };
    } else if (decodedUrn.includes('user:3')) {
      user = {
        ...user,
        id: 'urn:vcloud:user:3',
        username: 'bob.wilson@example.com',
        fullName: 'Bob Wilson',
        email: 'bob.wilson@example.com',
        roleEntityRefs: [
          { name: 'vApp User', id: 'urn:vcloud:role:vapp-user' },
        ],
      };
    }

    return HttpResponse.json(createApiResponse(user));
  }),

  http.put('/cloudapi/1.0.0/users/:userUrn', async ({ params, request }) => {
    const { userUrn } = params;
    const updateData = (await request.json()) as UserUpdateRequest;

    // Get the existing user (for simulation)
    let user = generateMockUser();
    const decodedUrn = decodeURIComponent(userUrn as string);

    if (decodedUrn.includes('user:2')) {
      user = {
        ...user,
        id: 'urn:vcloud:user:2',
        username: 'jane.smith@example.com',
        fullName: 'Jane Smith',
        email: 'jane.smith@example.com',
      };
    } else if (decodedUrn.includes('user:3')) {
      user = {
        ...user,
        id: 'urn:vcloud:user:3',
        username: 'bob.wilson@example.com',
        fullName: 'Bob Wilson',
        email: 'bob.wilson@example.com',
      };
    }

    // Selectively merge update data to avoid unintentional overwrites
    const updatedUser = {
      ...user,
      id: decodedUrn, // Preserve the original ID
      // Only update fields that are explicitly provided
      ...(updateData.name !== undefined && { name: updateData.name }),
      ...(updateData.email !== undefined && { email: updateData.email }),
      ...(updateData.enabled !== undefined && { enabled: updateData.enabled }),
      ...(updateData.orgEntityRef !== undefined && {
        orgEntityRef: updateData.orgEntityRef,
      }),
      ...(updateData.organizationID !== undefined && {
        organizationID: updateData.organizationID,
      }),
      ...(updateData.roleEntityRefs !== undefined && {
        roleEntityRefs: updateData.roleEntityRefs,
      }),
      ...(updateData.password !== undefined && {
        password: updateData.password,
      }),
      // Handle FullName -> fullName mapping (prefer FullName then fullName)
      fullName:
        updateData.FullName !== undefined
          ? updateData.FullName
          : updateData.fullName !== undefined
            ? updateData.fullName
            : user.fullName,
    };

    return HttpResponse.json(updatedUser);
  }),

  http.post('/cloudapi/1.0.0/users', async ({ request }) => {
    const createData = (await request.json()) as UserCreateRequest;

    // Create a new user with a unique ID
    const newUser = {
      ...generateMockUser(),
      id: `urn:vcloud:user:${Date.now()}`, // Generate unique ID
      username: createData.username,
      fullName: createData.name || createData.FullName,
      email: createData.email,
      enabled: createData.enabled ?? true,
      orgEntityRef: createData.orgEntityRef,
      roleEntityRefs: createData.roleEntityRefs || [],
    };

    return HttpResponse.json(createApiResponse(newUser), { status: 201 });
  }),

  // Additional user endpoints for /api/cloudapi path
  http.get('/api/cloudapi/1.0.0/users', ({ request }) => {
    const url = new URL(request.url);
    const searchParam = url.searchParams.get('search');

    // Generate mock users (same logic as above)
    let users = [
      generateMockUser(),
      {
        ...generateMockUser(),
        id: 'urn:vcloud:user:2',
        username: 'jane.smith@example.com',
        fullName: 'Jane Smith',
        email: 'jane.smith@example.com',
        roleEntityRefs: [
          { name: 'System Administrator', id: 'urn:vcloud:role:system-admin' },
        ],
      },
      {
        ...generateMockUser(),
        id: 'urn:vcloud:user:3',
        username: 'bob.wilson@example.com',
        fullName: 'Bob Wilson',
        email: 'bob.wilson@example.com',
        roleEntityRefs: [
          { name: 'vApp User', id: 'urn:vcloud:role:vapp-user' },
        ],
      },
    ];

    if (searchParam) {
      users = users.filter(
        (user) =>
          user.username.toLowerCase().includes(searchParam.toLowerCase()) ||
          user.fullName?.toLowerCase().includes(searchParam.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchParam.toLowerCase())
      );
    }

    return HttpResponse.json(createCloudApiPaginatedResponse(users, 1, 25));
  }),

  http.get('/api/cloudapi/1.0.0/users/:userUrn', ({ params }) => {
    const { userUrn } = params;
    const decodedUrn = decodeURIComponent(userUrn as string);

    let user = generateMockUser();
    if (decodedUrn.includes('user:2')) {
      user = {
        ...user,
        id: 'urn:vcloud:user:2',
        username: 'jane.smith@example.com',
        fullName: 'Jane Smith',
        email: 'jane.smith@example.com',
        roleEntityRefs: [
          { name: 'System Administrator', id: 'urn:vcloud:role:system-admin' },
        ],
      };
    } else if (decodedUrn.includes('user:3')) {
      user = {
        ...user,
        id: 'urn:vcloud:user:3',
        username: 'bob.wilson@example.com',
        fullName: 'Bob Wilson',
        email: 'bob.wilson@example.com',
        roleEntityRefs: [
          { name: 'vApp User', id: 'urn:vcloud:role:vapp-user' },
        ],
      };
    }

    return HttpResponse.json(createApiResponse(user));
  }),

  http.put(
    '/api/cloudapi/1.0.0/users/:userUrn',
    async ({ params, request }) => {
      const { userUrn } = params;
      const updateData = (await request.json()) as UserUpdateRequest;

      let user = generateMockUser();
      const decodedUrn = decodeURIComponent(userUrn as string);

      if (decodedUrn.includes('user:2')) {
        user = {
          ...user,
          id: 'urn:vcloud:user:2',
          username: 'jane.smith@example.com',
          fullName: 'Jane Smith',
          email: 'jane.smith@example.com',
        };
      } else if (decodedUrn.includes('user:3')) {
        user = {
          ...user,
          id: 'urn:vcloud:user:3',
          username: 'bob.wilson@example.com',
          fullName: 'Bob Wilson',
          email: 'bob.wilson@example.com',
        };
      }

      // Selectively merge update data to avoid unintentional overwrites
      const updatedUser = {
        ...user,
        id: decodedUrn, // Preserve the original ID
        // Only update fields that are explicitly provided
        ...(updateData.name !== undefined && { name: updateData.name }),
        ...(updateData.email !== undefined && { email: updateData.email }),
        ...(updateData.enabled !== undefined && {
          enabled: updateData.enabled,
        }),
        ...(updateData.orgEntityRef !== undefined && {
          orgEntityRef: updateData.orgEntityRef,
        }),
        ...(updateData.organizationID !== undefined && {
          organizationID: updateData.organizationID,
        }),
        ...(updateData.roleEntityRefs !== undefined && {
          roleEntityRefs: updateData.roleEntityRefs,
        }),
        ...(updateData.password !== undefined && {
          password: updateData.password,
        }),
        // Handle FullName -> fullName mapping (prefer FullName then fullName)
        fullName:
          updateData.FullName !== undefined
            ? updateData.FullName
            : updateData.fullName !== undefined
              ? updateData.fullName
              : user.fullName,
      };

      return HttpResponse.json(updatedUser);
    }
  ),

  http.post('/api/cloudapi/1.0.0/users', async ({ request }) => {
    const createData = (await request.json()) as UserCreateRequest;

    const newUser = {
      ...generateMockUser(),
      id: `urn:vcloud:user:${Date.now()}`,
      username: createData.username,
      fullName: createData.name || createData.FullName,
      email: createData.email,
      enabled: createData.enabled ?? true,
      orgEntityRef: createData.orgEntityRef,
      roleEntityRefs: createData.roleEntityRefs || [],
    };

    return HttpResponse.json(createApiResponse(newUser), { status: 201 });
  }),

  // Roles API endpoints - handle both /cloudapi and /api/cloudapi paths
  http.get('/cloudapi/1.0.0/roles', ({ request }) => {
    const url = new URL(request.url);
    const searchParam = url.searchParams.get('search');

    let roles = generateMockRoles();

    // Filter by search if provided
    if (searchParam) {
      roles = roles.filter((role) =>
        role.name.toLowerCase().includes(searchParam.toLowerCase())
      );
    }

    return HttpResponse.json(createCloudApiPaginatedResponse(roles, 1, 25));
  }),

  http.get('/cloudapi/1.0.0/roles/:roleUrn', ({ params }) => {
    const { roleUrn } = params;
    const roles = generateMockRoles();
    const role = roles.find(
      (r) => r.id === decodeURIComponent(roleUrn as string)
    );

    if (!role) {
      return HttpResponse.json(
        {
          message: 'The requested role could not be found',
          details: `Role with URN ${roleUrn} not found`,
        },
        { status: 404 }
      );
    }

    return HttpResponse.json(createApiResponse(role));
  }),

  // Additional roles endpoints for /api/cloudapi path (in case of different base URL config)
  http.get('/api/cloudapi/1.0.0/roles', ({ request }) => {
    const url = new URL(request.url);
    const searchParam = url.searchParams.get('search');

    let roles = generateMockRoles();

    // Filter by search if provided
    if (searchParam) {
      roles = roles.filter((role) =>
        role.name.toLowerCase().includes(searchParam.toLowerCase())
      );
    }

    return HttpResponse.json(createCloudApiPaginatedResponse(roles, 1, 25));
  }),

  http.get('/api/cloudapi/1.0.0/roles/:roleUrn', ({ params }) => {
    const { roleUrn } = params;
    const roles = generateMockRoles();
    const role = roles.find(
      (r) => r.id === decodeURIComponent(roleUrn as string)
    );

    if (!role) {
      return HttpResponse.json(
        {
          message: 'The requested role could not be found',
          details: `Role with URN ${roleUrn} not found`,
        },
        { status: 404 }
      );
    }

    return HttpResponse.json(createApiResponse(role));
  }),
];
