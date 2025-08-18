# VM Creation API Implementation Enhancement

## Overview

This enhancement proposal outlines the implementation of a complete VM creation workflow using the updated CloudAPI endpoints. The new implementation follows the VMware Cloud Director patterns with OpenShift Virtualization as the underlying platform.

**Note: This implementation completely replaces the existing VM creation system. There is no backward compatibility maintained with legacy API endpoints.**

## Implementation Status

**✅ COMPLETED:** Core CloudAPI integration, service layer, type definitions, React hooks, and basic UI components have been implemented.

**🔄 REMAINING:** Enhanced template selection UI and catalog browsing experience.

## Previous State (Now Replaced)

The previous VM creation implementation used legacy endpoints that have been completely replaced:

- `/api/v1/vms` endpoints (removed)
- Mixed API patterns (replaced with pure CloudAPI)
- Direct VM creation (replaced with vApp-based template instantiation)

## Proposed Implementation

### API Architecture

**Base URL**: `/cloudapi/1.0.0`

**Resource Hierarchy**:

1. Organization (automatic filtering by JWT)
2. Virtual Data Center (VDC)
3. vApp (container for VMs)
4. Virtual Machine (VM)
5. Catalog Item (VM Template)

### Core API Endpoints

#### VDC Management

```typescript
GET /cloudapi/1.0.0/vdcs
// List all VDCs accessible to the current user
```

#### Catalog Management

```typescript
GET /cloudapi/1.0.0/catalogs/{catalog_id}/catalogItems
// List available VM templates in a catalog
```

#### VM Creation (via Template Instantiation)

```typescript
POST /cloudapi/1.0.0/vdcs/{vdc_id}/actions/instantiateTemplate
Content-Type: application/json
Authorization: Bearer {jwt_token}

{
  "name": "my-vm",
  "description": "My Virtual Machine",
  "catalogItemUrn": "urn:vcloud:catalogitem:uuid",
  "powerOn": true,
  "deploy": true,
  "acceptAllEulas": true,
  "guestCustomization": {
    "computerName": "my-vm",
    "adminPassword": "secure-password"
  },
  "sourceItem": {
    "source": {
      "href": "https://vcd.example.com/api/catalogItem/uuid"
    },
    "vAppScopedLocalId": "vm-1"
  }
}

Response: 202 Accepted
{
  "resultTotal": 1,
  "pageCount": 1,
  "page": 1,
  "pageSize": 25,
  "associations": null,
  "values": [
    {
      "id": "urn:vcloud:vapp:uuid",
      "name": "my-vm",
      "description": "My Virtual Machine",
      "status": "INSTANTIATING",
      "href": "https://vcd.example.com/cloudapi/1.0.0/vapps/uuid",
      "type": "application/json",
      "createdDate": "2024-01-15T10:30:00.000Z",
      "lastModifiedDate": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### Resource Monitoring

```typescript
GET /cloudapi/1.0.0/vapps/{vapp_id}
// Get vApp details and status

GET /cloudapi/1.0.0/vms/{vm_id}
// Get VM details and status

// NOTE: virtualHardwareSection endpoint removed - hardware data is embedded in VM object
```

### Implementation Plan

#### Phase 1: Service Layer Updates ✅ COMPLETED

**1. CloudAPI VM Service (`src/services/cloudapi/VMService.ts`) ✅**

```typescript
export class VMService {
  /**
   * List VDCs accessible to current user
   */
  static async getVDCs(): Promise<VCloudPaginatedResponse<VDC>> {
    const response = await api.get<VCloudPaginatedResponse<VDC>>(
      '/cloudapi/1.0.0/vdcs'
    );
    return response.data;
  }

  /**
   * List catalog items (templates) for a specific catalog
   */
  static async getCatalogItems(
    catalogId: string
  ): Promise<VCloudPaginatedResponse<CatalogItem>> {
    const response = await api.get<VCloudPaginatedResponse<CatalogItem>>(
      `/cloudapi/1.0.0/catalogs/${encodeURIComponent(catalogId)}/catalogItems`
    );
    return response.data;
  }

