/**
 * Centralized hooks export.
 * Provides convenient access to all hooks across the application.
 *
 * API hooks are organized by feature with separated queries and mutations.
 * See src/hooks/api/{feature}/ for feature-specific hooks.
 */

// API hooks - queries and mutations for backend operations
export {
  // Auth hooks - queries
  useFetchCurrentUser,
  // Auth hooks - mutations
  useLogin,
  useLogout,
  useRegister,
  // Auth hooks - types
  type UseLoginOptions,
  type UseLogoutOptions,
  type UseRegisterOptions,
  // Task hooks - queries
  useFetchTasks,
  useFetchTask,
  // Task hooks - mutations
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  // Task hooks - utilities
  taskQueryKeys,
  type UseFetchTasksOptions,
  type UseCreateTaskOptions,
  type UseUpdateTaskOptions,
  type UseDeleteTaskOptions,
} from './api';

// Backward compatibility aliases
export { useCurrentUser, useTasks, useTask } from './api';

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
