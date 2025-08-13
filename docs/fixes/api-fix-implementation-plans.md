# API Fix Implementation Plans

## Overview

This document provides detailed implementation plans for fixing the API endpoint discrepancies identified in the API Endpoint Analysis Report. Each plan includes specific code changes, testing requirements, and rollback procedures.

## P0 Critical Fixes

### 1. Session Management Endpoints Fix

**Priority**: P0 (Critical)  
**Impact**: Authentication will fail without this fix  
**Estimated Effort**: 2-4 hours  

#### Current Issue
Session endpoints use incorrect paths that don't include the `/cloudapi/` prefix and don't properly handle session IDs.

#### Implementation Plan

##### Step 1: Update Constants
**File**: `src/utils/constants.ts`

**Current Code** (lines 52-55):
```typescript
CLOUDAPI: {
  LOGIN: '/1.0.0/sessions',
  LOGOUT: '/1.0.0/sessions',
  SESSION: '/1.0.0/session',
}
```

**New Code**:
```typescript
CLOUDAPI: {
  LOGIN: '/1.0.0/sessions',
  LOGOUT: (sessionId: string) => `/1.0.0/sessions/${encodeURIComponent(sessionId)}`,
  SESSION: (sessionId: string) => `/1.0.0/sessions/${encodeURIComponent(sessionId)}`,
}
```

##### Step 2: Update API Service
**File**: `src/services/api.ts`

**Current Issues**:
- Login endpoint path missing `/cloudapi/` prefix
- Logout endpoint doesn't use session ID
- Session info endpoint doesn't use session ID

**Changes Required**:

1. **Update Login Function** (around line 179):
```typescript
// Current
const loginInstance = axios.create({
  baseURL: config.API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Updated
const loginInstance = axios.create({
  baseURL: `${config.API_BASE_URL}/cloudapi`,
  headers: { 'Content-Type': 'application/json' },
});
```

2. **Update Logout Function** (around line 274):
```typescript
// Current
await cloudApi.delete(`/1.0.0/sessions/${sessionData.id}`);

// Updated
await cloudApi.delete(API_ENDPOINTS.CLOUDAPI.LOGOUT(sessionData.id));
```

3. **Add Session Info Function**:
```typescript
export const getSessionInfo = async (sessionId: string): Promise<SessionResponse> => {
  try {
    const response = await cloudApi.get(API_ENDPOINTS.CLOUDAPI.SESSION(sessionId));
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to get session info');
    }
    throw error;
  }
};
```

##### Step 3: Update Authentication Hook
**File**: `src/hooks/useAuth.ts` (if exists) or relevant auth context

**Changes**:
- Update any references to session endpoints
- Ensure session ID is properly stored and used
- Add proper session validation

#### Testing Plan

1. **Unit Tests**:
   - Test endpoint path generation with various session IDs
   - Test URL encoding of session IDs
   - Test error handling for invalid session IDs

2. **Integration Tests**:
   - Test complete login flow with real API server
   - Test session info retrieval
   - Test logout functionality
   - Test token refresh if applicable

3. **Manual Testing**:
   - Login with valid credentials
   - Verify session info is retrieved correctly
   - Test logout functionality
   - Test session expiration handling

#### Rollback Plan
1. Revert constants.ts to original values
2. Revert api.ts changes
3. Test basic authentication still works with fallback

---

### 2. VM Power Operations Fix

**Priority**: P0 (Critical)  
**Impact**: VM power operations (start, stop, reset) will not work  
**Estimated Effort**: 3-6 hours  

#### Current Issue
VM power operation endpoints use incorrect paths and may not include the CloudAPI prefix.

#### Implementation Plan

##### Step 1: Update VM Service Endpoints
**File**: `src/services/cloudapi/VMService.ts`

**Current Issues** (around lines 132-188):
```typescript
// Power operations use incorrect paths
await cloudApi.post(`/1.0.0/vms/${encodeURIComponent(vmId)}/actions/powerOn`);
await cloudApi.post(`/1.0.0/vms/${encodeURIComponent(vmId)}/actions/powerOff`);
await cloudApi.post(`/1.0.0/vms/${encodeURIComponent(vmId)}/actions/suspend`);
await cloudApi.post(`/1.0.0/vms/${encodeURIComponent(vmId)}/actions/reset`);
```

