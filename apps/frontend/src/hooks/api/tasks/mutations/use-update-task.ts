/**
 * Update an existing task.
 *
 * Automatically invalidates the specific task and list after update.
 *
 * @param taskId - The task ID to update
 * @returns Mutation hook for updating a task
 *
 * @example
 * const updateMutation = useUpdateTask(123);
 * updateMutation.mutate(
 *   { body: { status: 'COMPLETED' }, path: { task_id: 123 } },
 *   { onSuccess: () => console.log('Task updated!') }
 * );
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTaskApiV1TasksTaskIdPatchMutation } from '@/openapi/@tanstack/react-query.gen';
import { taskQueryKeys } from '../keys';
import type { InferHeyApiMutationOptions } from '@/lib/types';
import { addToast } from '@/lib/toast';
import { getErrorMessage } from '@/hooks/api/utils';

export const useUpdateTask = (taskId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...updateTaskApiV1TasksTaskIdPatchMutation(),
    onSuccess: () => {
      addToast({
        title: 'Task Updated',
        description: 'Task updated successfully.',
        color: 'success',
      });
      // Invalidate both the specific task and the list
      queryClient.invalidateQueries({
        queryKey: taskQueryKeys.detail(taskId),
      });
      queryClient.invalidateQueries({
        queryKey: taskQueryKeys.lists(),
      });
    },
    onError: (error) => {
      addToast({
        title: 'Failed to Update Task',
        description: getErrorMessage(error),
        color: 'danger',
      });
    },
  });
};

export type UseUpdateTaskOptions = InferHeyApiMutationOptions<
  typeof updateTaskApiV1TasksTaskIdPatchMutation
>;
