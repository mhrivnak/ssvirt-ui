import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  useVisibilityAwarePolling,
  useAutoRefreshState,
} from '../useVisibilityAwarePolling';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useVisibilityAwarePolling', () => {
  beforeEach(() => {
    // Reset document.hidden
    Object.defineProperty(document, 'hidden', {
      value: false,
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return true when document is visible', () => {
    const { result } = renderHook(() => useVisibilityAwarePolling());
    expect(result.current).toBe(true);
  });

  it('should return false when document is hidden', () => {
    Object.defineProperty(document, 'hidden', {
      value: true,
      writable: true,
    });

    const { result } = renderHook(() => useVisibilityAwarePolling());
    expect(result.current).toBe(false);
  });

  it('should respond to visibility change events', () => {
    const { result } = renderHook(() => useVisibilityAwarePolling());

    expect(result.current).toBe(true);

    // Simulate tab becoming hidden
    act(() => {
      Object.defineProperty(document, 'hidden', {
        value: true,
        writable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current).toBe(false);

    // Simulate tab becoming visible again
    act(() => {
      Object.defineProperty(document, 'hidden', {
        value: false,
        writable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current).toBe(true);
  });
});

describe('useAutoRefreshState', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should use default value when no stored value exists', () => {
    const { result } = renderHook(() => useAutoRefreshState('test-key', true));

    expect(result.current[0]).toBe(true);
    expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key');
  });

  it('should use stored value when available', () => {
    localStorageMock.getItem.mockReturnValue('false');

    const { result } = renderHook(() => useAutoRefreshState('test-key', true));

    expect(result.current[0]).toBe(false);
  });

  it('should update localStorage when state changes', () => {
    const { result } = renderHook(() => useAutoRefreshState('test-key', true));

    act(() => {
      result.current[1](false);
    });

    expect(result.current[0]).toBe(false);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', 'false');
  });
});
