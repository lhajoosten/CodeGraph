/**
 * Task management API hooks - Queries and mutations.
 * Handles task CRUD operations.
 */

export { useFetchTasks, useFetchTask, type UseFetchTasksOptions } from './queries';
export {
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  type UseCreateTaskOptions,
  type UseUpdateTaskOptions,
  type UseDeleteTaskOptions,
} from './mutations';
export { taskQueryKeys } from './keys';
