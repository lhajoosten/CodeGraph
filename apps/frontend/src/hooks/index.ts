/**
 * Centralized hooks export.
 * Provides convenient access to all hooks across the application.
 */

// Library hooks - utilities for creating hooks
export { createQueryHook, type QueryData, type QueryError } from './lib';

// API hooks - queries and mutations for backend operations
export {
  // Auth hooks
  useCurrentUser,
  useLogin,
  useLogout,
  useRegister,
  // Task hooks
  useTasks,
  useTask,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  taskQueryKeys,
} from './api';

// Common component hooks - reusable UI logic
export {
  // State hooks
  useToggle,
  useFormError,
  useLocalStorage,
  useDisclosure,
  useControlledDisclosure,
  // Utility hooks
  useDebounce,
  useDebouncedCallback,
  useCopyToClipboard,
  useIsMounted,
  useHasMounted,
  // DOM hooks
  useClickOutside,
  useClickOutsideMultiple,
  useKeyboardShortcut,
  useKeyboardShortcuts,
  // Media query hooks
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  usePrefersReducedMotion,
  usePrefersDarkMode,
  useBreakpoint,
  // SSE hooks
  useEventSource,
  useAgentStream,
  type AgentUpdate,
} from './common';