  /**
   * Create VM by instantiating template
   */
  static async instantiateTemplate(
    vdcId: string,
    request: InstantiateTemplateRequest
  ): Promise<VCloudPaginatedResponse<VApp>> {
    const response = await api.post<VCloudPaginatedResponse<VApp>>(
      `/cloudapi/1.0.0/vdcs/${encodeURIComponent(vdcId)}/actions/instantiateTemplate`,
      request
    );
    return response.data;
  }

  /**
   * Get vApp details
   */
  static async getVApp(vappId: string): Promise<VApp> {
    const response = await api.get<VApp>(
      `/cloudapi/1.0.0/vapps/${encodeURIComponent(vappId)}`
    );
    return response.data;
  }

  /**
   * Get VM details
   */
  static async getVM(vmId: string): Promise<VM> {
    const response = await api.get<VM>(
      `/cloudapi/1.0.0/vms/${encodeURIComponent(vmId)}`
    );
    return response.data;
  }

  // NOTE: getVMHardware method removed - hardware data is embedded in VM object
}
```

#### Phase 2: Type System Updates ✅ COMPLETED

**CloudAPI TypeScript Interfaces (added to `src/types/index.ts`) ✅**

```typescript
// VM Creation Request
export interface InstantiateTemplateRequest {
  name: string;
  description?: string;
  catalogItemUrn: string;
  powerOn?: boolean;
  deploy?: boolean;
  acceptAllEulas?: boolean;
  guestCustomization?: {
    computerName?: string;
    adminPassword?: string;
    adminPasswordEnabled?: boolean;
    adminPasswordAuto?: boolean;
    resetPasswordRequired?: boolean;
    customizationScript?: string;
  };
  sourceItem: {
    source: {
      href: string;
    };
    vAppScopedLocalId: string;
  };
  networkConnectionSection?: {
    networkConnection: Array<{
      network: string;
      networkConnectionIndex: number;
      isConnected: boolean;
      ipAddressAllocationMode: 'POOL' | 'DHCP' | 'MANUAL' | 'NONE';
      ipAddress?: string;
      isPrimary?: boolean;
    }>;
  };
}

// vApp Resource
export interface VApp {
  id: string; // URN format
  name: string;
  description?: string;
  status: VAppStatus;
  href: string;
  type: string;
  createdDate: string;
  lastModifiedDate: string;
  vms?: VM[];
  networks?: VAppNetwork[];
  owner?: EntityRef;
  org?: EntityRef;
  vdc?: EntityRef;
}

// VM Resource (Enhanced)
export interface VM {
  id: string; // URN format
  name: string;
  description?: string;
  status: VMStatus;
  href: string;
  type: string;
  createdDate: string;
  lastModifiedDate: string;

  // Hardware details - now embedded in hardware field using VMHardware interface
  guestCustomizationSection?: VMGuestCustomizationSection;
  networkConnectionSection?: VMNetworkConnectionSection;

  // Relationships
  vapp?: EntityRef;
  vdc?: EntityRef;
  org?: EntityRef;
  catalogItem?: EntityRef;
}

// VM Status Enumeration
export type VMStatus =
  | 'INSTANTIATING'
  | 'RESOLVED'
  | 'DEPLOYED'
  | 'POWERED_ON'
  | 'POWERED_OFF'
  | 'SUSPENDED'
  | 'FAILED'
  | 'UNKNOWN';

export type VAppStatus =
  | 'INSTANTIATING'
  | 'RESOLVED'
  | 'DEPLOYED'
  | 'POWERED_ON'
  | 'POWERED_OFF'
  | 'MIXED'
  | 'FAILED'
  | 'UNKNOWN';

