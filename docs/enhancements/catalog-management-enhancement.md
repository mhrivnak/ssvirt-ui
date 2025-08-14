# Catalog Management Enhancement

## Overview

This document outlines the implementation plan for adding comprehensive catalog management capabilities to the SSVirt UI, including catalog creation, deletion, and catalog item viewing functionality. The implementation will strictly adhere to the VMware Cloud Director CloudAPI specification and integrate seamlessly with the existing organization-centric UI structure.

## Current State

### Existing Implementation
- **Catalog Service**: `CatalogService` with full CloudAPI compliance already implemented
- **React Hooks**: Complete set of hooks including `useCreateCatalog`, `useDeleteCatalog`, `useCatalogItems`
- **Type System**: CloudAPI-compliant types for `CreateCatalogRequest`, `UpdateCatalogRequest`, `CatalogItem`
- **Organization Integration**: Catalogs displayed in Organization Detail page, Catalogs tab
- **Read-Only Functionality**: Users can view catalog lists and navigate to catalog details

### Current Limitations
1. **No Catalog Creation UI**: Organization administrators cannot create new catalogs
2. **No Catalog Deletion**: Existing catalogs cannot be removed
3. **Limited Catalog Items View**: No dedicated interface for browsing catalog items/templates
4. **Missing Actions Integration**: Catalog actions not integrated into organization workflow

## Target State

### Catalog Creation
- **Creation Flow**: "Create Catalog" button in Organization → Catalogs tab
- **Modal Form**: Organization-scoped catalog creation with validation
- **Auto-populate Organization**: Inherit organization context from current view
- **Success Feedback**: Clear confirmation and automatic list refresh

### Catalog Deletion
- **Contextual Actions**: Delete option in catalog actions dropdown
- **Confirmation Dialog**: Safety confirmation with catalog impact details
- **Cascade Warnings**: Alert users about catalog items that will be deleted
- **Permission Guards**: Only show delete option for authorized users

### Catalog Item Browsing
- **Dedicated View**: `/catalogs/{catalogUrn}/items` route for catalog item listing
- **Template Details**: Rich display of catalog item specifications and metadata
- **Search & Filter**: Find specific templates within catalogs
- **Navigation Flow**: Seamless integration from organization catalogs view

## API Compliance

