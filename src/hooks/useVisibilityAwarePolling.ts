import { useState, useEffect } from 'react';

/**
 * Hook to detect if the document/tab is visible
 * Returns false when the tab is in the background to pause polling
 */
export function useVisibilityAwarePolling(): boolean {
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

/**
 * Hook to manage auto-refresh state with user preference persistence
 */
export function useAutoRefreshState(
  storageKey: string,
  defaultEnabled = true
): [boolean, (enabled: boolean) => void] {
  const [isEnabled, setIsEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return defaultEnabled;
      return JSON.parse(stored);
    } catch (error) {
      // Clear corrupted value and return default
      localStorage.removeItem(storageKey);
      console.warn(
        `Failed to parse localStorage value for ${storageKey}:`,
        error
      );
      return defaultEnabled;
    }
  });

  const setEnabled = (enabled: boolean) => {
    setIsEnabled(enabled);
    localStorage.setItem(storageKey, JSON.stringify(enabled));
  };

  return [isEnabled, setEnabled];
}
