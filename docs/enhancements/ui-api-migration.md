# Enhancement Proposal: UI Migration to VMware Cloud Director API

## Summary

This enhancement proposal outlines the migration of the SSVIRT UI from the current legacy API endpoints to the new VMware Cloud Director-compatible API structure. This migration will enable proper role-based access control, fix the missing organization creation functionality, and align the UI with industry-standard API patterns.

## Motivation

The current UI implementation has significant limitations due to API misalignment:

1. **Missing System Administrator Capabilities**: Users with "System Administrator" role cannot create organizations due to missing role information in the API
2. **Incomplete User Model**: The current User type lacks role and organization references required for proper permission checking
3. **Legacy API Structure**: Current `/api/` endpoints don't follow VMware Cloud Director patterns
4. **Poor Permission Management**: No proper role-based UI rendering or access control

The backend API server is being updated to use VMware Cloud Director-compatible endpoints with proper entity references, URN-based IDs, and comprehensive role management.

## Goals

- Migrate UI to use new VMware Cloud Director-compatible API endpoints
- Implement proper role-based access control and UI rendering
- Fix organization creation functionality for System Administrators
- Add comprehensive user, role, and organization management capabilities
- Maintain existing UI/UX patterns while updating underlying data structures

## Non-Goals

- Backward compatibility with legacy API endpoints
- Database migration support (backend handles this)
- Complete UI redesign (maintain current PatternFly patterns)
- Advanced VMware Cloud Director features beyond core user/org/role management

## Proposal

### Architecture Overview

```
Current:
Browser → UI → /api/sessions, /api/org/* (Legacy)

New:
Browser → UI → /cloudapi/1.0.0/users, /cloudapi/1.0.0/orgs, /cloudapi/1.0.0/roles (VMware Cloud Director)
```

### Implementation Details

#### 1. Type System Updates

**1.1 Core Entity Types**

Update `src/types/index.ts` with new VMware Cloud Director-compatible types:

```typescript
// Entity Reference System
export interface EntityRef {
  name: string;
  id: string; // URN format: urn:vcloud:type:uuid
}

// Updated User Type
export interface User {
  id: string; // URN format: urn:vcloud:user:uuid
  username: string;
  fullName: string; // Replaces firstName + lastName
  description?: string;
  email: string;
  roleEntityRefs: EntityRef[]; // Array of role references
  orgEntityRef: EntityRef; // Organization reference
  deployedVmQuota: number;
  storedVmQuota: number;
  nameInSource?: string;
  enabled: boolean;
  isGroupRole: boolean;
  providerType: string;
  locked: boolean;
  stranded: boolean;
}

// New Role Type
export interface Role {
  id: string; // URN format: urn:vcloud:role:uuid
  name: string;
  description: string;
  bundleKey: string;
  readOnly: boolean;
}

// Updated Organization Type
export interface Organization {
  id: string; // URN format: urn:vcloud:org:uuid
  name: string;
  displayName: string; // Renamed from display_name
  description?: string;
  isEnabled: boolean; // Renamed from enabled
  orgVdcCount: number;
  catalogCount: number;
  vappCount: number;
  runningVMCount: number;
  userCount: number;
  diskCount: number;
  managedBy: EntityRef;
  canManageOrgs: boolean;
  canPublish: boolean;
  maskedEventTaskUsername: string;
  directlyManagedOrgCount: number;
  // Keep legacy fields for backward compatibility during transition
  created_at?: string;
  updated_at?: string;
}
```

**1.2 Permission and Role Constants**

```typescript
// Role Constants
export const ROLE_NAMES = {
  SYSTEM_ADMIN: 'System Administrator',
  ORG_ADMIN: 'Organization Administrator',
  VAPP_USER: 'vApp User',
} as const;

// Permission Checking Utilities
export interface UserPermissions {
  canCreateOrganizations: boolean;
  canManageUsers: boolean;
  canManageSystem: boolean;
  canManageOrganization: (orgId: string) => boolean;
}
```

#### 2. API Service Layer Updates

**2.1 New API Service Structure**

Create new services in `src/services/` for VMware Cloud Director endpoints:

