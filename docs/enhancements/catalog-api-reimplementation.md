# Catalog API Reimplementation

## Overview

This document outlines the plan to re-implement the Catalog API to conform
exactly to the VMware Cloud Director CloudAPI specification. This work will
replace the existing legacy catalog implementation with CloudAPI-compliant
endpoints, data structures, and patterns.

## Current State

### Legacy Implementation

- **Service**: Legacy service (removed) - used `/api/v1/catalogs` endpoints
- **Hooks**: `src/hooks/useCatalogs.ts` - React Query hooks (now updated for CloudAPI)
- **Types**: `src/types/index.ts:341-363` - custom catalog types
- **UI Components**:
  - `src/pages/catalogs/Catalogs.tsx` - catalog listing page
  - `src/pages/catalogs/CatalogDetail.tsx` - catalog detail page
- **API Format**: Custom pagination with `PaginatedResponse<Catalog>`

### Issues with Current Implementation

1. **Non-compliant API endpoints** - uses custom `/api/v1/` instead of CloudAPI
2. **Incorrect data structures** - doesn't match VMware Cloud Director standards
3. **Missing access controls** - no organization-based filtering
4. **Legacy pagination** - uses custom format instead of `VCloudPaginatedResponse`
5. **Inconsistent patterns** - doesn't follow CloudAPI conventions like VDC implementation

## Target State

### CloudAPI Compliance

- **Base URL**: `/cloudapi/1.0.0/catalogs`
- **Authentication**: JWT Bearer token
- **URN Format**: `urn:vcloud:catalog:<uuid>`
- **Pagination**: VMware Cloud Director standard (`VCloudPaginatedResponse`)
- **Access Control**: Organization-based catalog access

### New API Endpoints

1. `GET /cloudapi/1.0.0/catalogs` - list catalogs with pagination
2. `GET /cloudapi/1.0.0/catalogs/{catalogUrn}` - get single catalog
3. `POST /cloudapi/1.0.0/catalogs` - create catalog
4. `PUT /cloudapi/1.0.0/catalogs/{catalogUrn}` - update catalog
5. `DELETE /cloudapi/1.0.0/catalogs/{catalogUrn}` - delete catalog

## Implementation Plan

### Phase 1: Type System Updates

1. **Update catalog types in `src/types/index.ts`**
   - Replace legacy `Catalog` interface with CloudAPI-compliant structure
   - Add new interfaces:
     - `CatalogCloudAPI` - main catalog object
     - `OrgReference` - organization reference
     - `OwnerReference` - owner reference
     - `PublishConfig` - publish configuration
     - `SubscriptionConfig` - subscription configuration
     - `CreateCatalogRequest` - catalog creation payload
     - `UpdateCatalogRequest` - catalog update payload
     - `CatalogQueryParams` - CloudAPI query parameters
   - Remove legacy types: `Catalog`, `CatalogItem`, `CatalogQueryParams`

2. **Add new query keys to `QUERY_KEYS`**
   - Update catalog-related query keys to match CloudAPI patterns
   - Ensure consistency with VDC implementation patterns

### Phase 2: Service Layer Reimplementation

1. **Create new CloudAPI service: `src/services/cloudapi/CatalogService.ts`**
   - Implement all CRUD operations following VMware Cloud Director patterns
   - Use proper URN encoding for path parameters
   - Handle CloudAPI pagination format
   - Include proper error handling and TypeScript types

2. **Remove legacy service** ✅ Complete
   - ✅ Deleted `src/services/catalogs.ts`
   - ✅ Updated `src/services/index.ts` exports to use CloudAPI `CatalogService`

### Phase 3: Hook Reimplementation

1. **Rewrite `src/hooks/useCatalogs.ts`**
   - Replace all hooks to use new CloudAPI service
   - Implement proper query key serialization for stable caching
   - Add organization-based filtering
   - Include role-based access controls
   - Follow patterns established in `src/hooks/useVDC.ts`

2. **Add new hooks**
   - `useCatalogs(params?)` - list catalogs with filtering
   - `useCatalog(catalogId)` - get single catalog
   - `useCreateCatalog()` - create catalog mutation
   - `useDeleteCatalog()` - delete catalog mutation

### Phase 4: UI Component Updates

1. **Update `src/pages/catalogs/Catalogs.tsx`**
   - Migrate to new CloudAPI data structures
   - Update filtering to use CloudAPI parameters
   - Fix pagination to use `VCloudPaginatedResponse`
   - Update organization display using `org.id` reference
   - Replace legacy properties with CloudAPI equivalents:
     - `is_shared` → `isPublished`
     - `organization` → `org.id` (requires organization lookup)
     - `created_at` → `creationDate`

2. **Update `src/pages/catalogs/CatalogDetail.tsx`**
   - Migrate to CloudAPI catalog structure
   - Update all property references
   - Add organization information display
   - Update template counts display (`numberOfVAppTemplates`)

