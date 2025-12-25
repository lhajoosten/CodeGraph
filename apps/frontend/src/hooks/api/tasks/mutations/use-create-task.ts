/**
 * Create a new task.
 *
 * Automatically invalidates the task list after creation.
 *
 * @returns Mutation hook for creating a task
 *
 * @example
 * const createMutation = useCreateTask();
 * createMutation.mutate(
 *   { body: { title: 'New Task', description: '...', priority: 'MEDIUM' } },
 *   { onSuccess: () => console.log('Task created!') }
 * );
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTaskApiV1TasksPostMutation } from '@/openapi/@tanstack/react-query.gen';
import { taskQueryKeys } from '../keys';
import type { InferHeyApiMutationOptions } from '@/lib/types';
import { addToast } from '@/lib/toast';
import { getErrorMessage } from '@/hooks/api/utils';

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...createTaskApiV1TasksPostMutation(),
    onSuccess: () => {
      addToast({
        title: 'Task Created',
        description: 'Task created successfully. Our agents are ready to work on it!',
        color: 'success',
      });
      // Invalidate task list to refetch
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.lists() });
    },
    onError: (error) => {
      addToast({
        title: 'Failed to Create Task',
        description: getErrorMessage(error),
        color: 'danger',
      });
    },
  });
};

export type UseCreateTaskOptions = InferHeyApiMutationOptions<
  typeof createTaskApiV1TasksPostMutation
>;
