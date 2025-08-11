# VM Management CloudAPI Migration Fix

## Problem Summary

The "All Virtual Machines" view is failing with a 404 error because the frontend is using legacy API endpoints that no longer exist on the backend. The console shows:

```
GET /api/v1/vms?sort_by=name&sort_order=asc&page=1&per_page=20 404 (Not Found)
```

## Root Cause

The VM management system was designed to use VMware Cloud Director CloudAPI endpoints (`/cloudapi/1.0.0/*`), but the React hooks and components are still importing and using the legacy VMService (`src/services/vms.ts`) instead of the CloudAPI VMService (`src/services/cloudapi/VMService.ts`).

## Required Changes

### 1. **Update VM Hooks to Use CloudAPI Service**
- **File**: `src/hooks/useVMs.ts` 
- **Change**: Import and use `VMService` from `src/services/cloudapi/VMService.ts` instead of `src/services/vms.ts`
- **Current**: `import { VMService } from '../services';` (legacy)
- **Should be**: `import { VMService } from '../services/cloudapi/VMService';` (CloudAPI)

### 2. **Update VMs Page Component**
- **File**: `src/pages/vms/VMs.tsx`
- **Changes needed**:
  - Update imports to use CloudAPI VM hooks
  - Adapt data handling for CloudAPI response format (`VCloudPaginatedResponse<VMCloudAPI>`)
  - Update VM type references from legacy `VM` type to `VMCloudAPI` type
  - Handle the different data structure (CloudAPI uses `values` array vs legacy `data` array)

### 3. **Response Format Differences**
According to the documentation:
- **Legacy**: Returns `PaginatedResponse<VM>` with `{ data: VM[], pagination: {...} }`
- **CloudAPI**: Returns `VCloudPaginatedResponse<VMCloudAPI>` with `{ values: VMCloudAPI[], resultTotal, page, pageSize }`

### 4. **VM Data Structure Changes**
- **Legacy VM fields**: `id`, `name`, `status`, `vdc_id`, `org_id`, `cpu_count`, `memory_mb`, `created_at`
- **CloudAPI VM fields**: VMware Cloud Director URN format IDs, different field names and structure

### 5. **Power Operations Migration**
- **Current**: Legacy endpoints like `/v1/vms/{id}/power-on`
- **Should use**: CloudAPI endpoints like `/cloudapi/1.0.0/vms/{vmId}/actions/powerOn`

### 6. **VM Creation Migration**
- **Current**: Direct VM creation via `/v1/vms`
- **Should use**: vApp-based template instantiation via `/cloudapi/1.0.0/vdcs/{vdcId}/actions/instantiateTemplate`

## Implementation Priority

### 1. **High Priority** (Critical for basic functionality):
   - Fix `useVMs` hook to use CloudAPI service
   - Update VMs page to handle CloudAPI response format
   - Update VM type imports and data mapping

### 2. **Medium Priority** (For full functionality):
   - Update power operations to use CloudAPI endpoints
   - Update VM detail page
   - Update bulk operations

### 3. **Lower Priority** (For creation workflow):
   - Replace VM creation wizard with template instantiation workflow
   - Update catalog integration for template selection

## Files to Modify

### Critical Path:
1. `src/hooks/useVMs.ts` - Change service import
2. `src/pages/vms/VMs.tsx` - Update response handling and data mapping
3. `src/types/index.ts` - Ensure VM type exports include CloudAPI types

### Supporting Files:
4. `src/hooks/useCloudAPIVMs.ts` - May need updates for compatibility
5. `src/components/vms/VMPowerActions.tsx` - Update to use CloudAPI power operations
6. `src/pages/vms/VMDetail.tsx` - Update for CloudAPI VM data structure

## Technical Details

### Expected CloudAPI Response Format:
```typescript
{
  "resultTotal": 25,
  "pageCount": 1,
  "page": 1,
  "pageSize": 25,
  "associations": null,
  "values": [
    {
      "id": "urn:vcloud:vm:uuid",
      "name": "VM Name",
      "status": "POWERED_ON",
      "href": "https://vcd.example.com/cloudapi/1.0.0/vms/uuid",
      "type": "application/json",
      "createdDate": "2024-01-15T10:30:00.000Z",
      "lastModifiedDate": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Data Mapping Requirements:
- Convert CloudAPI `values` array to legacy `data` array format
- Map CloudAPI pagination format to legacy pagination format
- Handle URN-based IDs vs simple string IDs
- Map CloudAPI field names to legacy field names expected by UI components

## Success Criteria

1. ✅ VM list page loads without 404 errors
2. ✅ VMs display correctly in the table
3. ✅ Pagination works properly
4. ✅ Filtering and sorting work
5. ✅ Power operations work (power on/off/reboot/suspend)
6. ✅ VM detail page loads correctly
7. ✅ VM creation workflow functions (template instantiation)

## References

- VMware Cloud Director API Documentation: [VM API Reference](https://developer.broadcom.com/xapis/vmware-cloud-director-openapi/latest/vms/)
- Implementation Documentation: `docs/enhancements/vm-creation-api-implementation.md`
- CloudAPI Service Implementation: `src/services/cloudapi/VMService.ts`