**Required Research**:
The user guide doesn't specify VM power operation endpoints. Need to:
1. Check if these endpoints exist on the API server
2. Verify correct path format from API server documentation
3. Determine if operations should be performed on VMs or vApps

**Proposed Changes** (pending verification):
```typescript
// Option 1: If VM endpoints are supported
await cloudApi.post(`/cloudapi/1.0.0/vms/${encodeURIComponent(vmId)}/actions/powerOn`);

// Option 2: If operations must be performed on vApps
await cloudApi.post(`/cloudapi/1.0.0/vapps/${encodeURIComponent(vappId)}/actions/powerOn`);
```

##### Step 2: Update Constants
**File**: `src/utils/constants.ts`

**Add VM Power Action Endpoints**:
```typescript
CLOUDAPI: {
  // ... existing endpoints
  VM_POWER_ON: (vmId: string) => `/1.0.0/vms/${encodeURIComponent(vmId)}/actions/powerOn`,
  VM_POWER_OFF: (vmId: string) => `/1.0.0/vms/${encodeURIComponent(vmId)}/actions/powerOff`,
  VM_SUSPEND: (vmId: string) => `/1.0.0/vms/${encodeURIComponent(vmId)}/actions/suspend`,
  VM_RESET: (vmId: string) => `/1.0.0/vms/${encodeURIComponent(vmId)}/actions/reset`,
  VAPP_DELETE: (vappId: string) => `/1.0.0/vapps/${encodeURIComponent(vappId)}`,
}
```

##### Step 3: Update UI Components
**Files**: 
- `src/pages/vms/VMs.tsx`
- `src/pages/vms/VMDetail.tsx`

**Changes**:
- Update any hardcoded endpoint references
- Add proper error handling for unsupported operations
- Update status polling if necessary

#### Testing Plan

1. **API Server Verification**:
   - Test each power operation endpoint against actual API server
   - Document which endpoints are actually supported
   - Verify response formats

2. **Unit Tests**:
   - Test endpoint path generation
   - Test error handling for various failure scenarios
   - Mock API responses for different VM states

3. **Integration Tests**:
   - Test power on operation
   - Test power off operation
   - Test suspend operation
   - Test reset operation
   - Test bulk operations if supported

#### Rollback Plan
1. Revert VMService.ts to original endpoints
2. Test existing functionality still works
3. Disable power operations if necessary

---

### 3. vApp Creation (Template Instantiation) Fix

**Priority**: P0 (Critical)  
**Impact**: Cannot create new VMs/vApps  
**Estimated Effort**: 4-8 hours  

#### Current Issue
The project doesn't implement the documented instantiate template endpoint from the user guide.

#### Implementation Plan

##### Step 1: Add Instantiate Template Endpoint
**File**: `src/utils/constants.ts`

**Add Endpoint**:
```typescript
CLOUDAPI: {
  // ... existing endpoints
  INSTANTIATE_TEMPLATE: (vdcId: string) => 
    `/1.0.0/vdcs/${encodeURIComponent(vdcId)}/actions/instantiateTemplate`,
}
```

##### Step 2: Implement Instantiate Template Service
**File**: `src/services/cloudapi/VMService.ts`

**Add New Method**:
```typescript
/**
 * Instantiate a vApp template to create a new vApp
 * POST /cloudapi/1.0.0/vdcs/{vdcId}/actions/instantiateTemplate
 */
static async instantiateTemplate(
  vdcId: string,
  request: InstantiateTemplateRequest
): Promise<VApp> {
  const response = await cloudApi.post<VApp>(
    API_ENDPOINTS.CLOUDAPI.INSTANTIATE_TEMPLATE(vdcId),
    request
  );
  return response.data;
}
```

##### Step 3: Update InstantiateTemplateRequest Type
**File**: `src/types/index.ts`