```typescript
// src/services/cloudapi/UserService.ts
export class CloudApiUserService {
  static async getUsers(params?: UserQueryParams): Promise<PaginatedResponse<User>> {
    const response = await api.get('/cloudapi/1.0.0/users', { params });
    return response.data;
  }

  static async getUser(id: string): Promise<ApiResponse<User>> {
    const response = await api.get(`/cloudapi/1.0.0/users/${id}`);
    return response.data;
  }
}

// src/services/cloudapi/RoleService.ts
export class CloudApiRoleService {
  static async getRoles(): Promise<ApiResponse<Role[]>> {
    const response = await api.get('/cloudapi/1.0.0/roles');
    return response.data;
  }

  static async getRole(id: string): Promise<ApiResponse<Role>> {
    const response = await api.get(`/cloudapi/1.0.0/roles/${id}`);
    return response.data;
  }
}

// src/services/cloudapi/OrganizationService.ts
export class CloudApiOrganizationService {
  static async getOrganizations(params?: OrganizationQueryParams): Promise<PaginatedResponse<Organization>> {
    const response = await api.get('/cloudapi/1.0.0/orgs', { params });
    return response.data;
  }

  static async getOrganization(id: string): Promise<ApiResponse<Organization>> {
    const response = await api.get(`/cloudapi/1.0.0/orgs/${id}`);
    return response.data;
  }
}
```

**2.2 Authentication Service Updates**

Update authentication service to handle new user structure:

```typescript
// src/services/AuthService.ts
export class AuthService {
  static async getCurrentUser(): Promise<ApiResponse<User>> {
    // Use new session endpoint that returns VMware Cloud Director user format
    const response = await api.get('/cloudapi/1.0.0/session');
    return response.data;
  }

  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post('/cloudapi/1.0.0/sessions', credentials);
    return response.data;
  }
}
```

#### 3. Permission Management System

**3.1 Permission Utilities**

Create comprehensive permission checking utilities:

```typescript
// src/utils/permissions.ts
export class PermissionChecker {
  static isSystemAdmin(user: User): boolean {
    return user.roleEntityRefs.some(role => 
      role.name === ROLE_NAMES.SYSTEM_ADMIN
    );
  }

  static isOrgAdmin(user: User, orgId?: string): boolean {
    const hasOrgAdminRole = user.roleEntityRefs.some(role => 
      role.name === ROLE_NAMES.ORG_ADMIN
    );
    
    if (!orgId) return hasOrgAdminRole;
    return hasOrgAdminRole && user.orgEntityRef.id === orgId;
  }

  static canCreateOrganizations(user: User): boolean {
    return this.isSystemAdmin(user);
  }

  static canManageUsers(user: User, targetOrgId?: string): boolean {
    if (this.isSystemAdmin(user)) return true;
    if (targetOrgId) {
      return this.isOrgAdmin(user, targetOrgId);
    }
    return false;
  }

  static getUserPermissions(user: User): UserPermissions {
    return {
      canCreateOrganizations: this.canCreateOrganizations(user),
      canManageUsers: this.canManageUsers(user),
      canManageSystem: this.isSystemAdmin(user),
      canManageOrganization: (orgId: string) => this.canManageUsers(user, orgId),
    };
  }
}
```

**3.2 Permission Hooks**

Create React hooks for permission checking:

```typescript
// src/hooks/usePermissions.ts
export const usePermissions = () => {
  const { user } = useAuth();
  
  return useMemo(() => {
    if (!user) return null;
    return PermissionChecker.getUserPermissions(user);
  }, [user]);
};

export const useCanCreateOrganizations = () => {
  const permissions = usePermissions();
  return permissions?.canCreateOrganizations ?? false;
};
```

#### 4. Component Updates

**4.1 Organizations Page Updates**

Update Organizations page to use new permission system:

```typescript
// src/pages/organizations/Organizations.tsx (key changes)
const Organizations: React.FC = () => {
  const canCreateOrgs = useCanCreateOrganizations();
  
  // ... existing code ...

  return (
    <PageSection>
      <Stack hasGutter>
        <StackItem>
          <Split hasGutter>
            <SplitItem isFilled>
              <Title headingLevel="h1" size="xl">Organizations</Title>
            </SplitItem>
            {canCreateOrgs && (
              <SplitItem>
                <Button
                  variant="primary"
                  icon={<PlusCircleIcon />}
                  onClick={() => navigate(ROUTES.ORGANIZATION_CREATE)}
                >
                  Create Organization
                </Button>
              </SplitItem>
            )}
          </Split>
        </StackItem>
        {/* ... rest of component */}
      </Stack>
    </PageSection>
  );
};
```

