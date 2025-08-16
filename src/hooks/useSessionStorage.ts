import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing session storage with type safety
 * Provides automatic persistence and retrieval of values
 */
export function useSessionStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Initialize state with value from session storage or default
  const [state, setState] = useState<T>(() => {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Failed to load session storage item "${key}":`, error);
      return defaultValue;
    }
  });

  // Update session storage when state changes
  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.warn(`Failed to save session storage item "${key}":`, error);
    }
  }, [key, state]);

  // Function to update state (supports functional updates)
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setState((prev) => {
      const newValue =
        typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
      return newValue;
    });
  }, []);

  // Function to clear the stored value
  const clearValue = useCallback(() => {
    try {
      sessionStorage.removeItem(key);
      setState(defaultValue);
    } catch (error) {
      console.warn(`Failed to remove session storage item "${key}":`, error);
    }
  }, [key, defaultValue]);

  return [state, setValue, clearValue];
}

/**
 * Hook specifically for managing vApps view filter persistence
 * Handles organization and VDC selections with automatic restoration
 */
export function useVAppsSessionFilters() {
  const [persistedFilters, setPersisted, clearPersisted] = useSessionStorage(
    'vapps-view-filters',
    {
      org_id: '',
      vdc_id: '',
    }
  );

  const updateOrganization = useCallback(
    (org_id: string) => {
      setPersisted((prev) => ({
        ...prev,
        org_id,
        // Clear VDC when organization changes
        vdc_id: '',
      }));
    },
    [setPersisted]
  );

  const updateVDC = useCallback(
    (vdc_id: string) => {
      setPersisted((prev) => ({
        ...prev,
        vdc_id,
      }));
    },
    [setPersisted]
  );

  const clearSession = useCallback(() => {
    clearPersisted();
  }, [clearPersisted]);

  return {
    persistedFilters,
    updateOrganization,
    updateVDC,
    clearSession,
  };
}