**Verify/Update Type** (around line 542):
```typescript
export interface InstantiateTemplateRequest {
  name: string;
  description?: string;
  catalogItemUrn: string;  // Should be the catalog item URN
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
```

##### Step 4: Update VM Creation UI
**File**: `src/pages/vms/VMCreationWizard.tsx` (if exists) or relevant component

**Changes**:
1. Replace current VM creation logic with instantiate template call
2. Update form to collect required template instantiation parameters
3. Add proper error handling and progress indication
4. Update success handling to work with vApp response

**Example Implementation**:
```typescript
const handleCreateVM = async (formData: CreateVMRequest) => {
  try {
    // Convert form data to instantiate template request
    const request: InstantiateTemplateRequest = {
      name: formData.name,
      description: formData.description,
      catalogItemUrn: formData.catalog_item_id,
      powerOn: true,
      deploy: true,
      acceptAllEulas: true,
      // Add other configuration as needed
    };

    const vapp = await VMService.instantiateTemplate(formData.vdc_id, request);
    
    // Handle success - navigate to vApp detail or VM list
    navigate(`/vapps/${vapp.id}`);
  } catch (error) {
    setError(error.message);
  }
};
```

#### Testing Plan

1. **API Validation**:
   - Test instantiate template endpoint with minimal parameters
   - Test with various catalog items
   - Verify response format matches VApp type

2. **Integration Tests**:
   - Test complete VM creation workflow
   - Test with different template types
   - Test error scenarios (invalid catalog item, insufficient resources)

3. **UI Testing**:
   - Test VM creation wizard flow
   - Test form validation
   - Test error display and handling

#### Rollback Plan
1. Keep existing VM creation as fallback
2. Add feature flag to toggle between old and new creation methods
3. Revert to original implementation if issues arise

---

## P1 High Priority Fixes

### 4. User Management API Verification

**Priority**: P1 (High)  
**Impact**: User management features may not work  
**Estimated Effort**: 6-12 hours  

#### Current Issue
User management endpoints are implemented but not documented in the user guide.

#### Implementation Plan

##### Step 1: API Server Verification
**Task**: Contact API server team or test against actual server

**Questions to Answer**:
1. Are user management endpoints (`/cloudapi/1.0.0/users/*`) actually implemented?
2. What is the correct authentication/authorization for user operations?
3. Are there alternative endpoints for user management?
4. Should user management be handled through organization endpoints?

##### Step 2: Conditional Feature Implementation

**Option A: If User Endpoints Are Supported**
- Verify current implementation works
- Update any incorrect endpoint paths
- Add proper error handling

**Option B: If User Endpoints Are Not Supported**
- Disable user management UI
- Add feature flags to hide user management sections
- Implement alternative user management through organization endpoints

**Option C: If Alternative Endpoints Exist**
- Update UserService to use correct endpoints
- Update data structures to match API responses
- Update UI components accordingly

##### Step 3: Feature Flag Implementation
**File**: `src/utils/config.ts`

**Add Feature Flags**:
```typescript
export interface AppFeatures {
  userManagement: boolean;
  roleManagement: boolean;
  advancedUserOperations: boolean;
}

export const getFeatureFlags = (): AppFeatures => {
  const runtimeConfig = getRuntimeConfig();
  return {
    userManagement: runtimeConfig.features?.userManagement ?? false,
    roleManagement: runtimeConfig.features?.roleManagement ?? false,
    advancedUserOperations: runtimeConfig.features?.advancedUserOperations ?? false,
  };
};
```

##### Step 4: Conditional UI Rendering
**Files**: Navigation components, route configuration

**Example**:
```typescript
const features = getFeatureFlags();

// In navigation
{features.userManagement && (
  <NavItem to="/users" text="Users" />
)}

// In routes
{features.userManagement && (
  <Route path="/users" component={Users} />
)}
```

#### Testing Plan
1. Test against actual API server to determine endpoint availability
2. Test feature flag functionality
3. Test UI behavior with features enabled/disabled
4. Document actual API capabilities

---

### 5. Role Management API Verification

**Priority**: P1 (High)  
**Impact**: Role assignment and management may not work  
**Estimated Effort**: 4-8 hours  