### Endpoints Used
Based on the [SSVirt API Reference](https://raw.githubusercontent.com/mhrivnak/ssvirt/refs/heads/main/docs/api-reference.md):

#### Catalog Operations
- **Create**: `POST /cloudapi/1.0.0/catalogs`
  - Request: `{ name, description, orgId, isPublished }`
  - Response: `201 Created` with catalog object
- **Delete**: `DELETE /cloudapi/1.0.0/catalogs/{catalogUrn}`
  - Response: `204 No Content`
- **List**: `GET /cloudapi/1.0.0/catalogs` (existing)
- **Details**: `GET /cloudapi/1.0.0/catalogs/{catalogUrn}` (existing)

#### Catalog Item Operations
- **List Items**: `GET /cloudapi/1.0.0/catalogs/{catalogUrn}/catalogItems`
  - Query Parameters: `page`, `pageSize`
  - Response: VCloudPaginatedResponse containing `resultTotal` (total item count), `pageCount` (total pages), and `values` (array of catalog item objects)
- **Item Details**: `GET /cloudapi/1.0.0/catalogs/{catalogUrn}/catalogItems/{itemId}`
  - Response: Detailed catalog item object

### Authentication
All operations require Bearer Token authentication via the existing CloudAPI auth system.

## Implementation Plan

### Phase 1: Catalog Creation (Priority: High)

#### 1.1 Create Catalog Form Component
```typescript
// src/components/catalogs/CreateCatalogModal.tsx
interface CreateCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName: string;
}
```

**Features**:
- Modal-based form with validation
- Fields: Name (required), Description (optional), Published status
- Organization context pre-filled and locked
- Real-time validation with error display
- Loading states during creation

#### 1.2 Integration with Organization Detail
```typescript
// Update src/pages/organizations/OrganizationDetail.tsx
const catalogsTabContent = (
  <Card>
    <CardTitle>
      <Split>
        <SplitItem isFilled>Catalogs</SplitItem>
        {canManageThisOrg && (
          <SplitItem>
            <Button
              variant="primary"
              size="sm" 
              icon={<PlusIcon />}
              onClick={() => setIsCreateCatalogModalOpen(true)}
            >
              Create Catalog
            </Button>
          </SplitItem>
        )}
      </Split>
    </CardTitle>
    // ... existing content
  </Card>
);
```

**Integration Points**:
- Add "Create Catalog" button to catalog tab header
- Trigger modal with organization context
- Refresh catalog list on successful creation
- Show success/error feedback via toast notifications

#### 1.3 Form Validation & UX
- **Name Validation**: Required, 1-255 characters, catalog name uniqueness
- **Description**: Optional, up to 1024 characters
- **Published Status**: Checkbox with explanation tooltip
- **Error Handling**: Field-level and form-level error display
- **Loading States**: Disable form during submission, show progress

### Phase 2: Catalog Deletion (Priority: High)

#### 2.1 Enhanced Catalog Actions
```typescript
// Update catalog actions in OrganizationDetail.tsx
const getCatalogActions = (catalog: Catalog) => [
  {
    title: 'View Details',
    onClick: () => navigate(`/catalogs/${catalog.id}`),
  },
  {
    title: 'Browse Templates', 
    onClick: () => navigate(`/catalogs/${catalog.id}/items`),
  },
  ...(canManageThisOrg ? [{
    title: 'Edit',
    onClick: () => setEditCatalogModal({ isOpen: true, catalog }),
  }, {
    isSeparator: true,
  }, {
    title: 'Delete',
    onClick: () => setDeleteCatalogModal({ isOpen: true, catalog }),
    isDanger: true,
  }] : [])
];
```

#### 2.2 Delete Confirmation Modal
```typescript
// src/components/catalogs/DeleteCatalogModal.tsx
interface DeleteCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: Catalog | null;
  onConfirm: (catalogId: string) => void;
}
```

**Features**:
- Safety confirmation with catalog name display
- Warning about catalog items being deleted
- Type catalog name to confirm deletion (for important catalogs)
- Loading state during deletion
- Error handling with retry option

#### 2.3 Permission Integration
- **Role-Based Access**: Only show delete action for users with `canManageThisOrg` permission
- **System Admin Override**: System admins can delete any catalog
- **Owner Validation**: Additional check for catalog ownership
- **Graceful Fallback**: Hide delete option when unauthorized

### Phase 3: Catalog Items Interface (Priority: Medium)

#### 3.1 Catalog Items List Page
```typescript
// src/pages/catalogs/CatalogItems.tsx
const CatalogItems: React.FC = () => {
  const { catalogId } = useParams<{ catalogId: string }>();
  const { data: catalog } = useCatalog(catalogId);
  const { data: catalogItemsResponse } = useCatalogItems(catalogId, params);
  
  // ... implementation
};
```

**Route**: `/catalogs/:catalogId/items`

**Features**:
- Breadcrumb navigation: Organization → Catalogs → [Catalog Name] → Items
- Search and filter catalog items by name, type, OS
- Pagination for large catalogs
- Grid and list view toggle
- Template preview cards with key specifications

#### 3.2 Catalog Item Card Component
```typescript
// src/components/catalogs/CatalogItemCard.tsx
interface CatalogItemCardProps {
  catalogItem: CatalogItem;
  onSelect?: (item: CatalogItem) => void;
  showActions?: boolean;
}
```

**Display Elements**:
- Template name and description
- Operating system and version
- Resource specifications (CPU, Memory, Disk)
- Creation date and status
- Template thumbnail/icon
- Quick action buttons (Deploy, View Details)

#### 3.3 Enhanced Navigation Flow
- **From Organization**: Catalogs tab → "Browse Templates" action → Catalog Items page
- **From Catalog Detail**: "View Catalog Items" button → Catalog Items page  
- **Breadcrumb Navigation**: Clear path back to organization and catalog views
- **Deep Linking**: Direct URLs to specific catalog item collections

## Technical Architecture

### Component Structure
```
src/
├── components/catalogs/
│   ├── CreateCatalogModal.tsx      # Catalog creation form
│   ├── DeleteCatalogModal.tsx      # Deletion confirmation
│   ├── CatalogItemCard.tsx         # Catalog item display
│   └── CatalogItemsList.tsx        # Basic catalog items listing
├── pages/catalogs/
│   ├── CatalogItems.tsx            # Catalog items listing page
│   └── CatalogDetail.tsx           # Enhanced catalog detail (existing)
└── hooks/
    └── useCatalogs.ts              # Enhanced with creation/deletion (existing)
```

### State Management
- **React Query**: Leverage existing `useCatalogs`, `useCreateCatalog`, `useDeleteCatalog` hooks
- **Cache Invalidation**: Automatic refresh of catalog lists after mutations
- **Optimistic Updates**: Immediate UI feedback for better UX
- **Error Boundaries**: Graceful error handling for failed operations

### Routing Updates
```typescript
// src/App.tsx routes addition
<Route path="/catalogs/:catalogId/items" element={<CatalogItems />} />
```

### Permission Integration
```typescript
// Enhanced permission checks
const canCreateCatalog = userPermissions?.canManageOrganization?.(organizationId) || 
                        userPermissions?.canManageSystem;
const canDeleteCatalog = canCreateCatalog; // Same permissions for now
```

## User Experience Design

### Catalog Creation Flow
1. **Entry Point**: User clicks "Create Catalog" in Organization → Catalogs tab
2. **Form Modal**: Modal opens with organization context pre-filled
3. **Validation**: Real-time field validation with helpful error messages
4. **Submission**: Loading state with progress indication
5. **Success**: Modal closes, success toast, catalog list refreshes with new catalog highlighted
6. **Error**: Form shows error, allows retry without losing data

### Catalog Deletion Flow
1. **Entry Point**: User clicks "Delete" in catalog actions dropdown
2. **Confirmation**: Modal shows catalog details and deletion impact
3. **Safety Check**: User types catalog name to confirm (for published catalogs)
4. **Execution**: Loading state with deletion progress
5. **Success**: Modal closes, success toast, catalog removed from list
6. **Error**: Error message with retry option, catalog remains in list

### Catalog Items Browsing
1. **Navigation**: User clicks "Browse Templates" from catalog actions
2. **Loading**: Page shows loading state while fetching items
3. **Display**: Grid/list view with search and filter options
4. **Interaction**: Click on item cards for details, quick deploy actions
5. **Empty State**: Helpful message when catalog has no items
6. **Error State**: Clear error message with retry option

## Security Considerations

### Access Control
- **Organization Scoping**: Users can only create/delete catalogs in organizations they manage
- **System Admin Override**: System administrators have full catalog management access
- **API Validation**: All operations validated against CloudAPI permissions
- **UI Permission Guards**: Hide/disable actions based on user permissions

### Data Validation
- **Input Sanitization**: All form inputs sanitized to prevent XSS
- **API Validation**: Server-side validation for all catalog operations
- **Conflict Resolution**: Handle concurrent modifications gracefully
- **Error Boundaries**: Prevent UI crashes from catalog operation failures

## Testing Strategy

### Unit Tests
- **Component Testing**: Test catalog modals, forms, and item displays
- **Hook Testing**: Test catalog creation, deletion, and item fetching hooks
- **Validation Testing**: Test form validation and error handling
- **Permission Testing**: Test role-based access control

### Integration Tests
- **API Integration**: Test CloudAPI calls with mock responses
- **Navigation Flow**: Test routing between catalog pages
- **State Management**: Test cache invalidation and optimistic updates
- **Error Scenarios**: Test network failures and API errors

### User Acceptance Testing
- **Catalog Lifecycle**: Create, view, edit, delete catalog workflow
- **Permission Scenarios**: Test as different user roles
- **Browser Compatibility**: Test across supported browsers
- **Performance**: Test with large numbers of catalogs and items

## Success Metrics

### Functional Metrics
- **Catalog Creation Success Rate**: > 95% successful creations
- **Deletion Safety**: Zero accidental deletions due to clear confirmation flow
- **Navigation Efficiency**: < 3 clicks to reach any catalog item from organization view
- **Error Recovery**: Clear error messages lead to successful retry > 90% of time

### Performance Metrics
- **Page Load Time**: Catalog items page loads in < 2 seconds
- **Form Responsiveness**: Catalog creation form submits in < 5 seconds
- **List Refresh**: Catalog list updates in < 1 second after mutations
- **Memory Usage**: No memory leaks during catalog operations

### User Experience Metrics
- **Task Completion Rate**: > 90% of users successfully complete catalog tasks
- **User Satisfaction**: Positive feedback on catalog management workflow
- **Support Tickets**: Reduce catalog-related support requests by 50%
- **Feature Adoption**: > 80% of eligible users utilize catalog management features

## Migration & Rollout

### Deployment Strategy
- **Feature Flags**: Enable catalog management features gradually
- **Backward Compatibility**: Ensure existing catalog viewing functionality remains intact
- **Progressive Enhancement**: Add features incrementally (creation → deletion → items)
- **Rollback Plan**: Ability to disable new features if issues arise

### User Training
- **Documentation**: Update user guides with catalog management procedures
- **In-App Help**: Contextual tooltips and help text for new features
- **Video Tutorials**: Screen recordings of catalog management workflows
- **Admin Training**: Special guidance for organization administrators

### Success Criteria for Rollout
1. **Phase 1 Complete**: Catalog creation working for all user roles
2. **Phase 2 Complete**: Catalog deletion working with proper safety measures
3. **Phase 3 Complete**: Catalog items browsing fully functional
4. **User Adoption**: > 50% of eligible users have used catalog management features
5. **Stability**: < 1% error rate across all catalog operations
6. **Performance**: All operations meet defined performance targets

## Conclusion

This enhancement will transform the SSVirt UI from a read-only catalog viewer into a functional catalog management interface. By strictly adhering to the CloudAPI specification and integrating seamlessly with the existing organization-centric design, users will have the essential tools needed for managing their VMware Cloud Director catalogs.

The implementation focuses on three core capabilities: catalog creation, catalog deletion, and catalog item browsing. This provides a complete basic workflow for catalog management while maintaining simplicity and reliability.

Key success factors include maintaining CloudAPI compliance, implementing robust permission controls, providing clear user feedback, and ensuring excellent performance across all catalog operations.