# Enhancement Proposal: Automatic State Updates for Detail Views

## Overview

This enhancement proposes implementing automatic state updates for vApp and VM
detail views through periodic API polling. The views will automatically refresh
every 2 seconds to display real-time state changes, providing users with
up-to-date information about their virtual infrastructure without manual page
refreshes.

## Background

Currently, the vApp and VM detail views display static information that only
updates when the user manually refreshes the page or navigates away and back.
This creates several issues:

- **Stale Information**: Users may act on outdated state information, leading to confusion or errors
- **Poor User Experience**: Users must manually refresh to see current VM/vApp power states, provisioning status, or other dynamic properties
- **Operational Inefficiency**: Administrators monitoring deployments or troubleshooting issues cannot see real-time progress
- **Missed State Transitions**: Critical state changes (startup, shutdown, errors) may go unnoticed

Virtual machines and vApps in VMware Cloud Director have dynamic states that change frequently:
- **Power States**: poweredOn, poweredOff, suspended, mixed (for vApps)
- **Status**: RESOLVED, UNRESOLVED, DEPLOYED, SUSPENDED, POWERED_ON, WAITING_FOR_INPUT, UNKNOWN, UNRECOGNIZED, FAILED_CREATION
- **Task Progress**: Ongoing operations like startup, shutdown, deployment, deletion
- **Resource Utilization**: CPU, memory, storage metrics
- **Network Status**: IP assignments, connectivity state

## Goals

1. **Real-Time Updates**: Provide automatic state synchronization every 2 seconds for active detail views
2. **Visual Feedback**: Clearly indicate when data is being refreshed and highlight state changes
3. **Performance Optimization**: Implement efficient polling that doesn't impact application performance
4. **User Control**: Allow users to pause/resume auto-refresh and manually trigger immediate updates
5. **Error Handling**: Gracefully handle network failures and API errors during polling
6. **Resource Management**: Automatically pause polling when views are not active to conserve resources

## Detailed Design

### Architecture Components

#### 1. React Query Integration with Polling

Leverage React Query's built-in polling capabilities to implement automatic refresh:

```typescript
// Enhanced hook for vApp details with auto-refresh
export function useVAppDetail(vappId: string, autoRefresh = true) {
  return useQuery({
    queryKey: ['vapp', vappId],
    queryFn: () => VAppService.getVAppDetail(vappId),
    refetchInterval: autoRefresh ? 2000 : false, // 2 second polling
    refetchIntervalInBackground: false, // Pause when tab is not active
    refetchOnWindowFocus: true, // Refresh when user returns to tab
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Enhanced hook for VM details with auto-refresh
export function useVMDetail(vmId: string, autoRefresh = true) {
  return useQuery({
    queryKey: ['vm', vmId],
    queryFn: () => VMService.getVMDetail(vmId),
    refetchInterval: autoRefresh ? 2000 : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
```

#### 2. State Change Detection and Visual Indicators

Implement visual feedback for state changes:

```typescript
// State change detection hook
export function useStateChangeDetection<T>(
  currentData: T,
  previousData: T | undefined,
  compareFields: (keyof T)[]
): { hasChanges: boolean; changedFields: Set<keyof T> } {
  return useMemo(() => {
    if (!previousData || !currentData) {
      return { hasChanges: false, changedFields: new Set() };
    }

    const changedFields = new Set<keyof T>();
    compareFields.forEach(field => {
      if (currentData[field] !== previousData[field]) {
        changedFields.add(field);
      }
    });

    return { hasChanges: changedFields.size > 0, changedFields };
  }, [currentData, previousData, compareFields]);
}

// Visual state change indicator component
const StateChangeIndicator: React.FC<{
  isChanged: boolean;
  children: React.ReactNode;
}> = ({ isChanged, children }) => {
  const [showHighlight, setShowHighlight] = useState(false);

  useEffect(() => {
    if (isChanged) {
      setShowHighlight(true);
      const timer = setTimeout(() => setShowHighlight(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isChanged]);

  return (
    <div className={showHighlight ? 'pf-v6-u-background-color-warning-100 pf-v6-u-animation-fade-in' : ''}>
      {children}
    </div>
  );
};
```

