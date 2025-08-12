# User Management UI Implementation

## Problem Summary

When clicking "User Management" in the system administrator navigation, users see a placeholder message "Feature Coming Soon" instead of functional user management interface. The navigation links to `/admin/users` which currently shows:

```
System User Management
Feature Coming Soon
System user management features will be available in a future update.
```

## Root Cause Analysis

The user management infrastructure exists but the UI components are missing:

### ✅ What's Already Available

- **Backend Service**: Complete `UserService` with full CRUD operations using CloudAPI endpoints
- **React Hooks**: Comprehensive user management hooks in `src/hooks/`
- **Types & Interfaces**: User-related TypeScript interfaces defined
- **API Endpoints**: CloudAPI user endpoints properly configured
- **Organization-level User Management**: `OrganizationUsers.tsx` exists for org-specific user management

### ❌ What's Missing

- **System-wide User Management Pages**: No UI components for admin-level user management
- **User List Page**: No equivalent to `VMs.tsx` or `Organizations.tsx` for users
- **User Detail/Edit Pages**: No user profile editing for administrators
- **User Creation Workflow**: No admin interface to create new users

## Required Implementation

### 1. **Replace AdminRoutes Placeholder**

**File**: `src/pages/admin/AdminRoutes.tsx`

**Current**:

```tsx
const AdminUsers: React.FC = () => (
  <PageSection>
    <Title headingLevel="h1" size="xl">
      System User Management
    </Title>
    <Alert variant={AlertVariant.info} title="Feature Coming Soon">
      System user management features will be available in a future update.
    </Alert>
  </PageSection>
);
```

**Needs**: Replace with proper routing to user management components:

```tsx
{
  path: 'users',
  component: React.lazy(() => import('../users/Users')),
},
{
  path: 'users/create',
  component: React.lazy(() => import('../users/UserForm')),
},
{
  path: 'users/:id',
  component: React.lazy(() => import('../users/UserDetail')),
},
```

### 2. **Create User Management Pages**

#### **Users List Page** (`src/pages/users/Users.tsx`)

**Pattern**: Follow `src/pages/organizations/Organizations.tsx` structure
**Features Needed**:

- User list table with pagination, sorting, filtering
- Search by username, email, or organization
- Filter by role (System Admin, Org Admin, vApp User)
- Filter by organization
- Filter by status (enabled/disabled)
- Bulk operations (enable/disable users)
- "Create User" button
- User actions menu (view, edit, delete, enable/disable)

**Data Source**: Use existing `useUsers()` hook from `src/hooks/`

#### **User Detail Page** (`src/pages/users/UserDetail.tsx`)

**Pattern**: Follow `src/pages/organizations/OrganizationDetail.tsx` structure
**Features Needed**:

- User profile information display
- Role assignments and management
- Organization membership
- User permissions and capabilities
- Activity/audit log (if available)
- Enable/disable user actions
- Edit user button

#### **User Form Page** (`src/pages/users/UserForm.tsx`)

**Pattern**: Follow `src/pages/organizations/OrganizationForm.tsx` structure
**Features Needed**:

- Create new user form
- Edit existing user form
- Fields: username, email, full name, password (create only)
- Organization assignment dropdown
- Role assignment (multiple roles support)
- User settings (quotas, permissions)
- Enable/disable toggle

### 3. **Update Navigation & Routing**

#### **Route Protection** (`src/utils/routeProtection.ts`)

Add routes for user management:

```tsx
{
  path: '/admin/users',
  component: React.lazy(() => import('../pages/users/Users')),
  requiredRoles: [ROLE_NAMES.SYSTEM_ADMIN],
},
{
  path: '/admin/users/create',
  component: React.lazy(() => import('../pages/users/UserForm')),
  requiredRoles: [ROLE_NAMES.SYSTEM_ADMIN],
},
{
  path: '/admin/users/:id',
  component: React.lazy(() => import('../pages/users/UserDetail')),
  requiredRoles: [ROLE_NAMES.SYSTEM_ADMIN],
},
```

#### **Navigation** (`src/utils/roleBasedNavigation.ts`)

Navigation already correctly points to `/admin/users` - no changes needed.

### 4. **Additional Hooks (If Needed)**

Most hooks already exist in `src/hooks/`:

- ✅ `useUsers()` - Get all users with filtering
- ✅ `useCreateUser()` - Create new user
- ✅ `useUpdateUser()` - Update existing user
- ✅ `useDeleteUser()` - Delete user
- ✅ User role management hooks

**May Need**:

- `useUsersByOrganization()` hook (might already exist)
- `useUserRoles()` for role assignment UI
- `useUserPermissions()` for detailed permission display

### 5. **Components Structure**

```
src/pages/users/
├── Users.tsx              # Main user list page
├── UserDetail.tsx         # User detail/view page
├── UserForm.tsx           # Create/edit user form
├── UserFilters.tsx        # Advanced filtering component
├── UserActions.tsx        # Bulk actions component
├── UserRoleManager.tsx    # Role assignment component
└── index.ts               # Exports
```

### 6. **Integration Points**

#### **With Organizations**

- Users belong to organizations
- Filter users by organization
- Organization admins can manage their org users (already implemented in `OrganizationUsers.tsx`)
- System admins can manage all users across all organizations

#### **With Roles**

- Users have role assignments
- Display user roles in user list
- Role-based filtering
- Role assignment/management interface

#### **With Existing User Profile**

- `src/pages/profile/UserProfile.tsx` exists for self-service user profile editing
- Admin user management should be separate from self-service profile management
- May share some common components (user forms, etc.)

## Implementation Priority

### Phase 1: Basic User List (High Priority)

1. Create `Users.tsx` page with basic user list
2. Update `AdminRoutes.tsx` to route to Users page
3. Basic filtering and search functionality
4. User actions (view, edit, delete)

### Phase 2: User Detail & Management (Medium Priority)

1. Create `UserDetail.tsx` page
2. Create `UserForm.tsx` for create/edit
3. Role assignment interface
4. Enable/disable user functionality

### Phase 3: Advanced Features (Lower Priority)

1. Bulk operations on users
2. Advanced filtering and search
3. User audit/activity logs
4. Export user lists
5. User import functionality

## Technical Considerations

### **Data Fetching**

- Use existing CloudAPI `UserService`
- Leverage existing React Query hooks for caching and real-time updates
- Handle pagination properly for large user lists

### **Role-Based Access**

- Only System Administrators should access `/admin/users/*` routes
- Organization Administrators use existing `/org-users` for their organization
- Proper permission checks on all user management operations

### **User Experience**

- Follow existing PatternFly design patterns used in Organizations and VMs pages
- Consistent navigation and breadcrumb structure
- Loading states, error handling, and empty states
- Responsive design for mobile/tablet access

### **Performance**

- Implement proper pagination for large user lists
- Use React Query caching to avoid unnecessary API calls
- Debounced search and filtering
- Virtual scrolling for very large user lists (if needed)

## Success Criteria

1. ✅ System administrators can view list of all users across all organizations
2. ✅ Users can be filtered by organization, role, and status
3. ✅ Search functionality works for username, email, and name
4. ✅ Individual user details can be viewed and edited
5. ✅ New users can be created with proper role and organization assignment
6. ✅ Users can be enabled/disabled by administrators
7. ✅ Role assignments can be managed (add/remove roles)
8. ✅ Bulk operations work for multiple user management
9. ✅ Integration with existing organization and role management
10. ✅ Proper error handling and user feedback

This implementation will provide complete system-level user management capabilities for system administrators while maintaining the existing organization-level user management for organization administrators.
