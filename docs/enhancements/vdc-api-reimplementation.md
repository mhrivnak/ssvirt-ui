# VDC API Reimplementation

## Overview

This enhancement reimplements the Virtual Data Center (VDC) API to conform
exactly to the VMware Cloud Director API specification. The new implementation
will replace the existing VDC API with proper CloudAPI compliance,
authentication, and data models.

## Motivation

The current VDC API implementation does not conform to VMware Cloud Director standards and lacks proper integration with the CloudAPI authentication system. This reimplementation will:

1. Align with VMware Cloud Director API patterns and conventions
2. Implement proper role-based access control (System Administrator only)
3. Use correct data models and response formats
4. Follow established pagination and error handling patterns
5. Replace all legacy VDC code with VMware-compliant implementation

## Goals

- **Primary**: Implement VMware Cloud Director compliant VDC API
- **Secondary**: Ensure seamless integration with existing authentication and authorization
- **Tertiary**: Maintain consistent API patterns across the application

## Non-Goals

- **NO backward compatibility**: The previous VDC APIs are considered obsolete and will be completely removed
- Support for roles other than System Administrator
- Implementation of storage profile management (deferred)

## Implementation Approach

**Complete Replacement Strategy**: This implementation assumes the previous VDC APIs no longer exist. All legacy VDC code will be removed and replaced with a clean, VMware-compliant implementation that aligns exactly with the Go API server backend. No migration path or compatibility layer is needed.

**Backend Alignment**: This frontend implementation is designed to work with the existing Go API server implementation at `pkg/api/handlers/vdcs.go`, ensuring perfect compatibility with data structures, authentication patterns, and API behavior.

## API Specification

### Base URL

```
/api/admin/org/{orgId}/vdcs
```

### Authentication

- Requires VMware Cloud Director Bearer token authentication (matches Go server JWT implementation)
- System Administrator role required for all operations
- Authentication middleware validates user claims for system admin privileges

### Endpoints

#### 1. List VDCs

```
GET /api/admin/org/{orgId}/vdcs
```

**Query Parameters:**

- `page` (optional): Page number for pagination
- `pageSize` (optional): Number of items per page
- `sortAsc` (optional): Sort field for ascending order
- `sortDesc` (optional): Sort field for descending order
- `filter` (optional): Filter expression

**Response:**

```typescript
{
  "resultTotal": number,
  "pageCount": number,
  "page": number,
  "pageSize": number,
  "associations": [],
  "values": VDC[]
}
```

#### 2. Get VDC

```
GET /api/admin/org/{orgId}/vdcs/{vdcId}
```

**Response:**

```typescript
VDC;
```

#### 3. Create VDC

```
POST /api/admin/org/{orgId}/vdcs
Content-Type: application/json

{
  "name": string,
  "description": string, // optional
  "allocationModel": "PayAsYouGo" | "AllocationPool" | "ReservationPool" | "Flex",
  "computeCapacity": {
    "cpu": {
      "allocated": number,
      "limit": number,
      "units": "MHz"
    },
    "memory": {
      "allocated": number,
      "limit": number,
      "units": "MB"
    }
  },
  "providerVdc": {
    "id": string
  },
  "nicQuota": number, // optional, defaults to 100
  "networkQuota": number, // optional, defaults to 50
  "vdcStorageProfiles": {
    "providerVdcStorageProfile": {
      "id": string,
      "limit": number,
      "units": "MB",
      "default": boolean
    }
  },
  "isThinProvision": boolean,
  "isEnabled": boolean
}
```

#### 4. Update VDC

```
PUT /api/admin/org/{orgId}/vdcs/{vdcId}
Content-Type: application/json

{
  "name": string,
  "description": string,
  "allocationModel": "PayAsYouGo" | "AllocationPool" | "ReservationPool" | "Flex",
  "computeCapacity": {
    "cpu": {
      "allocated": number,
      "limit": number,
      "units": "MHz"
    },
    "memory": {
      "allocated": number,
      "limit": number,
      "units": "MB"
    }
  },
  "providerVdc": {
    "id": string
  },
  "nicQuota": number,
  "networkQuota": number,
  "vdcStorageProfiles": {
    "providerVdcStorageProfile": {
      "id": string,
      "limit": number,
      "units": "MB",
      "default": boolean
    }
  },
  "isThinProvision": boolean,
  "isEnabled": boolean
}
```

#### 5. Delete VDC

```
DELETE /api/admin/org/{orgId}/vdcs/{vdcId}
```

**Response:**

- `204 No Content` on success
- `409 Conflict` if VDC contains resources

## Data Model

### VDC Entity

```typescript
interface VDC {
  id: string; // URN format: urn:vcloud:vdc:uuid
  name: string;
  description?: string;
  allocationModel: 'PayAsYouGo' | 'AllocationPool' | 'ReservationPool' | 'Flex';
  computeCapacity: {
    cpu: {
      allocated: number;
      limit: number;
      units: 'MHz';
    };
    memory: {
      allocated: number;
      limit: number;
      units: 'MB';
    };
  };
  providerVdc: {
    id: string; // URN of provider VDC
  };
  nicQuota: number; // Default: 100
  networkQuota: number; // Default: 50
  vdcStorageProfiles: {
    providerVdcStorageProfile: {
      id: string;
      limit: number;
      units: 'MB';
      default: boolean;
    };
  };
  isThinProvision: boolean;
  isEnabled: boolean;
  // Standard CloudAPI fields
  org?: {
    name: string;
    id: string;
  };
  creationDate?: string;
  lastModified?: string;
  status?: number;
  tasks?: any[];
}
```

### Request/Response Types