#### 3. Auto-Refresh Controls

Provide user controls for managing auto-refresh:

```typescript
// Auto-refresh control component
const AutoRefreshControls: React.FC<{
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  onManualRefresh: () => void;
  isLoading: boolean;
  lastUpdated: Date | null;
}> = ({ isEnabled, onToggle, onManualRefresh, isLoading, lastUpdated }) => {
  return (
    <Toolbar>
      <ToolbarContent>
        <ToolbarGroup>
          <ToolbarItem>
            <Switch
              id="auto-refresh-toggle"
              label="Auto-refresh (2s)"
              isChecked={isEnabled}
              onChange={(_, checked) => onToggle(checked)}
            />
          </ToolbarItem>
          <ToolbarItem>
            <Button
              variant="secondary"
              onClick={onManualRefresh}
              isLoading={isLoading}
              icon={<SyncAltIcon />}
            >
              Refresh
            </Button>
          </ToolbarItem>
          {lastUpdated && (
            <ToolbarItem>
              <Text component="small">
                Last updated: {formatDistanceToNow(lastUpdated)} ago
              </Text>
            </ToolbarItem>
          )}
        </ToolbarGroup>
      </ToolbarContent>
    </Toolbar>
  );
};
```

#### 4. Performance Optimizations

Implement efficiency measures to minimize resource usage:

```typescript
// Visibility-aware auto-refresh hook
export function useVisibilityAwareAutoRefresh() {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}

// Optimized data fetching with selective field updates
const optimizePollingQueries = (queryClient: QueryClient) => {
  // Only refetch essential fields for polling, full refresh on manual request
  queryClient.setQueryDefaults(['vapp'], {
    refetchInterval: 2000,
    structuralSharing: true, // Optimize re-renders
    notifyOnChangeProps: ['data', 'error'], // Only notify on actual data/error changes
  });

  queryClient.setQueryDefaults(['vm'], {
    refetchInterval: 2000,
    structuralSharing: true,
    notifyOnChangeProps: ['data', 'error'],
  });
};
```

### Implementation Plan

#### Phase 1: Core Infrastructure (Week 1)
1. **React Query Configuration**: Update existing hooks to support polling
2. **State Detection**: Implement state change detection utilities
3. **Basic Auto-Refresh**: Add auto-refresh capability to vApp and VM detail hooks
4. **User Preferences**: Add settings for auto-refresh preferences in local storage

#### Phase 2: Visual Enhancements (Week 2)
1. **Change Indicators**: Implement visual highlights for state changes
2. **Control Components**: Add auto-refresh toggle and manual refresh controls
3. **Loading States**: Enhance loading indicators for polling vs. manual refresh
4. **Timestamp Display**: Show last updated time and next refresh countdown

#### Phase 3: Performance & Polish (Week 3)
1. **Visibility Detection**: Pause polling when tab/window is not active
2. **Error Handling**: Robust error handling and retry logic for failed polls
3. **Memory Optimization**: Implement cleanup for unmounted components
4. **Testing**: Comprehensive testing of polling behavior and edge cases

### API Integration

#### CloudAPI Endpoints

The implementation will use existing CloudAPI endpoints with optimized request patterns:

**vApp Details Polling**:
```
GET /cloudapi/1.0.0/vApps/{vapp_id}
```

**VM Details Polling**:
```
GET /cloudapi/1.0.0/vms/{vm_id}
```

#### Response Optimization

To minimize bandwidth and processing overhead:

1. **Conditional Requests**: Use ETag headers to avoid unnecessary data transfer
2. **Field Selection**: Request only essential fields during polling
3. **Compression**: Ensure gzip compression is enabled for all API responses
4. **Caching Strategy**: Implement intelligent caching with React Query

### User Experience Design

#### Visual Design Patterns

1. **Status Indicators**: Use PatternFly status icons with consistent color coding
   - 🟢 Green: Running/Active states
   - 🟡 Yellow: Transitioning/Warning states  
   - 🔴 Red: Error/Failed states
   - ⚪ Gray: Stopped/Inactive states

