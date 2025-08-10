# VDC Public API Integration

## Overview

This document outlines the plan to integrate the new VDC Public API endpoints for non-system admin users while maintaining the existing admin API for system administrators. The implementation will provide role-based access to VDCs with appropriate authentication and data handling.

## Current State

### Existing VDC Implementation
- **Service**: `src/services/cloudapi/index.ts` - CloudAPI VDC operations (admin only)
- **Hooks**: `src/hooks/index.ts` - React Query hooks for VDC management
- **Types**: `src/types/index.ts` - VDC interfaces and query parameters
- **UI Components**: 
  - `src/pages/organizations/OrganizationDetail.tsx` - organization VDC listing
  - Various VDC-related components across the application
- **Authentication**: System admin authentication with full access

### Current Limitations
1. **Admin-Only Access** - Current VDC endpoints require system admin privileges
2. **Single API Pattern** - All users use the same admin API endpoints
3. **No Role-Based Access** - No differentiation between admin and regular user access
4. **Limited Organization Scope** - Regular users cannot view VDCs from their organizations

## Target State

### Role-Based VDC Access
- **System Administrators**: Continue using `/api/admin/org/{orgId}/vdcs` endpoints
- **Regular Users**: Use new `/cloudapi/1.0.0/vdcs` endpoints with organization-scoped access
- **Automatic Role Detection**: Service layer automatically routes to appropriate API based on user permissions
- **Consistent Interface**: Same component interface regardless of underlying API

## Implementation Plan

### Phase 1: Service Layer Enhancement

1. **Create new VDC Public Service: `src/services/cloudapi/VDCPublicService.ts`**
   ```typescript
   export class VDCPublicService {
     // List VDCs accessible to current user's organization(s)
     static async getVDCs(params?: VDCQueryParams): Promise<VCloudPaginatedResponse<VDC>>
     
     // Get specific VDC by URN
     static async getVDC(vdcId: string): Promise<VDC>
   }
   ```

2. **Enhanced VDC Service Factory: `src/services/cloudapi/VDCService.ts`**
   ```typescript
   export class VDCService {
     // Intelligent routing based on user permissions
     static async getVDCs(params?: VDCQueryParams): Promise<VCloudPaginatedResponse<VDC>> {
       const userPermissions = await AuthService.getCurrentUserPermissions();
       
       if (userPermissions.canManageSystem) {
         // Route to admin API
         return VDCAdminService.getVDCs(params);
       } else {
         // Route to public API
         return VDCPublicService.getVDCs(params);
       }
     }
     
     static async getVDC(vdcId: string): Promise<VDC> {
       const userPermissions = await AuthService.getCurrentUserPermissions();
       
       if (userPermissions.canManageSystem) {
         return VDCAdminService.getVDC(vdcId);
       } else {
         return VDCPublicService.getVDC(vdcId);
       }
     }
   }
   ```

3. **Preserve existing admin service as `VDCAdminService`**
   - Rename current VDC service methods to maintain admin functionality
   - Keep all existing admin-specific operations intact

### Phase 2: Authentication Enhancement

1. **Update Authentication Service**
   ```typescript
   // Add to AuthService in src/services/auth.ts
   export class AuthService {
     static async getCurrentUserPermissions(): Promise<UserPermissions> {
       // Check user roles and capabilities
       // Return permissions object with role-based flags
     }
     
     static isSystemAdmin(user: User): boolean {
       // Check if user has system admin role
     }
     
     static getUserOrganizations(user: User): EntityRef[] {
       // Get list of organizations user belongs to
     }
   }
   ```

2. **Permission-based routing logic**
   - Implement automatic API selection based on user role
   - Cache user permissions for performance
   - Handle permission changes during session

### Phase 3: Type System Updates

1. **Enhance VDC types in `src/types/index.ts`**
   ```typescript
   // Add public API specific query parameters
   export interface VDCPublicQueryParams {
     page?: number;
     pageSize?: number;
     // Note: Public API has limited filtering compared to admin API
   }
   
   // Update existing VDCQueryParams for admin API
   export interface VDCAdminQueryParams extends VDCQueryParams {
     // Keep all existing admin-specific parameters
     orgId?: string; // Admin can specify organization
   }
   
   // Union type for service layer
   export type VDCApiQueryParams = VDCPublicQueryParams | VDCAdminQueryParams;
   ```

2. **Update user permission types**
   ```typescript
   export interface UserPermissions {
     canManageSystem: boolean;
     canManageOrganizations: boolean;
     canViewVDCs: boolean;
     canManageVDCs: boolean;
     accessibleOrganizations: EntityRef[];
   }
   ```

### Phase 4: Hook Layer Updates

