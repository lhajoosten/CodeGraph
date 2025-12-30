/**
 * Execution control buttons for task execution.
 *
 * Provides execute and cancel buttons with appropriate states and confirmations.
 */

import { PlayIcon, StopIcon } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useExecuteTask, useCancelTask } from '@/hooks/api/tasks/mutations';
import { useExecutionStore } from '@/stores/execution-store.ts';
import type { TaskStatus } from '@/openapi/types.gen';

interface TaskExecutionControlsProps {
  taskId: number;
  taskStatus: TaskStatus;
  className?: string;
}

export function TaskExecutionControls({
  taskId,
  taskStatus,
  className,
}: TaskExecutionControlsProps) {
  const { execute, isExecuting } = useExecuteTask(taskId);
  const cancelMutation = useCancelTask();
  const { startExecution, stopExecution } = useExecutionStore();

  const canExecute = taskStatus === 'pending' || taskStatus === 'failed' || taskStatus === 'cancelled';
  const canCancel = isExecuting || (taskStatus !== 'pending' && taskStatus !== 'completed' && taskStatus !== 'failed' && taskStatus !== 'cancelled');

  const handleExecute = () => {
    startExecution(taskId);
    execute();
  };

  const handleCancel = () => {
    cancelMutation.mutate(
      { path: { task_id: taskId } },
      {
        onSuccess: () => {
          stopExecution();
        },
      }
    );
  };

  return (
    <div className={className}>
      <div className="flex gap-2">
        {canExecute && (
          <Button
            onClick={handleExecute}
            disabled={isExecuting}
            variant="default"
          >
            <PlayIcon className="mr-2 h-4 w-4" />
            {isExecuting ? 'Executing...' : 'Execute'}
          </Button>
        )}

        {canCancel && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={cancelMutation.isPending}
              >
                <StopIcon className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Task Execution</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to cancel this execution? The current workflow will be stopped immediately.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>No, continue</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancel}>
                  Yes, cancel execution
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
