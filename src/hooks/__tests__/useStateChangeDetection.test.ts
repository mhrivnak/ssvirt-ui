import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useStateChangeDetection } from '../useStateChangeDetection';

describe('useStateChangeDetection', () => {
  it('should detect no changes on initial render', () => {
    const currentData = { status: 'POWERED_ON', name: 'test-vm' };
    const { result } = renderHook(() =>
      useStateChangeDetection(currentData, ['status', 'name'])
    );

    expect(result.current.hasChanges).toBe(false);
    expect(result.current.changedFields.size).toBe(0);
  });

  it('should detect status change', () => {
    const initialData = { status: 'POWERED_OFF', name: 'test-vm' };
    const { result, rerender } = renderHook(
      ({ data }) => useStateChangeDetection(data, ['status', 'name']),
      { initialProps: { data: initialData } }
    );

    // Initial render - no changes
    expect(result.current.hasChanges).toBe(false);

    // Update status
    const updatedData = { status: 'POWERED_ON', name: 'test-vm' };
    rerender({ data: updatedData });

    expect(result.current.hasChanges).toBe(true);
    expect(result.current.changedFields.has('status')).toBe(true);
    expect(result.current.changedFields.has('name')).toBe(false);
  });

  it('should detect multiple field changes', () => {
    const initialData = { status: 'POWERED_OFF', name: 'test-vm', cpu: 2 };
    const { result, rerender } = renderHook(
      ({ data }) => useStateChangeDetection(data, ['status', 'name', 'cpu']),
      { initialProps: { data: initialData } }
    );

    // Update multiple fields
    const updatedData = { status: 'POWERED_ON', name: 'renamed-vm', cpu: 2 };
    rerender({ data: updatedData });

    expect(result.current.hasChanges).toBe(true);
    expect(result.current.changedFields.has('status')).toBe(true);
    expect(result.current.changedFields.has('name')).toBe(true);
    expect(result.current.changedFields.has('cpu')).toBe(false);
  });

  it('should handle undefined data gracefully', () => {
    const { result } = renderHook(() =>
      useStateChangeDetection(undefined, ['status'])
    );

    expect(result.current.hasChanges).toBe(false);

    // Test with defined data following undefined
    const { result: result2 } = renderHook(() =>
      useStateChangeDetection({ status: 'POWERED_ON' }, ['status'])
    );

    expect(result2.current.hasChanges).toBe(false);
  });
});
