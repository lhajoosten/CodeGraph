import { useState } from 'react';
import { createLazyFileRoute } from '@tanstack/react-router';
import { PlusIcon } from '@heroicons/react/24/outline';
import { AppLayout } from '@/components/layout/app-layout';
import { TaskList } from '@/components/tasks/task-list';
import { TaskForm } from '@/components/tasks/task-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCreateTask, useTasks } from '@/hooks/api';
import { addToast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import type { TaskCreateFormData } from '@/lib/validators';

function TasksPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const createTaskMutation = useCreateTask();
  const { data: response } = useTasks();

  const tasks = response?.items ?? [];
  const totalCount = tasks.length;
  const inProgressCount = tasks.filter((task) => task.status === 'in_progress').length;
  const completedCount = tasks.filter((task) => task.status === 'completed').length;

  const handleCreateTask = (data: TaskCreateFormData) => {
    createTaskMutation.mutate(
      {
        body: {
          title: data.title,
          description: data.description || '',
          priority: data.priority,
        },
      },
      {
        onSuccess: () => {
          addToast({
            title: 'Task created',
            description: 'Your task has been created successfully.',
            color: 'success',
          });
          setIsCreateDialogOpen(false);
        },
        onError: () => {
          addToast({
            title: 'Failed to create task',
            description: 'Please try again.',
            color: 'danger',
          });
        },
      }
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Enhanced Page Header with gradient and stats */}
        <div
          className={cn(
            'relative overflow-hidden rounded-2xl',
            'bg-gradient-surface border border-border-subtle',
            'p-6 sm:p-8'
          )}
        >
          {/* Subtle gradient overlay */}
          <div className="bg-gradient-teal-subtle absolute inset-0 opacity-50" />

          <div className="relative">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
                  Tasks
                </h1>
                <p className="max-w-2xl text-text-secondary">
                  Manage your AI-powered development tasks. Let intelligent agents help you plan,
                  implement, test, and review code changes.
                </p>

                {/* Task count summary */}
                {totalCount > 0 && (
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-text-muted">Total:</span>
                      <span className="font-semibold text-text-primary">{totalCount}</span>
                    </div>
                    {inProgressCount > 0 && (
                      <>
                        <div className="divider-vertical h-4" />
                        <div className="flex items-center gap-2">
                          <div className="status-dot bg-brand-cyan" />
                          <span className="text-text-muted">In Progress:</span>
                          <span className="font-semibold text-text-primary">{inProgressCount}</span>
                        </div>
                      </>
                    )}
                    {completedCount > 0 && (
                      <>
                        <div className="divider-vertical h-4" />
                        <div className="flex items-center gap-2">
                          <div className="status-dot status-ready" />
                          <span className="text-text-muted">Completed:</span>
                          <span className="font-semibold text-text-primary">{completedCount}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Create button with glow effect */}
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                leftIcon={<PlusIcon className="h-5 w-5" />}
                className="glow-teal-sm shrink-0"
              >
                New Task
              </Button>
            </div>
          </div>
        </div>

        {/* Task list */}
        <TaskList onCreateTask={() => setIsCreateDialogOpen(true)} />
      </div>

      {/* Enhanced Dialog with glass effect */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Create New Task</DialogTitle>
            <DialogDescription className="text-base">
              Create a new AI-powered development task. The AI agents will help you plan, implement,
              test, and review your code changes autonomously.
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            onSubmit={handleCreateTask}
            isLoading={createTaskMutation.isPending}
            error={createTaskMutation.error}
          />
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

export const Route = createLazyFileRoute('/_protected/tasks/')({
  component: TasksPage,
});