**4.2 User Profile Updates**

Update user profile to display new user information:

```typescript
// src/pages/profile/UserProfile.tsx (key changes)
const UserProfile: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) return <LoadingSpinner />;

  return (
    <PageSection>
      <Stack hasGutter>
        <StackItem>
          <Title headingLevel="h1" size="xl">User Profile</Title>
        </StackItem>
        
        <StackItem>
          <Card>
            <CardBody>
              <DescriptionList>
                <DescriptionListGroup>
                  <DescriptionListTerm>Full Name</DescriptionListTerm>
                  <DescriptionListDescription>{user.fullName}</DescriptionListDescription>
                </DescriptionListGroup>
                
                <DescriptionListGroup>
                  <DescriptionListTerm>Organization</DescriptionListTerm>
                  <DescriptionListDescription>{user.orgEntityRef.name}</DescriptionListDescription>
                </DescriptionListGroup>
                
                <DescriptionListGroup>
                  <DescriptionListTerm>Roles</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Stack>
                      {user.roleEntityRefs.map(role => (
                        <StackItem key={role.id}>
                          <Badge color="blue">{role.name}</Badge>
                        </StackItem>
                      ))}
                    </Stack>
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </CardBody>
          </Card>
        </StackItem>
      </Stack>
    </PageSection>
  );
};
```

#### 5. Navigation and Layout Updates

**5.1 Navigation Permission Filtering**

Update navigation to show/hide items based on user permissions:

```typescript
// src/contexts/NavigationContext.tsx (key changes)
export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const permissions = usePermissions();
  
  const getFilteredNavItems = useMemo(() => {
    if (!user || !permissions) return [];
    
    const baseItems = [
      { id: 'dashboard', label: 'Dashboard', href: ROUTES.DASHBOARD },
    ];
    
    // Only show Organizations to System Admins and Org Admins
    if (permissions.canCreateOrganizations || permissions.canManageUsers) {
      baseItems.push({
        id: 'organizations',
        label: 'Organizations', 
        href: ROUTES.ORGANIZATIONS
      });
    }
    
    // Add other conditional nav items...
    
    return baseItems;
  }, [user, permissions]);
  
  // ... rest of provider
};
```

#### 6. Data Migration and Compatibility

**6.1 Legacy Data Handling**

Create adapters for handling both old and new data formats during transition:

```typescript
// src/utils/dataAdapters.ts
export class LegacyDataAdapter {
  static adaptLegacyUser(legacyUser: any): User {
    return {
      id: legacyUser.id, // Will be converted to URN by backend
      username: legacyUser.username,
      fullName: `${legacyUser.first_name} ${legacyUser.last_name}`,
      email: legacyUser.email,
      enabled: legacyUser.is_active ?? true,
      // Set defaults for new fields
      roleEntityRefs: [],
      orgEntityRef: { name: 'Unknown', id: '' },
      deployedVmQuota: 0,
      storedVmQuota: 0,
      isGroupRole: false,
      providerType: 'LOCAL',
      locked: false,
      stranded: false,
    };
  }
}
```

**6.2 Gradual Migration Strategy**

Implement feature flags for gradual migration:

```typescript
// src/utils/config.ts
export const FEATURE_FLAGS = {
  USE_CLOUDAPI_ENDPOINTS: true, // Enable new API endpoints
  LEGACY_COMPATIBILITY: true,   // Support legacy data formats
} as const;
```

## Implementation Plan

### Phase 1: Type System and Utilities (Week 1)
1. **Update type definitions** in `src/types/index.ts`
2. **Create permission utilities** in `src/utils/permissions.ts`
3. **Add permission hooks** in `src/hooks/usePermissions.ts`
4. **Create data adapters** for legacy compatibility

### Phase 2: API Service Layer (Week 1-2)
1. **Create CloudAPI services** for users, roles, organizations
2. **Update authentication service** to use new session endpoint
3. **Add API response validation** for new data structures
4. **Implement error handling** for URN-based IDs

