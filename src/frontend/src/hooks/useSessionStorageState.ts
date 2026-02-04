import { useState, useEffect, useCallback } from 'react';

/**
 * A React hook that persists state to sessionStorage.
 * @param key - The sessionStorage key
 * @param defaultValue - The default value if no stored value exists
 * @returns A tuple of [value, setValue] similar to useState
 */
export function useSessionStorageState<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Initialize state from sessionStorage or use default
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = sessionStorage.getItem(key);
      if (stored !== null) {
        return JSON.parse(stored) as T;
      }
    } catch (error) {
      console.warn(`Failed to read sessionStorage key "${key}":`, error);
    }
    return defaultValue;
  });

  // Update sessionStorage whenever value changes
  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to write sessionStorage key "${key}":`, error);
    }
  }, [key, value]);

  // Wrapper to support functional updates like useState
  const setStoredValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const valueToStore = newValue instanceof Function ? newValue(prev) : newValue;
        return valueToStore;
      });
    },
    []
  );

  return [value, setStoredValue];
}