2. **Change Animations**: Subtle fade-in/highlight animations for state changes
3. **Refresh Indicators**: Small progress indicators during automatic refresh
4. **Manual Controls**: Clear, accessible controls for user preference management

#### Accessibility Considerations

1. **Screen Reader Support**: Announce state changes to assistive technologies
2. **Keyboard Navigation**: Full keyboard access to auto-refresh controls
3. **Motion Preferences**: Respect user's prefers-reduced-motion settings
4. **Color Independence**: Don't rely solely on color for state indication

### Error Handling and Edge Cases

#### Network Failure Scenarios

1. **Connection Loss**: Graceful degradation when network is unavailable
2. **API Timeouts**: Exponential backoff for failed requests
3. **Rate Limiting**: Respect API rate limits and adjust polling frequency
4. **Authentication Expiry**: Handle session expiration during polling

#### Implementation Details

```typescript
// Error handling wrapper for polling
const withPollingErrorHandling = (queryFn: () => Promise<any>) => {
  return async () => {
    try {
      return await queryFn();
    } catch (error) {
      // Log error but don't throw to avoid breaking polling cycle
      console.warn('Polling request failed:', error);
      
      if (error instanceof AuthError) {
        // Handle authentication expiry
        redirectToLogin();
        throw error;
      }
      
      if (error instanceof RateLimitError) {
        // Temporary increase in polling interval
        throw new Error('Rate limited - will retry with longer interval');
      }
      
      // For other errors, return previous data and continue polling
      throw error;
    }
  };
};
```

### Testing Strategy

#### Unit Tests
- State change detection logic
- Auto-refresh control components
- Polling hook behavior
- Error handling scenarios

#### Integration Tests
- End-to-end auto-refresh workflows
- Network failure simulation
- Performance impact measurement
- Cross-browser compatibility

#### Manual Testing Scenarios
1. **State Transition Testing**: Verify UI updates during VM power state changes
2. **Performance Testing**: Monitor resource usage during extended polling
3. **Network Simulation**: Test behavior with slow/intermittent connections
4. **User Interaction Testing**: Verify controls work as expected

### Security Considerations

1. **Authentication**: Ensure polling respects session timeouts and token refresh
2. **Rate Limiting**: Implement client-side rate limiting to prevent API abuse
3. **Data Validation**: Validate all polled data to prevent XSS or injection attacks
4. **Permission Checks**: Verify user permissions before each poll request

### Performance Metrics

Success criteria for the implementation:

- **Polling Accuracy**: 99%+ successful polls under normal conditions
- **State Update Latency**: <3 seconds from actual state change to UI update
- **Resource Usage**: <5% additional CPU/memory usage during polling
- **Network Overhead**: <1MB additional bandwidth per hour of active polling
- **User Satisfaction**: Improved user experience metrics from user testing

## Migration Plan

### Rollout Strategy

1. **Feature Flag**: Implement behind a feature flag for gradual rollout
2. **Beta Testing**: Enable for internal users first
3. **Opt-In**: Make auto-refresh opt-in initially to gauge user adoption
4. **Default Enable**: Enable by default after validation period

### Backward Compatibility

- Maintain existing manual refresh behavior as fallback
- Preserve current API contracts
- Ensure graceful degradation for older browsers

## Future Enhancements

### Potential Extensions

1. **WebSocket Integration**: Consider WebSocket for real-time updates instead of polling
2. **Smart Polling**: Adjust polling frequency based on detected activity levels
3. **Push Notifications**: Browser notifications for critical state changes
4. **Bulk Operations**: Real-time updates for bulk VM/vApp operations
5. **Historical State Tracking**: Track and display state change history

### Integration Opportunities

1. **Dashboard Integration**: Extend auto-refresh to dashboard overview widgets
2. **List Views**: Apply similar patterns to VM/vApp list views
3. **Monitoring Integration**: Connect with system monitoring for proactive updates
4. **Task Tracking**: Real-time updates for long-running VMware Cloud Director tasks

---

This enhancement will significantly improve the user experience by providing real-time visibility into virtual infrastructure state changes, reducing the need for manual refreshes and enabling more responsive operational workflows.
