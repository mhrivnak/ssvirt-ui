# API Endpoint Analysis Report

## Executive Summary

This report analyzes the current SSVIRT UI project's API endpoint usage, data structures, and UI components against the official API server user guide documentation. The analysis identifies significant discrepancies between the implemented endpoints and the documented CloudAPI standards.

## Analysis Methodology

1. **User Guide Analysis**: Analyzed the official user guide from https://raw.githubusercontent.com/mhrivnak/ssvirt/refs/heads/main/docs/user-guide.md
2. **Current Implementation Review**: Examined all API services, data structures, and UI components in the project
3. **Endpoint Mapping**: Compared current endpoints against documented CloudAPI standards
4. **Data Structure Validation**: Analyzed type definitions against expected CloudAPI response formats

## Key Findings

### Critical Discrepancies Found

#### 1. **Session Management Endpoints**

**Current Implementation:**
- Login: `/1.0.0/sessions`
- Logout: `/1.0.0/sessions`
- Session Info: `/1.0.0/session`

**Expected from User Guide:**
- Login: `/cloudapi/1.0.0/sessions` (POST)
- Session Info: `/cloudapi/1.0.0/sessions/{sessionId}` (GET)
- Logout: `/cloudapi/1.0.0/sessions/{sessionId}` (DELETE)

**Impact**: Authentication flow may be completely broken with the API server.

#### 2. **Organization Endpoints**

**Current Implementation:**
- List Orgs: `/cloudapi/1.0.0/orgs` ✓ (CORRECT)
- Get Org: `/cloudapi/1.0.0/orgs/{orgId}` ✓ (CORRECT)

**Status**: Organization endpoints are correctly implemented.

#### 3. **VDC Endpoints**

**Current Implementation:**
- List VDCs: `/cloudapi/1.0.0/vdcs` ✓ (CORRECT)
- Get VDC: `/cloudapi/1.0.0/vdcs/{vdcId}` ✓ (CORRECT)

**Status**: VDC endpoints are correctly implemented.

#### 4. **Catalog Endpoints**

**Current Implementation:**
- List Catalogs: `/cloudapi/1.0.0/catalogs` ✓ (CORRECT)
- Get Catalog Items: `/cloudapi/1.0.0/catalogs/{catalogId}/catalogItems` ✓ (CORRECT)

**Status**: Catalog endpoints are correctly implemented.

#### 5. **vApp Creation/Management Endpoints**

**Current Implementation:**
- Create vApp: Not using the documented instantiate template endpoint
- List vApps: `/cloudapi/1.0.0/vdcs/{vdcId}/vapps` (MISSING from user guide)
- Get vApp: `/cloudapi/1.0.0/vapps/{vappId}` (MISSING from user guide)
- Delete vApp: `/cloudapi/1.0.0/vapps/{vappId}` (MISSING from user guide)

**Expected from User Guide:**
- Create vApp: `/cloudapi/1.0.0/vdcs/{vdcId}/actions/instantiateTemplate` (POST)

**Impact**: vApp creation workflow may not work with API server.

#### 6. **VM Management Endpoints**

**Current Implementation:**
- VM actions use paths like `/1.0.0/vms/{vmId}/actions/*` and `/1.0.0/vapps/{vappId}`
- Get VM: `/cloudapi/1.0.0/vms/{vmId}` (MISSING from user guide)

**Expected from User Guide:**
- Get VM: `/cloudapi/1.0.0/vms/{vmId}` (documented but limited)

**Impact**: VM power operations and management may not work correctly.

#### 7. **User Management Endpoints**

**Current Implementation:**
- List Users: `/cloudapi/1.0.0/users`
- Get User: `/cloudapi/1.0.0/users/{userId}`
- Current User: `/cloudapi/1.0.0/users/current`

**Expected from User Guide:**
- **NOT DOCUMENTED** - User management endpoints are not mentioned in the user guide

**Impact**: Entire user management system may not be supported by the API server.

#### 8. **Role Management Endpoints**

**Current Implementation:**
- List Roles: `/cloudapi/1.0.0/roles`
- Get Role: `/cloudapi/1.0.0/roles/{roleId}`

**Expected from User Guide:**
- **NOT DOCUMENTED** - Role management endpoints are not mentioned in the user guide

**Impact**: Role management system may not be supported by the API server.

### Data Structure Discrepancies

#### 1. **Session Response Structure**

**Current Implementation (types/index.ts:67-92):**
```typescript
interface SessionResponse {
  id: string; // Session ID: "urn:vcloud:session:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  user: { name: string; id: string; };
  org: { name: string; id: string; };
  operatingOrg?: { name: string; id: string; };
  site: { name: string; id: string; };
  roles: string[]; // Array of role names
  roleRefs: Array<{ name: string; id: string; }>;
  sessionIdleTimeoutMinutes: number;
  location?: string;
}
```

**Expected from User Guide:**
- Session object should contain user, org, roles, and session details with JWT token-based authentication
- Bearer token authentication expected

#### 2. **Pagination Structure**

**Current Implementation:**
Uses both `PaginatedResponse<T>` and `VCloudPaginatedResponse<T>` formats:

```typescript
// Legacy format
interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

// CloudAPI format
interface VCloudPaginatedResponse<T> {
  resultTotal: number;
  pageCount: number;
  page: number;
  pageSize: number;
  associations?: Record<string, unknown>[];
  values: T[];
}
```

**Expected from User Guide:**
- Should use consistent VMware Cloud Director pagination format
- Should include proper metadata and filtering support

### Authentication Discrepancies

#### Current Implementation:
- Uses JWT token-based authentication
- Stores token in localStorage
- Uses Bearer token in Authorization header

