# Catalog Items API Integration

## Overview

This document outlines the plan to integrate the Catalog Items API into the
existing catalog system, enabling users to view and browse catalog items (vApp
templates) within catalogs. This enhancement will extend the current
CloudAPI-compliant catalog implementation with read-only access to catalog items
backed by OpenShift Templates.

## Current State

### Existing Catalog Implementation
- **Service**: `src/services/cloudapi/CatalogService.ts` - CloudAPI catalog operations
- **Hooks**: `src/hooks/useCatalogs.ts` - React Query hooks for catalog management
- **Types**: `src/types/index.ts` - CloudAPI-compliant catalog and basic CatalogItem types
- **UI Components**: 
  - `src/pages/catalogs/Catalogs.tsx` - catalog listing page
  - `src/pages/catalogs/CatalogDetail.tsx` - catalog detail page
- **Mock Data**: CloudAPI-compliant test data with placeholder catalog items

### Current Limitations
1. **No Catalog Items Display** - Catalog detail page shows template count but no items
2. **Placeholder CatalogItem Interface** - Basic type that doesn't match the real API
3. **Empty Catalog Items Array** - VM creation wizard shows "Templates not available" message
4. **No Item Details** - Users cannot browse or inspect available templates
5. **Missing Integration** - No connection to actual OpenShift Template data

## Target State

### Catalog Items Integration
- **API Integration**: Full support for Catalog Items CloudAPI endpoints
- **Rich Item Display**: Detailed catalog item information with template specifications
- **Template Browsing**: Users can explore available templates within catalogs
- **VM Creation Integration**: Catalog items available for VM creation workflow
- **Performance Optimized**: Efficient caching and pagination handling

### New API Endpoints Support
1. `GET /cloudapi/1.0.0/catalogs/{catalog_id}/catalogItems` - list catalog items with pagination
2. `GET /cloudapi/1.0.0/catalogs/{catalog_id}/catalogItems/{item_id}` - get catalog item details

## Implementation Plan

### Phase 1: Type System Enhancement

1. **Replace CatalogItem types in `src/types/index.ts`**
   - Remove placeholder `CatalogItem` interface completely
   - Add new CloudAPI-compliant interfaces:
     - `CatalogItem` - main catalog item object from the API
     - `CatalogItemEntity` - detailed template specifications
     - `EntityRef` - entity reference structure
     - `TemplateSpec` - OpenShift Template specifications
     - `TemplateParameter` - template parameter definitions
     - `CatalogItemQueryParams` - CloudAPI query parameters for catalog items

2. **Add new query keys to `QUERY_KEYS`**
   - Update catalog item query keys to match CloudAPI patterns
   - Ensure consistency with existing catalog implementation patterns

### Phase 2: Service Layer Implementation

1. **Extend CloudAPI service: `src/services/cloudapi/CatalogService.ts`**
   - Add catalog items operations following CloudAPI patterns
   - Implement proper URN encoding for path parameters
   - Handle CloudAPI pagination format for catalog items
   - Include proper error handling and TypeScript types
   - Methods to add:
     - `getCatalogItems(catalogId, params?)` - list catalog items with pagination
     - `getCatalogItem(catalogId, itemId)` - get single catalog item details

2. **Update service exports**
   - Ensure `src/services/index.ts` exports updated CatalogService
   - Service now provides complete catalog items functionality

### Phase 3: Hook Implementation

1. **Extend `src/hooks/useCatalogs.ts`**
   - Add new hooks for catalog items operations
   - Implement proper query key serialization for stable caching
   - Include 5-15 minute cache expiration as recommended
   - Follow patterns established in existing catalog hooks

2. **New hooks to add**
   - `useCatalogItems(catalogId, params?)` - list catalog items with filtering and pagination
   - `useCatalogItem(catalogId, itemId)` - get single catalog item details
   - Implement intelligent caching strategies for performance

### Phase 4: UI Component Updates

1. **Update `src/pages/catalogs/CatalogDetail.tsx`**
   - Add catalog items section to display template list
   - Implement pagination for catalog items
   - Show template specifications and parameters
   - Add search/filter functionality for items
   - Display template metadata (name, description, parameters)
   - Handle loading states and error scenarios

2. **Create new component: `src/components/catalogs/CatalogItemsList.tsx`**
   - Dedicated component for displaying catalog items
   - Card-based layout showing template information
   - Click-through to detailed template view
   - Responsive design with proper loading states