#### Implementation Plan
Similar to User Management API Verification:

1. **Verify API Server Support**: Test role management endpoints
2. **Implement Feature Flags**: Add roleManagement feature flag
3. **Conditional UI**: Hide role management if not supported
4. **Alternative Implementation**: Use organization-based role assignment if available

---

## P2 Medium Priority Fixes

### 6. Legacy API Cleanup

**Priority**: P2 (Medium)  
**Impact**: Potential conflicts and confusion  
**Estimated Effort**: 8-16 hours  

#### Implementation Plan

##### Step 1: Audit Legacy Endpoints
**Task**: Document all endpoints under `/api/` prefix

**Files to Review**:
- `src/services/cloudapi/VDCAdminService.ts` (uses `/api/admin/org/` endpoints)
- Any other services using `/api/v1/` endpoints
- Mock handlers in `src/mocks/handlers.ts`

##### Step 2: Categorize Endpoints
**Categories**:
1. **Migrate to CloudAPI**: Endpoints that have CloudAPI equivalents
2. **Keep as Legacy**: Endpoints needed for admin operations not in CloudAPI
3. **Remove**: Deprecated or unused endpoints

##### Step 3: Create Migration Plan
- Document which legacy endpoints to migrate
- Create compatibility layer if needed
- Plan gradual migration strategy

---

## P3 Low Priority Fixes

### 7. Data Structure Alignment

**Priority**: P3 (Low)  
**Impact**: Minor inconsistencies in response handling  
**Estimated Effort**: 2-4 hours  

#### Implementation Plan

##### Step 1: Standardize Pagination
**Ensure all CloudAPI endpoints use**:
```typescript
interface VCloudPaginatedResponse<T> {
  resultTotal: number;
  pageCount: number;
  page: number;
  pageSize: number;
  associations?: Record<string, unknown>[];
  values: T[];
}
```

##### Step 2: Update Error Handling
**Standardize error response format** across all CloudAPI services.

---

## Implementation Timeline

### Phase 1: Critical Fixes (Week 1)
1. Session Management Endpoints Fix
2. VM Power Operations Fix  
3. vApp Creation Fix

### Phase 2: API Verification (Week 2)
1. User Management API Verification
2. Role Management API Verification
3. Update feature flags based on findings

### Phase 3: Cleanup (Week 3)
1. Legacy API Cleanup
2. Data Structure Alignment
3. Documentation Updates

## Success Criteria

### Phase 1 Success Criteria
- [ ] Authentication flow works with API server
- [ ] VM power operations work correctly
- [ ] vApp/VM creation works using instantiate template

### Phase 2 Success Criteria  
- [ ] User management features work or are properly disabled
- [ ] Role management features work or are properly disabled
- [ ] All UI components handle unsupported features gracefully

### Phase 3 Success Criteria
- [ ] No conflicting API endpoints
- [ ] Consistent data structures across all services
- [ ] Clean separation between CloudAPI and legacy APIs

## Risk Mitigation

### High Risk Items
1. **Authentication Changes**: Could break login completely
   - **Mitigation**: Implement behind feature flag, test thoroughly
   
2. **API Server Compatibility**: Unknown which endpoints are actually supported
   - **Mitigation**: Extensive testing against real API server, fallback implementations

3. **User Management Dependencies**: Other features may depend on user management
   - **Mitigation**: Gradual rollout, maintain backward compatibility

### Testing Strategy
1. **Unit Tests**: For all endpoint path generation and data transformation
2. **Integration Tests**: Against mock server with corrected endpoints  
3. **E2E Tests**: Against actual API server
4. **Feature Flag Tests**: Ensure UI works with features enabled/disabled

## Documentation Requirements

1. **API Endpoint Mapping**: Document all endpoints and their status
2. **Feature Flag Guide**: How to enable/disable features
3. **Testing Guide**: How to test against API server
4. **Rollback Procedures**: How to revert changes if needed

## Conclusion

These implementation plans provide a structured approach to fixing the identified API discrepancies. The phased approach prioritizes critical authentication and core functionality fixes while allowing for proper verification of API server capabilities before making extensive changes to user and role management features.