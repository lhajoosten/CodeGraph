/**
 * Cancel a running task execution.
 *
 * Signals the workflow to stop and cleanup resources.
 * Automatically invalidates task queries after cancellation.
 *
 * @returns Mutation hook for cancelling task execution
 *
 * @example
 * const cancelMutation = useCancelTask();
 * cancelMutation.mutate({ path: { task_id: 123 } });
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelTaskApiV1TasksTaskIdCancelPostMutation } from '@/openapi/@tanstack/react-query.gen';
import { taskQueryKeys } from '../keys';
import { addToast } from '@/lib/toast';
import { getErrorMessage } from '@/hooks/api/utils';

export const useCancelTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...cancelTaskApiV1TasksTaskIdCancelPostMutation(),
    onSuccess: (data, variables) => {
      addToast({
        title: 'Task Cancelled',
        description: 'Task execution has been cancelled successfully',
        color: 'warning',
      });

      // Invalidate task queries to refresh status
      const taskId = variables.path.task_id;
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.detail(taskId) });
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.execution(taskId) });
    },
    onError: (error) => {
      addToast({
        title: 'Failed to Cancel Task',
        description: getErrorMessage(error),
        color: 'danger',
      });
    },
  });
};
