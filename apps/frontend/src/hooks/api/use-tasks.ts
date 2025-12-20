/**
 * Task management API hooks.
 * Handles task queries, creation, updates, and deletion.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listTasksApiV1TasksGetOptions,
  getTaskApiV1TasksTaskIdGetOptions,
  createTaskApiV1TasksPostMutation,
  updateTaskApiV1TasksTaskIdPatchMutation,
  deleteTaskApiV1TasksTaskIdDeleteMutation,
} from '@/api/generated/@tanstack/react-query.gen';
import type {
  ListTasksApiV1TasksGetData,
  GetTaskApiV1TasksTaskIdGetError,
  GetTaskApiV1TasksTaskIdGetResponse,
  CreateTaskApiV1TasksPostData,
  CreateTaskApiV1TasksPostResponse,
  CreateTaskApiV1TasksPostError,
  UpdateTaskApiV1TasksTaskIdPatchData,
  UpdateTaskApiV1TasksTaskIdPatchResponse,
  UpdateTaskApiV1TasksTaskIdPatchError,
  DeleteTaskApiV1TasksTaskIdDeleteData,
  DeleteTaskApiV1TasksTaskIdDeleteError,
} from '@/api/generated/types.gen';

// Query key factory
export const taskQueryKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskQueryKeys.all, 'list'] as const,
  list: (filters?: Partial<ListTasksApiV1TasksGetData>) =>
    [...taskQueryKeys.lists(), { filters }] as const,
  details: () => [...taskQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...taskQueryKeys.details(), id] as const,
};

/**
 * Fetch all tasks with optional pagination and filtering.
 *
 * @param options - Query parameters (skip, limit, status, etc.)
 * @returns Query hook with task list
 *
 * @example
 * const { data: response, isLoading } = useTasks({ skip: 0, limit: 20 });
 * const tasks = response?.items || [];
 */
export const useTasks = (options?: Partial<ListTasksApiV1TasksGetData>) => {
  return useQuery({
    ...listTasksApiV1TasksGetOptions(options),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Fetch a single task by ID.
 *
 * @param taskId - The task ID to fetch
 * @returns Query hook with task details
 *
 * @example
 * const { data: task, isLoading } = useTask(123);
 */
export const useTask = (taskId: number) => {
  return useQuery<GetTaskApiV1TasksTaskIdGetResponse, GetTaskApiV1TasksTaskIdGetError>({
    ...getTaskApiV1TasksTaskIdGetOptions({ path: { taskId } }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Create a new task.
 * Automatically invalidates the task list after creation.
 *
 * @returns Mutation hook for creating a task
 *
 * @example
 * const createMutation = useCreateTask();
 * createMutation.mutate(
 *   { requestBody: { title: 'New Task', description: '...', priority: 'MEDIUM' } },
 *   { onSuccess: () => console.log('Task created!') }
 * );
 */
export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation<
    CreateTaskApiV1TasksPostResponse,
    CreateTaskApiV1TasksPostError,
    CreateTaskApiV1TasksPostData
  >(createTaskApiV1TasksPostMutation(), {
    onSuccess: () => {
      // Invalidate task list to refetch
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.lists() });
    },
  });
};

/**
 * Update an existing task.
 * Automatically invalidates the specific task and list after update.
 *
 * @param taskId - The task ID to update
 * @returns Mutation hook for updating a task
 *
 * @example
 * const updateMutation = useUpdateTask(123);
 * updateMutation.mutate(
 *   { requestBody: { status: 'COMPLETED' }, path: { taskId: 123 } },
 *   { onSuccess: () => console.log('Task updated!') }
 * );
 */
export const useUpdateTask = (taskId: number) => {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateTaskApiV1TasksTaskIdPatchResponse,
    UpdateTaskApiV1TasksTaskIdPatchError,
    UpdateTaskApiV1TasksTaskIdPatchData
  >(updateTaskApiV1TasksTaskIdPatchMutation(), {
    onSuccess: () => {
      // Invalidate both the specific task and the list
      queryClient.invalidateQueries({
        queryKey: taskQueryKeys.detail(taskId),
      });
      queryClient.invalidateQueries({
        queryKey: taskQueryKeys.lists(),
      });
    },
  });
};

/**
 * Delete a task.
 * Automatically invalidates the task list and removes the specific task from cache.
 *
 * @param taskId - The task ID to delete
 * @returns Mutation hook for deleting a task
 *
 * @example
 * const deleteMutation = useDeleteTask(123);
 * deleteMutation.mutate(
 *   { path: { taskId: 123 } },
 *   { onSuccess: () => console.log('Task deleted!') }
 * );
 */
export const useDeleteTask = (taskId: number) => {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    DeleteTaskApiV1TasksTaskIdDeleteError,
    DeleteTaskApiV1TasksTaskIdDeleteData
  >(deleteTaskApiV1TasksTaskIdDeleteMutation(), {
    onSuccess: () => {
      // Invalidate the task list
      queryClient.invalidateQueries({
        queryKey: taskQueryKeys.lists(),
      });
      // Remove the specific task from cache
      queryClient.removeQueries({
        queryKey: taskQueryKeys.detail(taskId),
      });
    },
  });
};