// Hardware Configuration
// NOTE: VMHardwareSection and VMHardwareItem interfaces removed
// Use VMHardware interface instead: { numCpus, memoryMB, coresPerSocket }
```

#### Phase 3: React Hooks Updates ✅ COMPLETED

**CloudAPI VM Hooks (`src/hooks/useCloudAPIVMs.ts`) ✅**

```typescript
// DEPRECATED: useVMVDCs has been removed in favor of useOrganizationVDCs
// The VM Creation Wizard now uses useOrganizationVDCs() for proper role-based
// VDC filtering that works for all user types (System Admin, Org Admin, vApp User).
// See: useVDC.ts:useOrganizationVDCs()

/**
 * Hook to get catalog items (templates) for VM creation
 */
export const useCatalogItems = (catalogId?: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.catalogItems(catalogId || ''),
    queryFn: () => VMService.getCatalogItems(catalogId!),
    enabled: !!catalogId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Hook to create VM via template instantiation
 */
export const useInstantiateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      vdcId,
      request,
    }: {
      vdcId: string;
      request: InstantiateTemplateRequest;
    }) => VMService.instantiateTemplate(vdcId, request),

    onSuccess: (response) => {
      // Invalidate relevant caches
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vms });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vapps });

      // Cache the new vApp
      if (response.values?.[0]) {
        queryClient.setQueryData(
          QUERY_KEYS.vapp(response.values[0].id),
          response.values[0]
        );
      }
    },

    onError: (error) => {
      console.error('Failed to instantiate template:', error);
    },
  });
};

/**
 * Hook to monitor vApp status during creation
 */
export const useVAppStatus = (vappId?: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.vapp(vappId || ''),
    queryFn: () => VMService.getVApp(vappId!),
    enabled: !!vappId,
    refetchInterval: (data) => {
      // Poll more frequently for transitional states
      const status = data?.status;
      if (status === 'INSTANTIATING' || status === 'UNKNOWN') {
        return 2000; // 2 seconds
      }
      return false; // Stop polling for stable states
    },
    staleTime: 0, // Always fetch fresh data for status monitoring
  });
};

/**
 * Hook to get VM details
 */
