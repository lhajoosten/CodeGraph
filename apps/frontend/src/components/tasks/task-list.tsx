import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { TaskCard } from './task-card';
import { TaskFilters } from './task-filters';
import { Button } from '@/components/ui/button';
import { SkeletonCard } from '@/components/ui/skeleton';
import {
  NoDataEmptyState,
  NoSearchResultsEmptyState,
  ErrorEmptyState,
} from '@/components/layout/empty-state';
import { useTasks, useDeleteTask, useDisclosure, useDebounce } from '@/hooks';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { addToast } from '@/lib/toast';
import type { TaskStatus, TaskPriority } from '@/lib/guards';
import type { TaskResponse } from '@/openapi/types.gen';

interface TaskListProps {
  onCreateTask?: () => void;
  className?: string;
}

export function TaskList({ onCreateTask, className }: TaskListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const deleteConfirm = useDisclosure();

  // Fetch tasks with pagination (API doesn't support filtering yet)
  const { data: response, isLoading, error, refetch } = useTasks();

  // Apply client-side filtering
  const filteredTasks = useMemo(() => {
    const tasks = response?.items ?? [];

    return tasks.filter((task: TaskResponse) => {
      // Search filter
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(searchLower);
        const matchesDescription = task.description?.toLowerCase().includes(searchLower);
        if (!matchesTitle && !matchesDescription) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }

      return true;
    });
  }, [response?.items, debouncedSearch, statusFilter, priorityFilter]);

  const deleteMutation = useDeleteTask();

  const handleDeleteClick = (taskId: number) => {
    setTaskToDelete(taskId);
    deleteConfirm.open();
  };

  const handleDeleteConfirm = () => {
    if (taskToDelete) {
      deleteMutation.mutate(
        { path: { task_id: taskToDelete } },
        {
          onSuccess: () => {
            addToast({
              title: 'Task deleted',
              description: 'The task has been successfully deleted.',
              color: 'success',
            });
            deleteConfirm.close();
            setTaskToDelete(null);
          },
          onError: () => {
            addToast({
              title: 'Failed to delete task',
              description: 'Please try again.',
              color: 'danger',
            });
          },
        }
      );
    }
  };

  const hasActiveFilters = debouncedSearch || statusFilter !== 'all' || priorityFilter !== 'all';

  return (
    <div className={className}>
      {/* Header with filters */}
      <div className={`
        mb-6 flex flex-col gap-4
        sm:flex-row
      `}>
        <div className="flex-1">
          <TaskFilters
            search={search}
            onSearchChange={setSearch}
            status={statusFilter}
            onStatusChange={setStatusFilter}
            priority={priorityFilter}
            onPriorityChange={setPriorityFilter}
          />
        </div>
        {onCreateTask && (
          <Button onClick={onCreateTask} leftIcon={<Plus className="h-4 w-4" />}>
            New Task
          </Button>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className={`
          grid gap-4
          md:grid-cols-2
          lg:grid-cols-3
        `}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <ErrorEmptyState action={{ label: 'Try again', onClick: () => refetch() }} />
      )}

      {/* Empty states */}
      {!isLoading &&
        !error &&
        filteredTasks.length === 0 &&
        (hasActiveFilters ? (
          <NoSearchResultsEmptyState
            action={{
              label: 'Clear filters',
              onClick: () => {
                setSearch('');
                setStatusFilter('all');
                setPriorityFilter('all');
              },
            }}
          />
        ) : (
          <NoDataEmptyState
            title="No tasks yet"
            description="Get started by creating your first task."
            action={onCreateTask ? { label: 'Create Task', onClick: onCreateTask } : undefined}
          />
        ))}

      {/* Task grid */}
      {!isLoading && !error && filteredTasks.length > 0 && (
        <div className={`
          grid gap-4
          md:grid-cols-2
          lg:grid-cols-3
        `}>
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} onDelete={handleDeleteClick} />
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteConfirm.isOpen}
        onOpenChange={deleteConfirm.onOpenChange}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