1. **Update existing hooks in `src/hooks/index.ts`**
   ```typescript
   // Enhanced useVDCs hook with automatic API selection
   export const useVDCs = (params?: VDCQueryParams) => {
     return useQuery({
       queryKey: ['vdcs', params],
       queryFn: () => VDCService.getVDCs(params),
       staleTime: 5 * 60 * 1000, // 5 minutes
       cacheTime: 15 * 60 * 1000, // 15 minutes
     });
   };
   
   // Enhanced useVDC hook
   export const useVDC = (vdcId: string) => {
     return useQuery({
       queryKey: ['vdcs', vdcId],
       queryFn: () => VDCService.getVDC(vdcId),
       enabled: !!vdcId,
       staleTime: 10 * 60 * 1000, // 10 minutes
       cacheTime: 20 * 60 * 1000, // 20 minutes
     });
   };
   
   // Organization-specific VDCs hook (primarily for public API)
   export const useOrganizationVDCs = (orgId?: string) => {
     return useQuery({
       queryKey: ['vdcs', 'organization', orgId],
       queryFn: () => VDCService.getVDCs({ orgId }), // Will route appropriately
       enabled: !!orgId,
       staleTime: 5 * 60 * 1000,
     });
   };
   ```

2. **Add permission-aware hooks**
   ```typescript
   export const useUserPermissions = () => {
     return useQuery({
       queryKey: ['auth', 'permissions'],
       queryFn: () => AuthService.getCurrentUserPermissions(),
       staleTime: 10 * 60 * 1000, // Cache permissions for 10 minutes
     });
   };
   ```

### Phase 5: UI Component Updates

1. **Update Organization Detail Page**
   ```typescript
   // src/pages/organizations/OrganizationDetail.tsx
   const OrganizationDetail: React.FC = () => {
     const { data: userPermissions } = useUserPermissions();
     const { data: vdcsResponse } = useOrganizationVDCs(organization?.id);
     
     // Component will automatically get appropriate data based on user role
     // No changes needed to rendering logic
   };
   ```

2. **Add role-based UI indicators**
   - Show different UI elements based on user permissions
   - Display appropriate actions (view vs. manage)
   - Add role-specific help text or limitations

3. **Graceful permission handling**
   - Show appropriate empty states for insufficient permissions
   - Provide helpful error messages for access denied scenarios
   - Implement progressive disclosure based on user role

### Phase 6: Mock Data and Testing

1. **Update mock handlers in `src/mocks/handlers.ts`**
   ```typescript
   // Add public API endpoints
   rest.get('/cloudapi/1.0.0/vdcs', (req, res, ctx) => {
     // Mock public VDC API response
     // Filter VDCs based on mock user's organization
   });
   
   rest.get('/cloudapi/1.0.0/vdcs/:vdcId', (req, res, ctx) => {
     // Mock single VDC retrieval for public API
   });
   
   // Keep existing admin API mocks
   rest.get('/api/admin/org/:orgId/vdcs', (req, res, ctx) => {
     // Existing admin API mock
   });
   ```

2. **Add permission-based mock data**
   ```typescript
   // src/mocks/data.ts
   export const mockUserPermissions: UserPermissions = {
     canManageSystem: false, // Regular user
     canManageOrganizations: false,
     canViewVDCs: true,
     canManageVDCs: false,
     accessibleOrganizations: [
       { id: 'urn:vcloud:org:test-org-1', name: 'Test Organization 1' }
     ],
   };
   
   export const mockAdminPermissions: UserPermissions = {
     canManageSystem: true, // System admin
     canManageOrganizations: true,
     canViewVDCs: true,
     canManageVDCs: true,
     accessibleOrganizations: [], // Admin can access all
   };
   ```

### Phase 7: Error Handling and Edge Cases

1. **Permission change handling**
   - Invalidate queries when user permissions change
   - Handle session upgrade/downgrade scenarios
   - Provide smooth transitions between API endpoints

2. **API compatibility**
   - Ensure VDC data structure consistency between APIs
   - Handle any response format differences
   - Implement fallback strategies for API failures

3. **Performance optimization**
   - Cache user permissions appropriately
   - Minimize permission checks
   - Implement efficient query invalidation

## API Integration Details

### Public VDC API Endpoints

```typescript
// List VDCs (organization-scoped for regular users)
GET /cloudapi/1.0.0/vdcs?page=1&pageSize=25

// Response: VCloudPaginatedResponse<VDC>
{
  "resultTotal": 5,
  "pageCount": 1,
  "page": 1,
  "pageSize": 25,
  "values": [/* VDC objects for user's organization(s) */]
}

// Get specific VDC
GET /cloudapi/1.0.0/vdcs/{vdc_urn}

// Response: VDC object with full details
```