#### Expected from User Guide:
- Uses Bearer token-based authentication with JWT tokens ✓ (CORRECT)
- Session management via CloudAPI endpoints

**Issue**: Session endpoint paths are incorrect, which may break the entire authentication flow.

## Service-Level Analysis

### CloudAPI Services Status

| Service | Status | Issues |
|---------|--------|--------|
| OrganizationService | ✅ Correct | Endpoints match user guide |
| VDCPublicService | ✅ Correct | Endpoints match user guide |
| CatalogService | ✅ Correct | Endpoints match user guide |
| VMService | ⚠️ Issues | Missing instantiate template endpoint, incorrect paths |
| UserService | ❌ Not Documented | Endpoints not in user guide |
| RoleService | ❌ Not Documented | Endpoints not in user guide |

### Legacy API Services

The project also implements legacy API endpoints under `/api/` paths:

| Endpoint Pattern | Purpose | Status |
|------------------|---------|--------|
| `/api/admin/org/{orgId}/vdcs` | VDC admin operations | May conflict with CloudAPI |
| `/api/v1/*` | Various legacy operations | May be deprecated |

**Recommendation**: Audit all legacy endpoints to determine if they should be migrated to CloudAPI or removed.

## UI Component Impact Analysis

### Pages Affected by API Discrepancies

1. **Authentication (Login.tsx)**
   - **Issue**: Uses incorrect session endpoints
   - **Impact**: Login may fail completely

2. **VM Management (VMs.tsx, VMDetail.tsx)**
   - **Issue**: VM power operations use incorrect endpoints
   - **Impact**: Power on/off, reset operations may not work

3. **User Management (Users.tsx, UserDetail.tsx)**
   - **Issue**: User management endpoints not documented in API
   - **Impact**: Entire user management UI may be non-functional

4. **Role Management**
   - **Issue**: Role endpoints not documented in API
   - **Impact**: Role assignment and management may not work

5. **vApp Management (VAppDetail.tsx)**
   - **Issue**: vApp instantiation uses wrong endpoint
   - **Impact**: Creating new vApps may fail

### Components Working Correctly

1. **Organization Management** - Endpoints correctly implemented
2. **VDC Management** - Endpoints correctly implemented  
3. **Catalog Browsing** - Endpoints correctly implemented

## Detailed Discrepancy Breakdown

### 1. Session Management Fix Required

**File**: `src/utils/constants.ts` (lines 52-55)

**Current**:
```typescript
CLOUDAPI: {
  LOGIN: '/1.0.0/sessions',
  LOGOUT: '/1.0.0/sessions', 
  SESSION: '/1.0.0/session',
}
```

**Should be**:
```typescript
CLOUDAPI: {
  LOGIN: '/1.0.0/sessions',                    // POST for login
  LOGOUT: (sessionId: string) => `/1.0.0/sessions/${sessionId}`, // DELETE
  SESSION: (sessionId: string) => `/1.0.0/sessions/${sessionId}`, // GET
}
```

### 2. VM Service Instantiate Template

**File**: `src/services/cloudapi/VMService.ts`

**Missing Implementation**: 
- POST `/cloudapi/1.0.0/vdcs/{vdcId}/actions/instantiateTemplate`

**Current VM Creation**: Uses non-standard endpoints

### 3. User/Role Management APIs

**Files**: 
- `src/services/cloudapi/UserService.ts`
- `src/services/cloudapi/RoleService.ts`

**Issue**: These entire service files implement endpoints that are not documented in the user guide and may not exist on the API server.

## Priority Assessment

### P0 (Critical - Blocks Core Functionality)
1. **Session Management Endpoints** - Authentication will fail
2. **VM Power Operations** - Core VM management broken
3. **vApp Creation** - Template instantiation broken

### P1 (High - Major Features Broken)  
1. **User Management System** - May not be supported by API
2. **Role Management System** - May not be supported by API

### P2 (Medium - Enhanced Features)
1. **Legacy API Cleanup** - Remove deprecated endpoints
2. **Data Structure Alignment** - Ensure consistent response formats

### P3 (Low - Optimization)
1. **Error Handling Standardization**
2. **Response Format Consistency**

## Recommendations

### Immediate Actions Required

1. **Verify API Server Capabilities**
   - Contact API server team to confirm which endpoints are actually implemented
   - Validate user guide completeness against actual API server

2. **Fix Authentication Flow**
   - Update session endpoint paths to match user guide
   - Test authentication workflow end-to-end

3. **Implement Missing vApp Creation**
   - Add proper instantiateTemplate endpoint implementation
   - Update VM creation workflow

### Medium-term Recommendations

1. **API Endpoint Audit**
   - Create comprehensive mapping of all endpoints
   - Mark endpoints as CloudAPI-compliant, legacy, or unknown

2. **Feature Parity Analysis**
   - Determine which UI features are actually supported by the API server
   - Disable or remove unsupported features

3. **Testing Strategy**
   - Implement integration tests against actual API server
   - Create mock server matching exact API behavior

### Long-term Recommendations

1. **API Documentation Improvement**
   - Work with API server team to improve documentation
   - Ensure all implemented endpoints are documented

2. **UI Architecture Refactoring**
   - Separate CloudAPI services from legacy services
   - Implement proper error boundaries for unsupported features

## Conclusion

The analysis reveals significant discrepancies between the current UI implementation and the documented API server endpoints. The most critical issues are in session management and VM operations, which could prevent the application from functioning at all with the actual API server.

Priority should be given to fixing authentication endpoints and verifying which user/role management endpoints are actually supported by the API server. A comprehensive testing approach against the real API server is essential to validate these findings.

The project shows good architecture in separating CloudAPI services, but needs significant corrections to align with the actual API server implementation as documented in the user guide.