3. **Create new component: `src/components/catalogs/CatalogItemDetail.tsx`**
   - Detailed view for individual catalog items
   - Display template specifications and parameters
   - Show OpenShift Template details
   - Action buttons for VM creation (if applicable)

4. **Update VM Creation Wizard**
   - Replace "Templates not available" message with real data from API
   - Update `src/components/vms/wizard/TemplateSelectionStep.tsx`
   - Integrate with catalog items API for template selection
   - Update component to use new CatalogItem interface structure
   - Handle template parameters from OpenShift Template specifications

### Phase 5: Data Migration & Mocks

1. **Replace mock data in `src/mocks/data.ts`**
   - Remove old placeholder catalog item data completely
   - Add realistic CloudAPI-compliant catalog items structures
   - Include proper URN format for IDs
   - Add realistic OpenShift Template specifications and parameters
   - Ensure mock data matches actual API responses exactly

2. **Update MSW handlers in `src/mocks/handlers.ts`**
   - Add CloudAPI catalog items endpoints
   - Implement proper CloudAPI response formats
   - Handle URN-based routing for nested resources
   - Include pagination and error scenarios

### Phase 6: Performance & Caching

1. **Implement intelligent caching**
   - Use React Query's caching capabilities
   - Set 5-15 minute cache expiration as recommended
   - Implement cache invalidation strategies
   - Handle stale-while-revalidate patterns

2. **Optimize data fetching**
   - Implement proper loading states
   - Add retry logic for failed requests
   - Handle pagination efficiently
   - Minimize unnecessary API calls

### Phase 7: Testing & Validation

1. **TypeScript compilation**
   - Ensure all type errors are resolved
   - Verify strict TypeScript compliance
   - Test type safety with new interfaces

2. **Component testing**
   - Test catalog items listing with pagination
   - Test catalog item detail view
   - Test integration with VM creation workflow
   - Verify proper error handling and loading states

3. **Integration testing**
   - Test with realistic CloudAPI data
   - Verify proper caching behavior
   - Test pagination edge cases
   - Validate performance with large catalogs

## Implementation Changes

### Breaking Changes
- **CatalogItem Interface**: Complete replacement of existing placeholder interface
- **VM Creation Wizard**: Significant changes to template selection component
- **Mock Data**: Complete replacement of placeholder catalog items data
- **Component Props**: Updates to components that use CatalogItem types

### New Features Added
- **Catalog Items Display** - Full catalog item browsing capability
- **Template Specifications** - Detailed OpenShift Template information
- **Real VM Creation** - Actual template selection replacing "not available" message
- **Performance Optimizations** - Intelligent caching and pagination

## Data Structure Integration

### New CloudAPI Structures
```typescript
interface CatalogItem {
  id: string;                           // URN: urn:vcloud:catalogitem:uuid
  name: string;                         // Catalog item name
  description: string;                  // Catalog item description
  catalogEntityRef: EntityRef;          // Reference to parent catalog
  entity: CatalogItemEntity;           // Detailed template specifications
  isVappTemplate: boolean;             // Always true for vApp templates
  status: string;                      // Item status
  owner: EntityRef;                    // Owner reference
  isPublished: boolean;                // Publication status
  creationDate: string;                // ISO-8601 timestamp
  modificationDate: string;            // ISO-8601 timestamp
  versionNumber: number;               // Version number
}

interface CatalogItemEntity {
  name: string;                        // Template name
  description: string;                 // Template description
  templateSpec: TemplateSpec;          // OpenShift Template specifications
  deploymentLeases: any[];             // Deployment lease information
}

interface TemplateSpec {
  kind: string;                        // "Template"
  apiVersion: string;                  // Template API version
  metadata: TemplateMetadata;          // Template metadata
  parameters: TemplateParameter[];     // Template parameters
  objects: any[];                      // Template objects
}

interface TemplateParameter {
  name: string;                        // Parameter name
  displayName?: string;                // Human-readable name
  description?: string;                // Parameter description
  value?: string;                      // Default value
  required?: boolean;                  // Whether parameter is required
  generate?: string;                   // Generation expression
}
```

### VM Creation Integration
The VM creation wizard will be updated to work directly with the new CatalogItem structure:
- Template selection will use `entity.templateSpec` for specifications
- VM parameters will be derived from `entity.templateSpec.parameters`
- Template metadata will come from `entity.templateSpec.metadata`
- All VM wizard components will be updated to use the new interface

## API Integration Details

