# vApp Creation from Catalog Templates Enhancement

## Overview

This document outlines the implementation plan for adding vApp creation
functionality to catalog template views in the SSVirt UI. Users will be able to
directly create vApps from catalog templates by clicking a "Create vApp" button,
filling out a modal form, and submitting the creation request through the
CloudAPI.

## Current State

### Existing Implementation
- **Catalog Template Viewing**: Users can browse catalog templates in the Templates tab of catalog detail pages
- **Template Cards**: Each template is displayed in a card format with basic information (name, description, version, parameters)
- **CloudAPI Integration**: Complete infrastructure for CloudAPI calls with authentication and error handling
- **vApp Management**: Basic vApp listing and detail views exist but lack creation capabilities
- **VDC Integration**: VDC selection and management functionality is available

### Current Limitations
1. **No vApp Creation UI**: Users cannot create vApps directly from templates through the UI
2. **Missing Template-to-vApp Workflow**: No direct path from template browsing to vApp instantiation
3. **Limited Action Options**: Template cards only show "View Details" and "Deploy" placeholder actions
4. **No VDC Context Integration**: Template views don't integrate with VDC selection for vApp placement

## Target State

### vApp Creation Workflow
- **Create vApp Button**: Each template card shows a prominent "Create vApp" action button
- **Modal Form Interface**: Clicking opens a well-designed modal for vApp configuration
- **VDC Selection**: Users can select target VDC for vApp deployment
- **Form Validation**: Real-time validation with clear error messages and input requirements
- **Progress Feedback**: Clear loading states and success/error feedback during creation process

### Integration Points
- **Template Card Actions**: Enhanced with "Create vApp" primary action alongside existing options
- **VDC Context**: Integration with user's available VDCs for target selection
- **Navigation Flow**: Seamless navigation to created vApp details after successful creation
- **Permission Guards**: Proper role-based access control for vApp creation capabilities

## API Compliance

