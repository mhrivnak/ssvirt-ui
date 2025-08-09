import { http, HttpResponse } from 'msw';
import type {
  PaginatedResponse,
  ApiResponse,
  VCloudPaginatedResponse,
} from '../types';
import {
  generateMockOrganizations,
  generateMockVDCs,
  generateMockVMs,
  generateMockCatalogs,
  generateMockDashboardStats,
  generateMockRecentActivity,
  generateMockUser,
} from './data';

const BASE_URL = '/api/v1';

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
];