### Request/Response Patterns
```typescript
// List catalog items
GET /cloudapi/1.0.0/catalogs/{catalog_id}/catalogItems?page=1&pageSize=25

// Response: VCloudPaginatedResponse<CatalogItem>
{
  "resultTotal": 42,
  "pageCount": 2,
  "page": 1,
  "pageSize": 25,
  "values": [/* CatalogItem objects */]
}

// Get catalog item details
GET /cloudapi/1.0.0/catalogs/{catalog_id}/catalogItems/{item_id}

// Response: CatalogItem object with full template specifications
```

### Error Handling
- Consistent with existing catalog API error patterns
- Proper HTTP status codes (200, 404, 401, 403, 500)
- CloudAPI-compliant error response format
- Graceful degradation for network issues

## UI/UX Enhancements

### Catalog Detail Page Improvements
1. **New Catalog Items Section**
   - Tabbed interface: "Overview" and "Templates"
   - Grid/list view toggle for catalog items
   - Search and filter capabilities
   - Pagination controls

2. **Template Cards**
   - Template name and description
   - Parameter count and key parameters
   - Last modified date
   - Quick actions (View Details, Use for VM)

3. **Template Detail Modal/Page**
   - Full template specifications
   - Parameter documentation
   - OpenShift Template source view
   - Integration with VM creation workflow

### VM Creation Wizard Enhancement
1. **Template Selection Improvement**
   - Replace empty state with actual template list
   - Rich template information display
   - Template parameter preview
   - Better template categorization

2. **Enhanced Template Information**
   - Show template parameters and defaults
   - Display resource requirements
   - Template compatibility indicators
   - Better template selection experience

## Performance Considerations

### Caching Strategy
- **Catalog Items List**: 10-minute cache with stale-while-revalidate
- **Individual Items**: 15-minute cache (longer for detailed specifications)
- **Template Specs**: 30-minute cache (template specs change infrequently)

### Pagination Optimization
- Implement virtual scrolling for large catalogs
- Prefetch next page when user scrolls near end
- Intelligent page size selection based on content

### Loading States
- Skeleton loading for catalog items list
- Progressive loading for template details
- Optimistic updates where appropriate

## Testing Strategy

### Unit Tests
- Service layer methods with proper URN handling
- Hook behavior with CloudAPI responses
- Component rendering with catalog items data
- Type safety validation

### Integration Tests
- End-to-end catalog items browsing
- Pagination and search functionality
- VM creation workflow integration
- Error handling scenarios

### Performance Tests
- Large catalog rendering performance
- Caching behavior validation
- API response time measurement
- Memory usage optimization

## Success Criteria

1. **Full API Integration** - All catalog items endpoints properly integrated
2. **Rich User Experience** - Users can browse and explore catalog items effectively
3. **VM Creation Integration** - Real templates available for VM creation workflow
4. **Performance** - Efficient loading and caching with sub-2-second response times
5. **Type Safety** - Zero TypeScript compilation errors with new CatalogItem interface
6. **Complete Migration** - All placeholder code replaced with real API integration
7. **Error Handling** - Proper error states and recovery mechanisms
8. **Documentation** - Clear usage examples and API documentation

## Timeline

- **Phase 1**: Type system enhancement (1 day)
- **Phase 2**: Service layer implementation (1-2 days)
- **Phase 3**: Hook implementation (1 day)
- **Phase 4**: UI component updates (2-3 days)
- **Phase 5**: Data migration and mocks (1 day)
- **Phase 6**: Performance optimization (1 day)
- **Phase 7**: Testing and validation (1-2 days)

**Total Estimated Effort**: 7-10 days

## Dependencies

- Catalog Items CloudAPI endpoint availability
- Consistent authentication with existing catalog API
- OpenShift Template data structure stability
- Performance requirements for large catalogs

## Risk Mitigation

1. **API Compatibility**: Thorough testing with actual API responses
2. **Performance**: Implement proper caching and pagination strategies  
3. **Type Safety**: Comprehensive TypeScript coverage for all new interfaces
4. **User Experience**: Progressive enhancement with proper loading states
5. **Breaking Changes**: Systematic migration of all components using CatalogItem types
6. **Component Updates**: Careful testing of VM wizard with new data structures

## Future Enhancements

1. **Template Favoriting** - Allow users to mark favorite templates
2. **Template Categories** - Organize templates by type or purpose
3. **Template Validation** - Validate template parameters before VM creation
4. **Template History** - Track template usage and deployment history
5. **Template Comparison** - Compare multiple templates side-by-side