### CloudAPI Endpoint
Based on the [SSVirt API Reference](https://raw.githubusercontent.com/mhrivnak/ssvirt/refs/heads/main/docs/api-reference.md):

#### vApp Template Instantiation
- **Create vApp from Template**: `POST /cloudapi/1.0.0/vdcs/{vdc_id}/actions/instantiateTemplate`
  - Request Body:
    ```json
    {
      "name": "string",           // Required: Name of the new vApp
      "description": "string",    // Optional: Description of the vApp
      "catalogItem": {
        "id": "string",          // Required: URN of the catalog item/template
        "name": "string"         // Optional: Name of the catalog item
      }
    }
    ```
  - Response: `201 Created` with vApp object containing ID, name, status, and metadata
  - Authentication: Bearer Token via existing CloudAPI auth system

#### Related Endpoints
- **List VDCs**: `GET /cloudapi/1.0.0/vdcs` (existing) - For VDC selection dropdown
- **VDC Details**: `GET /cloudapi/1.0.0/vdcs/{vdc_id}` (existing) - For VDC validation
- **vApp Details**: `GET /cloudapi/1.0.0/vapps/{vapp_id}` (existing) - For post-creation navigation

### Authentication & Authorization
All operations require Bearer Token authentication via the existing CloudAPI auth system and appropriate role permissions for vApp creation within the target VDC.

## Implementation Plan

### Phase 1: Core vApp Creation Modal (Priority: High)

#### 1.1 Create vApp Creation Form Component
```typescript
// src/components/vapps/CreateVAppModal.tsx
interface CreateVAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalogItem: CatalogItem;
  onSuccess?: (vappId: string) => void;
}
```

**Features**:
- Modal-based form with CloudAPI integration
- Fields: vApp Name (required), Description (optional), Target VDC (required dropdown)
- VDC selection populated from user's available VDCs
- Real-time validation with error display
- Loading states during creation process
- Success feedback with navigation option

#### 1.2 Enhance Template Card Actions
```typescript
// Update src/components/catalogs/CatalogItemCard.tsx
const cardActions = [
  {
    title: 'Create vApp',
    variant: 'primary',
    icon: <PlayIcon />,
    onClick: () => setCreateVAppModal({ isOpen: true, catalogItem }),
  },
  {
    title: 'View Details',
    variant: 'secondary', 
    icon: <InfoCircleIcon />,
    onClick: () => onViewDetails(catalogItem),
  }
];
```

**Integration Points**:
- Add "Create vApp" as primary action on template cards
- Trigger creation modal with template context pre-filled
- Handle modal state management and success callbacks
- Show appropriate actions based on user permissions

#### 1.3 VDC Selection Integration
```typescript
// Enhance useVDCs hook for user-accessible VDCs
const { data: userVDCs } = useVDCs({
  filter: 'accessible', // Only VDCs user can deploy to
  organizationId: currentOrgId,
});
```

**Features**:
- Fetch and display user's accessible VDCs
- VDC dropdown with search/filter capabilities
- Validation to ensure selected VDC supports vApp creation
- Permission-based VDC filtering

### Phase 2: Form Validation & UX (Priority: High)

#### 2.1 Comprehensive Form Validation
- **vApp Name**: Required, 1-255 characters, unique within VDC validation
- **Description**: Optional, up to 1024 characters
- **VDC Selection**: Required, must be accessible to user
- **Real-time Validation**: Field-level and form-level error display
- **Async Validation**: Check vApp name uniqueness within selected VDC

#### 2.2 Enhanced User Experience
- **Loading States**: Disable form during submission, show progress indicators
- **Error Handling**: Clear error messages for validation and API failures
- **Success Flow**: Success notification with options to view created vApp or create another
- **Form Persistence**: Remember form data during session for better UX

#### 2.3 Responsive Design
- **Mobile Support**: Optimize modal layout for mobile devices
- **Accessibility**: Proper ARIA labels, keyboard navigation, screen reader support
- **PatternFly Compliance**: Use PatternFly v6 components and design patterns

### Phase 3: Integration & Navigation (Priority: Medium)

#### 3.1 Enhanced Template Actions
```typescript
// Update catalog template views to include vApp creation
const templateActions = [
  {
    title: 'Create vApp',
    primary: true,
    permission: 'canCreateVApps',
    action: (template) => openCreateVAppModal(template),
  },
  {
    title: 'View Template Details', 
    secondary: true,
    action: (template) => navigateToTemplateDetails(template),
  }
];
```

#### 3.2 Post-Creation Navigation
- **Success Redirect**: Navigate to created vApp details page after successful creation
- **vApp List Integration**: Option to return to vApp list with newly created vApp highlighted
- **Breadcrumb Updates**: Maintain proper navigation context throughout the flow


## Technical Architecture

### Component Structure
```
src/
├── components/vapps/
│   ├── CreateVAppModal.tsx          # Main vApp creation form modal
│   ├── VDCSelector.tsx              # VDC selection dropdown component
│   └── VAppCreationProgress.tsx     # Progress tracking component
├── hooks/
│   ├── useCreateVApp.ts             # vApp creation mutation hook
│   ├── useAccessibleVDCs.ts         # User-accessible VDCs hook
│   └── useVAppNameValidation.ts     # vApp name uniqueness validation
└── services/cloudapi/
    └── VAppService.ts               # Enhanced with creation methods
```

### State Management
- **React Query**: Leverage existing infrastructure for vApp creation mutations
- **Cache Invalidation**: Automatic refresh of vApp lists after creation
- **Optimistic Updates**: Immediate UI feedback for better UX
- **Error Boundaries**: Graceful error handling for failed operations

### API Service Layer
```typescript
// Enhanced VAppService with creation capabilities
export class VAppService {
  static async createFromTemplate(request: CreateVAppFromTemplateRequest): Promise<VApp> {
    return cloudApi.post(`/vdcs/${request.vdcId}/actions/instantiateTemplate`, {
      name: request.name,
      description: request.description,
      catalogItem: {
        id: request.catalogItemId,
        name: request.catalogItemName,
      }
    });
  }

  static async validateVAppName(vdcId: string, name: string): Promise<boolean> {
    // Check if vApp name is unique within VDC
  }
}
```

### Permission Integration
```typescript
// Enhanced permission checks for vApp creation
const canCreateVApps = userPermissions?.canManageVApps && 
                       userPermissions?.canAccessVDC?.(selectedVdcId);
```

## User Experience Design

### vApp Creation Flow
1. **Template Discovery**: User browses catalog templates in Templates tab
2. **Action Selection**: User clicks "Create vApp" button on desired template card
3. **Modal Opening**: vApp creation modal opens with template context pre-filled
4. **Form Completion**: User fills out vApp name, description, and selects target VDC
5. **Validation**: Real-time validation provides immediate feedback
6. **Submission**: User clicks "Create vApp" with loading state and progress indication
7. **Success Handling**: Success notification with navigation options to view created vApp

### Form Interaction Design
1. **Template Context**: Template name and details displayed prominently in modal header
2. **Smart Defaults**: Pre-populate reasonable defaults (e.g., vApp name based on template name)
3. **Progressive Disclosure**: Show advanced options only when needed
4. **Validation Feedback**: Clear, actionable error messages with field-level highlighting
5. **Loading States**: Disable form during submission, show progress spinners

### Error Handling
1. **Validation Errors**: Inline field errors with clear corrective guidance
2. **API Errors**: User-friendly error messages with retry options
3. **Permission Errors**: Clear explanation of missing permissions with guidance
4. **Network Errors**: Retry mechanisms with offline state handling

## Security Considerations

### Access Control
- **VDC Permissions**: Users can only create vApps in VDCs they have access to
- **Template Access**: Respect catalog and template visibility permissions
- **Organization Scoping**: Ensure vApps are created within user's organization context
- **Role Validation**: Validate user roles support vApp creation operations

### Input Validation
- **Server-Side Validation**: All inputs validated on CloudAPI side for security
- **XSS Prevention**: Sanitize all user inputs to prevent cross-site scripting
- **Injection Protection**: Use parameterized queries and validate all API inputs
- **Rate Limiting**: Respect API rate limits for vApp creation requests

### Data Handling
- **No Sensitive Data Storage**: Don't store credentials or sensitive template information
- **Audit Logging**: Log vApp creation attempts for security monitoring
- **Error Information**: Sanitize error messages to prevent information disclosure

## Testing Strategy

### Unit Tests
- **Component Testing**: Test vApp creation modal, form validation, and VDC selection
- **Hook Testing**: Test creation mutation, VDC fetching, and validation hooks
- **Service Testing**: Test VAppService creation and validation methods
- **Permission Testing**: Test role-based access control for vApp creation

### Integration Tests
- **API Integration**: Test CloudAPI calls with mock responses and error scenarios
- **Navigation Flow**: Test complete user journey from template to vApp creation
- **State Management**: Test cache invalidation and optimistic updates
- **Error Scenarios**: Test various failure modes and recovery mechanisms

### User Acceptance Testing
- **Creation Workflow**: Complete template-to-vApp creation flow testing
- **Permission Scenarios**: Test as different user roles (Org Admin, vApp User)
- **Browser Compatibility**: Test across supported browsers and devices
- **Performance Testing**: Test with large numbers of templates and VDCs

### Accessibility Testing
- **Screen Reader**: Test modal and form navigation with screen readers
- **Keyboard Navigation**: Ensure full keyboard accessibility
- **Color Contrast**: Verify color contrast meets accessibility standards
- **Focus Management**: Test focus handling in modal interactions

## Success Metrics

### Functional Metrics
- **Creation Success Rate**: > 95% successful vApp creations without errors
- **Validation Accuracy**: Zero invalid vApp creation attempts reaching the API
- **Navigation Efficiency**: < 3 clicks from template discovery to vApp creation start
- **Error Recovery**: > 90% of failed attempts result in successful retry

### Performance Metrics
- **Modal Load Time**: vApp creation modal opens in < 500ms
- **Form Responsiveness**: Form validation feedback appears in < 200ms
- **Creation Time**: vApp creation completes in < 30 seconds average
- **UI Responsiveness**: No UI blocking during vApp creation process

### User Experience Metrics
- **Task Completion Rate**: > 90% of users successfully complete vApp creation
- **User Satisfaction**: Positive feedback on vApp creation workflow
- **Support Requests**: Reduce vApp creation-related support tickets by 60%
- **Feature Adoption**: > 80% of eligible users utilize vApp creation features

## Implementation Timeline

### Phase 1: Core Functionality (Week 1-2)
1. **Week 1**: Create vApp creation modal component and basic form
2. **Week 1**: Implement VDC selection and basic validation
3. **Week 2**: Integrate CloudAPI service for vApp creation
4. **Week 2**: Add template card actions and modal triggering

### Phase 2: Polish & Integration (Week 3)
1. **Enhanced Validation**: Implement comprehensive form validation and error handling
2. **UX Improvements**: Add loading states, success feedback, and navigation
3. **Permission Integration**: Implement role-based access control
4. **Responsive Design**: Ensure mobile compatibility and accessibility

### Phase 3: Testing & Deployment (Week 4)
1. **Comprehensive Testing**: Unit tests, integration tests, and user acceptance testing
2. **Performance Optimization**: Optimize load times and responsiveness
3. **Documentation**: Update user guides and developer documentation
4. **Deployment Preparation**: Final quality assurance and deployment planning

## Migration & Rollout

### Deployment Strategy
- **Feature Flags**: Enable vApp creation features gradually by user role
- **Backward Compatibility**: Ensure existing template viewing functionality remains intact
- **Progressive Enhancement**: Add new features without disrupting existing workflows
- **Rollback Plan**: Ability to disable vApp creation features if issues arise

### User Training
- **In-App Guidance**: Contextual tooltips and help text for new vApp creation features
- **Documentation Updates**: Update user guides with vApp creation procedures
- **Video Tutorials**: Create screen recordings of vApp creation workflows
- **Admin Training**: Special guidance for organization administrators

### Monitoring & Support
- **Usage Analytics**: Track vApp creation feature adoption and success rates
- **Error Monitoring**: Monitor API errors and user-reported issues
- **Performance Tracking**: Monitor creation times and system performance impact
- **User Feedback**: Collect and respond to user feedback on new features

## Success Criteria for Rollout
1. **Core Functionality Complete**: vApp creation from templates working for all user roles
2. **Quality Standards Met**: All tests passing with > 95% code coverage
3. **Performance Targets Achieved**: All response time and user experience metrics met
4. **User Acceptance**: Positive feedback from beta users and stakeholders
5. **Security Validation**: Security review completed with no critical issues
6. **Documentation Complete**: User and developer documentation updated and reviewed

## Conclusion

This enhancement will significantly improve the SSVirt UI by providing a seamless path from template discovery to vApp creation. By integrating directly with the CloudAPI instantiateTemplate endpoint and maintaining strict adherence to existing UI patterns and security requirements, users will have a powerful and intuitive way to deploy applications from catalog templates.

The implementation focuses on three core principles: **usability** (simple, guided workflow), **reliability** (robust error handling and validation), and **security** (proper permission controls and input validation). This approach ensures that the feature will be both powerful for users and maintainable for developers.

Key success factors include maintaining CloudAPI compliance, implementing comprehensive permission controls, providing excellent user feedback throughout the creation process, and ensuring the feature integrates seamlessly with existing catalog and vApp management workflows.