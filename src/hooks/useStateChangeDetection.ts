import React, { useMemo } from 'react';

/**
 * Hook to detect state changes between current and previous data
 */
export function useStateChangeDetection<T extends Record<string, unknown>>(
  currentData: T | undefined,
  compareFields: (keyof T)[]
): { hasChanges: boolean; changedFields: Set<keyof T> } {
  const previousData = usePrevious(currentData);

  return useMemo(() => {
    if (!previousData || !currentData) {
      return { hasChanges: false, changedFields: new Set() };
    }

    const changedFields = new Set<keyof T>();
    compareFields.forEach((field) => {
      if (currentData[field] !== previousData[field]) {
        changedFields.add(field);
      }
    });

    return { hasChanges: changedFields.size > 0, changedFields };
  }, [currentData, previousData, compareFields]);
}

/**
 * Hook to track previous value for comparison
 */
function usePrevious<T>(value: T): T | undefined {
  const ref = React.useRef<T | undefined>(undefined);
  React.useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}
