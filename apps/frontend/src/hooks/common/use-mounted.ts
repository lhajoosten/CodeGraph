import { useEffect, useSyncExternalStore, useMemo, useRef, useCallback } from 'react';

/**
 * Tracks whether the component is mounted.
 * Useful for avoiding state updates on unmounted components.
 *
 * @returns Whether the component is currently mounted
 *
 * @example
 * ```tsx
 * const isMounted = useIsMounted();
 *
 * useEffect(() => {
 *   fetchData().then((data) => {
 *     if (isMounted()) {
 *       setData(data);
 *     }
 *   });
 * }, []);
 * ```
 */
export function useIsMounted(): () => boolean {
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useCallback(() => isMountedRef.current, []);
}

/**
 * Store for tracking mounted state
 */
const createMountedStore = () => {
  let mounted = false;
  const listeners = new Set<() => void>();

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot() {
      return mounted;
    },
    getServerSnapshot() {
      return false;
    },
    setMounted() {
      mounted = true;
      listeners.forEach((listener) => listener());
    },
  };
};

/**
 * Returns true only after the first render is complete.
 * Useful for hydration-safe rendering.
 *
 * @example
 * ```tsx
 * const hasMounted = useHasMounted();
 *
 * // Only render client-specific content after mount
 * if (!hasMounted) {
 *   return <Skeleton />;
 * }
 * return <ClientOnlyComponent />;
 * ```
 */
export function useHasMounted(): boolean {
  const store = useMemo(() => createMountedStore(), []);

  const hasMounted = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  );

  useEffect(() => {
    store.setMounted();
  }, [store]);

  return hasMounted;
}
