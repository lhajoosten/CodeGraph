/**
 * API hooks - queries and mutations for backend API operations.
 * Organized by feature with separated queries and mutations.
 */

// Auth hooks
export {
  useFetchCurrentUser,
  useLogin,
  useLogout,
  useRegister,
  type UseLoginOptions,
  type UseLogoutOptions,
  type UseRegisterOptions,
} from './auth';

// Task hooks
export {
  useFetchTasks,
  useFetchTask,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  taskQueryKeys,
  type UseFetchTasksOptions,
  type UseCreateTaskOptions,
  type UseUpdateTaskOptions,
  type UseDeleteTaskOptions,
} from './tasks';

// Backward compatibility aliases
export { useFetchCurrentUser as useCurrentUser } from './auth';
export { useFetchTasks as useTasks, useFetchTask as useTask } from './tasks';
