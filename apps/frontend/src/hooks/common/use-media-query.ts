import { useState, useEffect } from 'react';
import { BREAKPOINTS, MEDIA_QUERIES } from '@/lib/constants';

/**
 * Tracks whether a media query matches.
 *
 * @param query - The media query string to match
 * @returns Whether the media query currently matches
 *
 * @example
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

/**
 * Returns true if the viewport is mobile-sized (< 768px)
 */
export function useIsMobile(): boolean {
  return useMediaQuery(MEDIA_QUERIES.mobile);
}

/**
 * Returns true if the viewport is tablet-sized (768px - 1023px)
 */
export function useIsTablet(): boolean {
  return useMediaQuery(MEDIA_QUERIES.tablet);
}

/**
 * Returns true if the viewport is desktop-sized (>= 1024px)
 */
export function useIsDesktop(): boolean {
  return useMediaQuery(MEDIA_QUERIES.desktop);
}

/**
 * Returns true if the user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery(MEDIA_QUERIES.prefersReducedMotion);
}

/**
 * Returns true if the user prefers dark mode
 */
export function usePrefersDarkMode(): boolean {
  return useMediaQuery(MEDIA_QUERIES.prefersDarkMode);
}

/**
 * Returns the current breakpoint name
 */
export function useBreakpoint(): 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' {
  const isSm = useMediaQuery(`(min-width: ${BREAKPOINTS.sm}px)`);
  const isMd = useMediaQuery(`(min-width: ${BREAKPOINTS.md}px)`);
  const isLg = useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
  const isXl = useMediaQuery(`(min-width: ${BREAKPOINTS.xl}px)`);
  const is2xl = useMediaQuery(`(min-width: ${BREAKPOINTS['2xl']}px)`);

  if (is2xl) return '2xl';
  if (isXl) return 'xl';
  if (isLg) return 'lg';
  if (isMd) return 'md';
  if (isSm) return 'sm';
  return 'xs';
}