```typescript
interface CreateVDCRequest {
  name: string;
  description?: string;
  allocationModel: 'PayAsYouGo' | 'AllocationPool' | 'ReservationPool' | 'Flex';
  computeCapacity: {
    cpu: {
      allocated: number;
      limit: number;
      units: 'MHz';
    };
    memory: {
      allocated: number;
      limit: number;
      units: 'MB';
    };
  };
  providerVdc: {
    id: string;
  };
  nicQuota?: number; // Optional, defaults to 100
  networkQuota?: number; // Optional, defaults to 50
  vdcStorageProfiles: {
    providerVdcStorageProfile: {
      id: string;
      limit: number;
      units: 'MB';
      default: boolean;
    };
  };
  isThinProvision: boolean;
  isEnabled: boolean;
}

interface UpdateVDCRequest {
  name?: string;
  description?: string;
  allocationModel?:
    | 'PayAsYouGo'
    | 'AllocationPool'
    | 'ReservationPool'
    | 'Flex';
  computeCapacity?: {
    cpu?: {
      allocated?: number;
      limit?: number;
      units?: 'MHz';
    };
    memory?: {
      allocated?: number;
      limit?: number;
      units?: 'MB';
    };
  };
  providerVdc?: {
    id: string;
  };
  nicQuota?: number;
  networkQuota?: number;
  vdcStorageProfiles?: {
    providerVdcStorageProfile: {
      id: string;
      limit: number;
      units: 'MB';
      default: boolean;
    };
  };
  isThinProvision?: boolean;
  isEnabled?: boolean;
}

interface VDCQueryParams {
  page?: number;
  pageSize?: number;
  sortAsc?: string;
  sortDesc?: string;
  filter?: string;
}
```

## Implementation Plan

### Phase 1: Complete Legacy Removal

1. **Remove old VDC service** (`src/services/vdcs.ts`) - treat as if it never existed
2. **Remove all legacy VDC types** from `src/types/index.ts`
3. **Remove any references** to old VDC API throughout codebase
4. **Clean up old imports** and dependencies

### Phase 2: Implement New Types

1. **Add new VDC types** to `src/types/index.ts`
2. **Add VDC query parameters** and request types
3. **Update QUERY_KEYS** for new VDC structure

### Phase 3: Implement CloudAPI Service

1. **Create VDCService** (`src/services/cloudapi/VDCService.ts`)
2. **Implement CRUD operations** following CloudAPI patterns
3. **Add proper error handling** and response transformation
4. **Integrate with authentication system**

### Phase 4: Update React Hooks

1. **Update useRoleBasedVDCs** hook
2. **Add individual VDC hooks** (useVDC, useCreateVDC, etc.)
3. **Implement proper query key management**
4. **Add System Administrator role checks**

### Phase 5: Update UI Components

1. **Update VDC list components** to use new data model
2. **Update VDC detail views** with new fields
3. **Implement create/edit forms** with new schema
4. **Add proper validation** and error handling

### Phase 6: Testing & Documentation

1. **Add unit tests** for VDC service
2. **Add integration tests** for VDC hooks
3. **Update component tests** for new data model
4. **Update API documentation**

## Files to be Modified/Created

### New Files

- `src/services/cloudapi/VDCService.ts` - Main VDC CloudAPI service
- `src/hooks/useVDC.ts` - Individual VDC management hooks
- `src/components/vdcs/VDCForm.tsx` - VDC create/edit form
- `src/components/vdcs/VDCDetails.tsx` - VDC detail view

### Modified Files

- `src/types/index.ts` - Add new VDC types, remove old ones
- `src/hooks/useRoleBasedData.ts` - Update VDC hooks
- `src/pages/admin/VDCs.tsx` - Update to use new API
- `src/services/cloudapi/index.ts` - Export VDC service
- Any components currently using old VDC API

### Removed Files

- `src/services/vdcs.ts` - Legacy VDC service

## Risk Assessment

### High Risk

- **Complete rewrite**: All VDC-related functionality will be rebuilt from scratch
- **Integration testing**: Ensuring new implementation works with existing systems

### Medium Risk

- **CloudAPI authentication**: Ensuring proper bearer token integration
- **UI component updates**: All VDC interfaces need complete rebuilding

### Low Risk

- **Clean slate development**: No legacy compatibility constraints simplify implementation
- **Role restrictions**: System Administrator only reduces access complexity
- **Testing**: Fresh implementation allows optimal test coverage

## Implementation Strategy

**Clean Slate Approach**: Since there is no need for backward compatibility, we can:

1. **Remove all legacy code** immediately without concern for existing functionality
2. **Design optimal data structures** without legacy constraints
3. **Implement best practices** from the start
4. **Create comprehensive tests** for the new implementation
5. **Build modern UI components** using current patterns

## Success Criteria

- [ ] All VDC CRUD operations work with CloudAPI authentication
- [ ] System Administrator role restriction enforced
- [ ] Pagination and filtering work correctly
- [ ] Error handling follows VMware Cloud Director patterns
- [ ] UI components display new data model correctly
- [ ] All tests pass
- [ ] Performance is equal or better than legacy implementation

## Timeline

- **Week 1**: Phase 1-2 (Remove legacy, implement types)
- **Week 2**: Phase 3 (CloudAPI service implementation)
- **Week 3**: Phase 4 (React hooks update)
- **Week 4**: Phase 5 (UI component updates)
- **Week 5**: Phase 6 (Testing and documentation)

## Dependencies

- VMware Cloud Director API documentation
- Existing CloudAPI authentication system
- PatternFly component library
- React Query for data management

## Future Considerations

- **Storage profile management**: Full implementation of vdcStorageProfiles
- **Provider VDC integration**: Enhanced provider VDC selection
- **Advanced filtering**: More sophisticated VDC filtering options
- **Bulk operations**: Mass VDC management capabilities
