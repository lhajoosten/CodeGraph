import { useState, useMemo } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, FunnelIcon, PlusIcon } from '@heroicons/react/24/outline';
import { TaskCard } from './task-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IconButton } from '@/components/ui/icon-button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SkeletonCard } from '@/components/ui/skeleton';
import { NoSearchResultsEmptyState, ErrorEmptyState } from '@/components/layout/empty-state';
import { useTasks, useDeleteTask, useDisclosure, useDebounce } from '@/hooks';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { addToast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import {
  type TaskStatus,
  type TaskPriority,
  TASK_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
} from '@/lib/guards';
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
  const activeFilterCount =
    (debouncedSearch ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (priorityFilter !== 'all' ? 1 : 0);

  const clearAllFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPriorityFilter('all');
  };

  return (
    <div className={className}>
      {/* Enhanced Filter Bar */}
      <div
        className={cn(
          'mb-6 rounded-xl border border-border-subtle bg-surface p-4',
          'shadow-card transition-shadow hover:shadow-card-hover'
        )}
      >
        <div className="flex flex-col gap-4">
          {/* Search and filters row */}
          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Search input with icon */}
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Search tasks by title or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
                rightIcon={
                  search ? (
                    <IconButton
                      variant="ghost"
                      size="xs"
                      icon={<XMarkIcon />}
                      aria-label="Clear search"
                      onClick={() => setSearch('')}
                    />
                  ) : undefined
                }
                className="w-full"
              />
            </div>

            {/* Status filter */}
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as TaskStatus | 'all')}
            >
              <SelectTrigger
                className={cn(
                  'w-full sm:w-[180px]',
                  statusFilter !== 'all' && 'border-primary/50 bg-primary-subtle'
                )}
              >
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {TASK_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {TASK_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Priority filter */}
            <Select
              value={priorityFilter}
              onValueChange={(value) => setPriorityFilter(value as TaskPriority | 'all')}
            >
              <SelectTrigger
                className={cn(
                  'w-full sm:w-[160px]',
                  priorityFilter !== 'all' && 'border-primary/50 bg-primary-subtle'
                )}
              >
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {TASK_PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {TASK_PRIORITY_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active filters indicator */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <FunnelIcon className="h-4 w-4" />
                <span>
                  {activeFilterCount} active {activeFilterCount === 1 ? 'filter' : 'filters'}
                </span>
                {filteredTasks.length > 0 && (
                  <span className="text-text-muted">
                    · {filteredTasks.length} {filteredTasks.length === 1 ? 'result' : 'results'}
                  </span>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Clear all
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div
          className={cn(
            'grid gap-5',
            'sm:grid-cols-2',
            'lg:grid-cols-3',
            'xl:grid-cols-3',
            '2xl:grid-cols-4'
          )}
        >
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
      {!isLoading && !error && filteredTasks.length === 0 && (
        <>
          {hasActiveFilters ? (
            <NoSearchResultsEmptyState
              action={{
                label: 'Clear filters',
                onClick: clearAllFilters,
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border-subtle bg-surface py-16 text-center">
              <div className="mb-6 rounded-full bg-primary-subtle p-6">
                <PlusIcon className="h-12 w-12 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-text-primary">No tasks yet</h3>
              <p className="mb-6 max-w-sm text-text-secondary">
                Get started by creating your first AI-powered development task. Agents will help you
                bring your ideas to life.
              </p>
              {onCreateTask && (
                <Button onClick={onCreateTask} leftIcon={<PlusIcon className="h-5 w-5" />}>
                  Create Your First Task
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {/* Task grid with responsive columns */}
      {!isLoading && !error && filteredTasks.length > 0 && (
        <div
          className={cn(
            'grid gap-5',
            'sm:grid-cols-2',
            'lg:grid-cols-3',
            'xl:grid-cols-3',
            '2xl:grid-cols-4'
          )}
        >
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
        description="Are you sure you want to delete this task? This action cannot be undone and all associated data will be permanently removed."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
