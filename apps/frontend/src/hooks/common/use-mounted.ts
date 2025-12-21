import { useEffect, useRef, useState, useCallback } from 'react';

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
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted;
}