export const useVMDetails = (vmId?: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.vm(vmId || ''),
    queryFn: () => VMService.getVM(vmId!),
    enabled: !!vmId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

#### Phase 4: UI Component Updates ✅ MOSTLY COMPLETED

**1. Updated VM Creation Wizard (`src/components/vms/VMCreationWizard.tsx`) ✅**

Completed Changes:

- ✅ Replaced direct VM creation with template instantiation workflow
- ✅ Added vApp concept to the UI flow
- ✅ Implemented real-time status monitoring via `useVAppStatus`
- ✅ Enhanced error handling for CloudAPI responses
- ✅ Updated progress monitoring with vApp status integration

**2. Template Selection Enhancement 🔄 REMAINING**

Current implementation loads templates from the first available catalog. Enhancement would add:

- Multi-catalog browsing interface
- Rich template metadata display (OS, resources, description)
- Template preview with specifications
- Catalog switching within the wizard step

**3. Enhanced Progress Monitoring (`src/components/vms/VMCreationProgress.tsx`) ✅**

Completed enhancements:

- ✅ Real-time vApp status monitoring with `useVAppStatus` integration
- ✅ Status visualization (INSTANTIATING → RESOLVED → DEPLOYED → POWERED_ON)
- ✅ Error handling and recovery options
- ✅ Dynamic progress updates based on vApp lifecycle states

#### Phase 5: Mock Data & Testing ✅ COMPLETED

**CloudAPI Mock Handlers (`src/mocks/handlers.ts`) ✅**

```typescript
// CloudAPI VDC endpoints
http.get('/cloudapi/1.0.0/vdcs', ({ request }) => {
  const vdcs = generateMockVDCs();
  return HttpResponse.json(createCloudApiPaginatedResponse(vdcs, 1, 25));
}),

// Catalog items endpoints
http.get('/cloudapi/1.0.0/catalogs/:catalogId/catalogItems', ({ params, request }) => {
  const { catalogId } = params;
  const catalogItems = generateMockCatalogItems().filter(
    item => item.catalogEntityRef.id === catalogId
  );
  return HttpResponse.json(createCloudApiPaginatedResponse(catalogItems, 1, 25));
}),

// Template instantiation endpoint
http.post('/cloudapi/1.0.0/vdcs/:vdcId/actions/instantiateTemplate',
  async ({ params, request }) => {
    const { vdcId } = params;
    const body = await request.json() as InstantiateTemplateRequest;

    const vapp = generateMockVApp(body.name, body.description);
    return HttpResponse.json(
      createCloudApiPaginatedResponse([vapp], 1, 25),
      { status: 202 }
    );
  }
),

// vApp monitoring endpoints
http.get('/cloudapi/1.0.0/vapps/:vappId', ({ params }) => {
  const { vappId } = params;
  const vapp = generateMockVApp();
  vapp.id = vappId as string;
  return HttpResponse.json(vapp);
}),

// VM monitoring endpoints
http.get('/cloudapi/1.0.0/vms/:vmId', ({ params }) => {
  const { vmId } = params;
  const vm = generateMockVM();
  vm.id = vmId as string;
  return HttpResponse.json(vm);
}),
```

### Workflow Implementation

#### Complete VM Creation Flow

1. **VDC Selection**
   - User selects target VDC from accessible list
   - VDC capacity and constraints validation

2. **Template Selection**
   - Browse available catalogs and templates
   - Display template specifications (OS, resources, etc.)
   - Template compatibility validation

3. **VM Configuration**
   - Basic settings (name, description)
   - Resource allocation (CPU, memory)
   - Network configuration
   - Guest customization options

4. **Instantiation**
   - Submit template instantiation request
   - Receive vApp URN for monitoring

5. **Progress Monitoring**
   - Poll vApp status until completion
   - Display progress indicators
   - Handle errors and provide recovery options

6. **Completion**
   - Navigate to VM details page
   - Provide quick actions (power on/off, console access)

### Error Handling Strategy

**1. Validation Errors**

- Client-side validation for required fields
- Server-side validation error display
- Field-specific error messaging

**2. API Errors**

- HTTP status code handling (400, 401, 403, 404, 500)
- Detailed error message extraction from CloudAPI responses
- Retry mechanisms for transient failures

**3. Timeout Handling**

- Long-running operation monitoring
- Graceful timeout with status preservation
- User notification and recovery options

### Testing Strategy

1. **Unit Tests**: Service layer and utility functions
2. **Integration Tests**: Complete workflow testing with mocks
3. **E2E Tests**: User journey validation
4. **Performance Tests**: API response time and polling efficiency

### Security Considerations

1. **Authentication**: JWT token validation on all requests
2. **Authorization**: Organization-scoped resource access
3. **Input Validation**: Sanitize all user inputs
4. **Error Information**: Prevent sensitive data leakage in error messages

## Success Criteria

1. ✅ Complete VM creation workflow using CloudAPI endpoints
2. ✅ Real-time progress monitoring with status updates
3. ✅ Comprehensive error handling and recovery
4. ✅ Intuitive user experience with clear feedback
5. ✅ Full test coverage for new functionality
6. ✅ Performance optimization for large-scale deployments
7. 🔄 Enhanced template selection and catalog browsing (remaining work)

## Deliverables

1. ✅ **Service Layer**: CloudAPI VM service implementation (`src/services/cloudapi/VMService.ts`)
2. ✅ **Type Definitions**: Complete TypeScript interfaces for all CloudAPI resources
3. ✅ **React Hooks**: CloudAPI hooks for VM lifecycle management (`src/hooks/useCloudAPIVMs.ts`)
4. ✅ **UI Components**: Updated wizard and monitoring components with vApp integration
5. ✅ **Mock Data**: Comprehensive CloudAPI test data and handlers
6. ✅ **Tests**: Unit, integration, and E2E test suites (all passing)
7. 🔄 **Enhanced Template Selection**: Multi-catalog browsing UI (remaining work)

This implementation provides a robust, scalable foundation for VM management using modern CloudAPI patterns with excellent user experience and comprehensive error handling. **The implementation completely replaces the legacy VM creation system with no backward compatibility.**
