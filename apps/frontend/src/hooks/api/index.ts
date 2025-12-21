/**
 * API hooks - queries and mutations for backend API operations.
 * Auto-generated from OpenAPI spec via @hey-api/openapi-ts.
 */

export { useCurrentUser, useLogin, useLogout, useRegister } from './use-auth';

export {
  useTasks,
  useTask,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  taskQueryKeys,
} from './use-tasks';
