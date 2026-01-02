import { useCallback, useState } from 'react';
import { createLazyFileRoute } from '@tanstack/react-router';
import { PlusIcon, SparklesIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
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
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { useCreateTask, useTasks } from '@/hooks/api';
import { useHasMounted } from '@/hooks/common';
import { addToast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import type { TaskCreateFormData } from '@/lib/validators';

function TasksPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const createTaskMutation = useCreateTask();
  const { data: response } = useTasks();
  const hasMounted = useHasMounted();
  const onSpanAbort = useCallback((event: React.SyntheticEvent<HTMLSpanElement>) => {
    event.preventDefault();
  }, []);

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
        {/* Enhanced Page Header with animated gradient and orbs */}
        <div
          className={cn(
            'noise relative overflow-hidden rounded-2xl',
            'bg-gradient-surface border border-border-subtle',
            'p-6 sm:p-8'
          )}
        >
          {/* Animated gradient orbs */}
          <div className="orb orb-teal orb-animated pointer-events-none absolute -top-20 -right-20 h-64 w-64 opacity-20" />
          <div className="orb orb-cyan animate-drift-reverse pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 opacity-15" />

          {/* Subtle gradient overlay */}
          <div className="bg-gradient-teal-subtle absolute inset-0 opacity-40" />

          <div className="relative">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                {/* Header with icon */}
                <div
                  className={cn(
                    'flex items-center gap-3',
                    hasMounted ? 'animate-slide-up' : 'opacity-0'
                  )}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-brand-teal-400 to-brand-cyan shadow-lg">
                    <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
                    <span className="text-gradient-animated">Tasks</span>
                  </h1>
                </div>
                <p
                  className={cn(
                    'max-w-2xl text-text-secondary',
                    hasMounted ? 'stagger-1 animate-slide-up' : 'opacity-0'
                  )}
                >
                  Manage your AI-powered development tasks. Let intelligent agents help you plan,
                  implement, test, and review code changes.
                </p>

                {/* Task count summary with animated counters */}
                {totalCount > 0 && (
                  <div
                    className={cn(
                      'flex flex-wrap items-center gap-4 text-sm',
                      hasMounted ? 'stagger-2 animate-slide-up' : 'opacity-0'
                    )}
                  >
                    <div className="glass-subtle flex items-center gap-2 rounded-full px-3 py-1.5 shadow-sm">
                      <span className="text-text-muted">Total:</span>
                      <span className="font-semibold text-text-primary">
                        <AnimatedCounter
                          value={totalCount}
                          duration={800}
                          startAnimation={hasMounted}
                        />
                      </span>
                    </div>
                    {inProgressCount > 0 && (
                      <div className="glass-subtle flex items-center gap-2 rounded-full px-3 py-1.5 shadow-sm">
                        <div className="status-dot-premium status-working" />
                        <span className="text-text-muted">In Progress:</span>
                        <span className="font-semibold text-brand-cyan">
                          <AnimatedCounter
                            value={inProgressCount}
                            duration={800}
                            delay={100}
                            startAnimation={hasMounted}
                          />
                        </span>
                      </div>
                    )}
                    {completedCount > 0 && (
                      <div className="glass-subtle flex items-center gap-2 rounded-full px-3 py-1.5 shadow-sm">
                        <div className="status-dot-premium status-alive" />
                        <span className="text-text-muted">Completed:</span>
                        <span className="font-semibold text-success">
                          <AnimatedCounter
                            value={completedCount}
                            duration={800}
                            delay={200}
                            startAnimation={hasMounted}
                          />
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Create button with premium effect */}
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                leftIcon={<PlusIcon className="h-5 w-5" />}
                className={cn(
                  'group glow-teal-sm relative shrink-0 overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]',
                  hasMounted ? 'stagger-3 animate-slide-up' : 'opacity-0'
                )}
              >
                {/* Shine effect on hover */}
                <span
                  className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                  onAbort={onSpanAbort}
                />
                <span className="relative flex items-center gap-2">
                  <SparklesIcon className="h-4 w-4 transition-transform group-hover:rotate-12" />
                  New Task
                </span>
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