### Admin VDC API Endpoints (unchanged)

```typescript
// List VDCs for specific organization (admin only)
GET /api/admin/org/{orgId}/vdcs

// Get VDC details (admin only)
GET /api/admin/org/{orgId}/vdcs/{vdcId}
```

### Authentication Flow

1. **Session Creation**
   - User authenticates via CloudAPI session endpoints
   - JWT token extracted from response headers
   - User permissions determined from session data

2. **API Selection Logic**
   ```typescript
   if (user.roles.includes('System Administrator')) {
     // Use admin API endpoints
     return VDCAdminService.getVDCs(params);
   } else {
     // Use public API endpoints
     return VDCPublicService.getVDCs(params);
   }
   ```

3. **Token Management**
   - Store JWT token securely in axios interceptors
   - Handle token refresh/expiration
   - Provide fallback authentication methods

## Breaking Changes and Migration

### Non-Breaking Implementation
- **Backward Compatibility**: All existing components continue to work
- **Gradual Migration**: Service layer changes are transparent to UI components
- **Admin Functionality Preserved**: System admins retain all existing capabilities

### Enhanced Functionality
- **Regular User Access**: Non-admin users can now view VDCs from their organizations
- **Role-Based UX**: UI adapts based on user permissions
- **Improved Performance**: Optimized API calls based on user scope

## Testing Strategy

### Unit Tests
- Service layer routing logic
- Permission-based API selection
- Mock data consistency between API endpoints
- Error handling for permission denied scenarios

### Integration Tests
- End-to-end VDC browsing for different user roles
- Permission change handling
- API failover scenarios
- Session management and token handling

### User Acceptance Testing
- System admin workflow (no regression)
- Regular user VDC access
- Organization-scoped data visibility
- Error message clarity and helpfulness

## Performance Considerations

### Caching Strategy
- **User Permissions**: 10-minute cache with manual invalidation on role changes
- **VDC Data**: 5-15 minute cache depending on user role and data sensitivity
- **Organization Data**: Longer cache for regular users, shorter for admins

### API Optimization
- Batch permission checks where possible
- Minimize redundant API calls
- Implement efficient query key serialization
- Use React Query's intelligent caching

### Loading States
- Progressive loading based on user permissions
- Skeleton loading for VDC lists
- Graceful degradation for permission failures

## Security Considerations

### Access Control
- Server-side permission enforcement (not just UI hiding)
- Proper JWT token validation
- Organization scope enforcement in public API
- Audit logging for VDC access

### Data Protection
- No sensitive admin data exposed to regular users
- Proper error messages without information leakage
- Secure token storage and transmission
- Session timeout handling

## Success Criteria

1. **Role-Based Access** - Regular users can view VDCs from their organizations
2. **Admin Functionality** - System admins retain all existing capabilities
3. **Seamless Integration** - No breaking changes to existing UI components
4. **Performance** - API response times under 2 seconds for both endpoints
5. **Security** - Proper access control and data protection
6. **Error Handling** - Clear, helpful error messages for different scenarios
7. **Type Safety** - Zero TypeScript compilation errors
8. **Test Coverage** - Comprehensive testing for both admin and public API paths

## Timeline

- **Phase 1**: Service layer enhancement (2-3 days)
- **Phase 2**: Authentication enhancement (1-2 days)
- **Phase 3**: Type system updates (1 day)
- **Phase 4**: Hook layer updates (1-2 days)
- **Phase 5**: UI component updates (1-2 days)
- **Phase 6**: Mock data and testing setup (1 day)
- **Phase 7**: Error handling and optimization (1-2 days)

**Total Estimated Effort**: 8-13 days

## Dependencies

- VDC Public API endpoint availability and stability
- Consistent authentication mechanism between admin and public APIs
- User permission system integration
- CloudAPI session management compatibility

## Risk Mitigation

1. **API Compatibility**: Thorough testing with both API endpoints
2. **Performance Impact**: Implement efficient caching and permission checking
3. **Security**: Server-side validation and proper access control
4. **User Experience**: Gradual rollout with feature flags if needed
5. **Backward Compatibility**: Extensive regression testing for admin functionality

## Future Enhancements

1. **Advanced Filtering** - Enhanced search and filter capabilities for public API
2. **Real-time Updates** - WebSocket integration for VDC status changes
3. **Bulk Operations** - Multi-VDC operations for admin users
4. **VDC Templates** - Template-based VDC creation for admins
5. **Resource Monitoring** - Detailed VDC resource usage and monitoring
6. **Audit Trail** - Comprehensive audit logging for VDC access and operations