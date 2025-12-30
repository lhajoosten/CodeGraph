/**
 * Delete a task.
 *
 * Automatically invalidates the task list and removes the specific task from cache.
 *
 * @returns Mutation hook for deleting a task
 *
 * @example
 * const deleteMutation = useDeleteTask();
 * deleteMutation.mutate(
 *   { path: { task_id: 123 } },
 *   { onSuccess: () => console.log('Task deleted!') }
 * );
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteTaskApiV1TasksTaskIdDeleteMutation } from '@/openapi/@tanstack/react-query.gen';
import { taskQueryKeys } from '../keys';
import type { InferHeyApiMutationOptions } from '@/lib/types';
import { addToast } from '@/lib/toast';
import { getErrorMessage } from '@/hooks/api/utils';

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...deleteTaskApiV1TasksTaskIdDeleteMutation(),
    onSuccess: (_data, variables) => {
      addToast({
        title: 'Task Deleted',
        description: 'Task deleted successfully.',
        color: 'success',
      });
      // Invalidate the task list
      queryClient.invalidateQueries({
        queryKey: taskQueryKeys.lists(),
      });
      // Remove the specific task from cache if it exists
      if (variables.path.task_id !== null) {
        queryClient.removeQueries({
          queryKey: taskQueryKeys.detail(variables.path.task_id),
        });
      }
    },
    onError: (error) => {
      addToast({
        title: 'Failed to Delete Task',
        description: getErrorMessage(error),
        color: 'danger',
      });
    },
  });
};

export type UseDeleteTaskOptions = InferHeyApiMutationOptions<
  typeof deleteTaskApiV1TasksTaskIdDeleteMutation
>;
