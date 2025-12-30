import { useState } from 'react';
import { createLazyFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/layout/app-layout';
import { TaskList } from '@/components/tasks/task-list';
import { TaskForm } from '@/components/tasks/task-form';
import { PageHeader } from '@/components/layout/page-header';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useCreateTask } from '@/hooks/api';
import { addToast } from '@/lib/toast';
import type { TaskCreateFormData } from '@/lib/validators';

function TasksPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const createTaskMutation = useCreateTask();

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
        <PageHeader title="Tasks" description="Manage your AI-powered development tasks" />
        <TaskList onCreateTask={() => setIsCreateDialogOpen(true)} />
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Create a new AI-powered development task. The AI agents will help you plan,
              implement, test, and review your code changes.
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