3. **Update routing and navigation**
   - Ensure catalog URLs use URN format
   - Update all internal links to use CloudAPI catalog IDs
   - Verify breadcrumb navigation

### Phase 5: Data Migration & Mocks

1. **Update mock data in `src/mocks/data.ts`**
   - Replace legacy catalog mock data with CloudAPI-compliant structures
   - Use proper URN format for IDs
   - Include all required CloudAPI fields
   - Ensure realistic test data

2. **Update MSW handlers**
   - Replace legacy API endpoints with CloudAPI endpoints
   - Implement proper CloudAPI response formats
   - Handle URN-based routing

### Phase 6: Testing & Validation

1. **TypeScript compilation**
   - Ensure all type errors are resolved
   - Verify strict TypeScript compliance

2. **Component testing**
   - Test catalog listing with filters and pagination
   - Test catalog detail view
   - Test catalog creation and deletion
   - Verify organization-based access controls

3. **Integration testing**
   - Test with realistic CloudAPI data
   - Verify proper error handling
   - Test pagination edge cases

## Breaking Changes

### Removed Legacy Features

- **Legacy API endpoints** - `/api/v1/catalogs/*` will no longer be used
- **Legacy catalog types** - old `Catalog` and `CatalogItem` interfaces removed
- **Custom pagination** - replaced with VMware Cloud Director standard
- **Legacy hooks** - all existing catalog hooks will be replaced

### New Requirements

- **Organization context** - catalogs now require organization information
- **URN format** - all catalog IDs must use `urn:vcloud:catalog:<uuid>` format
- **CloudAPI authentication** - requires proper JWT Bearer tokens
- **Role-based access** - proper access control implementation

## Data Structure Mapping

### Legacy → CloudAPI Mapping

```typescript
// Legacy
interface Catalog {
  id: string;                    → id: "urn:vcloud:catalog:<uuid>"
  name: string;                  → name: string (unchanged)
  organization: string;          → org: { id: "urn:vcloud:org:<uuid>" }
  description: string;           → description: string (unchanged)
  is_shared: boolean;            → isPublished: boolean
  created_at: string;            → creationDate: string (ISO-8601)
  updated_at: string;            → (removed - not in CloudAPI)
}

// Legacy
interface CatalogItem {         → (removed - not in scope)
  // ... catalog items will be separate implementation
}
```

### New CloudAPI Structure

```typescript
interface CatalogCloudAPI {
  id: string; // urn:vcloud:catalog:<uuid>
  name: string;
  description: string;
  org: { id: string }; // urn:vcloud:org:<uuid>
  isPublished: boolean;
  isSubscribed: boolean;
  creationDate: string; // ISO-8601
  numberOfVAppTemplates: number;
  numberOfMedia: number; // always 0
  catalogStorageProfiles: any[]; // always empty
  publishConfig: { isPublished: boolean };
  subscriptionConfig: { isSubscribed: boolean };
  distributedCatalogConfig: object; // always empty
  owner: { id: string }; // currently empty
  isLocal: boolean; // always true
  version: number; // always 1
}
```

## Testing Strategy

### Unit Tests

- Service layer methods with proper URN handling
- Hook behavior with CloudAPI responses
- Component rendering with new data structures

### Integration Tests

- End-to-end catalog listing and filtering
- Catalog creation and deletion workflows
- Organization-based access control
- Pagination behavior

### TypeScript Validation

- Strict compilation with no type errors
- Proper CloudAPI type compliance
- Consistent patterns with VDC implementation

## Success Criteria

1. **Full CloudAPI Compliance** - All endpoints match VMware Cloud Director specification
2. **Type Safety** - Zero TypeScript compilation errors
3. **Consistent Patterns** - Follows same patterns as VDC CloudAPI implementation
4. **Functional UI** - All catalog features work with new API
5. **Proper Access Control** - Organization-based catalog filtering
6. **Performance** - Efficient React Query caching with stable keys
7. **Error Handling** - Proper CloudAPI error response handling

## Timeline

- **Phase 1-2**: Type system and service layer (1-2 days)
- **Phase 3**: Hook reimplementation (1 day)
- **Phase 4**: UI component updates (1-2 days)
- **Phase 5**: Data migration and mocks (1 day)
- **Phase 6**: Testing and validation (1 day)

**Total Estimated Effort**: 5-7 days

## Dependencies

- VMware Cloud Director CloudAPI specification compliance
- Consistency with existing VDC CloudAPI implementation patterns
- Organization management system for proper access controls
- JWT authentication system for CloudAPI endpoints

## Risk Mitigation

1. **Breaking Changes**: Complete replacement approach eliminates confusion between old/new APIs
2. **Type Safety**: Comprehensive TypeScript coverage prevents runtime errors
3. **Consistency**: Following established VDC patterns ensures architectural coherence
4. **Testing**: Thorough testing at each phase prevents integration issues
5. **Documentation**: Clear API documentation ensures proper usage patterns