### Phase 3: Component Updates (Week 2-3)
1. **Update Organizations page** with permission-based rendering
2. **Fix organization creation** for System Administrators
3. **Update User Profile page** to display new user information
4. **Add Role management interface** (new feature)

### Phase 4: Navigation and Layout (Week 3)
1. **Update navigation** with permission-based filtering
2. **Add role indicators** in user profile dropdown
3. **Update breadcrumbs** to handle URN-based IDs
4. **Add organization context** display

### Phase 5: Testing and Validation (Week 4)
1. **Update unit tests** for new type system
2. **Add permission testing** scenarios
3. **Test migration compatibility** 
4. **Validate VMware Cloud Director compliance**

### Phase 6: Documentation and Polish (Week 4)
1. **Update component documentation**
2. **Add permission system guide**
3. **Create migration troubleshooting guide**
4. **Performance optimization**

## User Experience Impact

### Positive Changes
1. **Fixed Organization Creation**: System Administrators can now properly create organizations
2. **Better Permission Visibility**: Users see only actions they can perform
3. **Improved User Information**: Full name display, role visibility, organization context
4. **Consistent Navigation**: Role-based menu filtering

### Potential Issues
1. **Initial Learning Curve**: Users may need to understand new role system
2. **Permission Restrictions**: Some users may lose access to previously visible (but non-functional) features
3. **URN IDs**: Technical users may notice different ID formats

### Mitigation Strategies
1. **Clear Error Messages**: When users lack permissions, provide helpful explanations
2. **Progressive Disclosure**: Show advanced features only to appropriate roles
3. **Migration Guides**: Provide documentation for users upgrading from legacy system

## Security Considerations

### Enhanced Security
1. **Proper Permission Checking**: All UI actions now validate user permissions
2. **Role-Based Access Control**: Comprehensive RBAC implementation
3. **Organization Isolation**: Users can only access appropriate organization resources

### Security Risks
1. **Client-Side Permission Checks**: UI permissions must be backed by server-side validation
2. **Role Escalation**: Ensure role changes require proper authentication
3. **Data Exposure**: Avoid exposing sensitive user/org data in client-side code

### Mitigation
1. **Server-Side Validation**: All API calls must validate permissions server-side
2. **Principle of Least Privilege**: Grant minimum necessary permissions
3. **Audit Logging**: Track permission changes and administrative actions

## Testing Strategy

### Unit Testing
- Permission utility functions
- Data adapters and type conversions
- Component permission rendering logic

### Integration Testing
- Authentication flow with new user structure
- Organization creation by System Administrators
- Role-based navigation filtering

### E2E Testing
- Complete user journeys for each role type
- Organization management workflows
- Permission boundary validation

## Migration Risks and Mitigation

### High Risk: Data Format Changes
- **Risk**: Existing cached data may be incompatible
- **Mitigation**: Clear local storage on migration, implement data adapters

### Medium Risk: Permission Changes
- **Risk**: Users may lose access to previously available features
- **Mitigation**: Comprehensive user communication, gradual rollout

### Low Risk: UI Consistency
- **Risk**: Different data structures may cause UI inconsistencies
- **Mitigation**: Thorough testing, fallback displays for missing data

## Success Metrics

### Functional Metrics
- System Administrators can successfully create organizations
- All user roles see appropriate navigation options
- Permission checks prevent unauthorized actions

### Technical Metrics
- Zero breaking changes for authorized user workflows
- API response time within 2x of current performance
- No client-side permission bypass vulnerabilities

### User Experience Metrics
- Reduced support tickets about missing organization creation
- Improved user satisfaction with role clarity
- Faster task completion for administrative workflows

## Future Enhancements

### Phase 2 Features (Post-Migration)
- Advanced role management (custom roles)
- Organization delegation and hierarchy
- Fine-grained permission controls
- Role-based dashboard customization

### Integration Opportunities
- SSO/LDAP integration using VMware Cloud Director patterns
- Advanced auditing and compliance reporting
- Multi-tenant organization management
- API rate limiting based on user roles

This migration will transform the SSVIRT UI from a basic interface with limited permission awareness to a fully role-aware, VMware Cloud Director-compatible management interface that properly supports enterprise use cases.