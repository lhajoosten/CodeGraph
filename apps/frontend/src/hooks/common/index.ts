/**
 * Common component hooks - reusable logic for UI components.
 */

// Existing hooks
export { useToggle } from './use-toggle';
export { useFormError } from './use-form-error';
export { useLocalStorage } from './use-local-storage';

// New hooks
export { useDebounce, useDebouncedCallback } from './use-debounce';
export {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  usePrefersReducedMotion,
  usePrefersDarkMode,
  useBreakpoint,
} from './use-media-query';
export { useDisclosure, useControlledDisclosure } from './use-disclosure';
export { useClickOutside, useClickOutsideMultiple } from './use-click-outside';
export { useCopyToClipboard } from './use-copy-to-clipboard';
export { useIsMounted, useHasMounted } from './use-mounted';
export { useKeyboardShortcut, useKeyboardShortcuts } from './use-keyboard-shortcut';
export { useEventSource, useAgentStream, type AgentUpdate } from './use-event-source';
