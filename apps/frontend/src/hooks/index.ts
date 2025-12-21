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
export { useToggle, useFormError, useLocalStorage } from './common';
