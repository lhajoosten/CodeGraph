import { Link } from '@tanstack/react-router';
import {
  EllipsisHorizontalIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ClockIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TaskStatusBadge } from './task-status-badge';
import { TaskPriorityBadge } from './task-priority-badge';
import { formatRelativeTime, truncate } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { TaskStatus, TaskPriority } from '@/lib/guards';

interface TaskCardProps {
  task: {
    id: number;
    title: string;
    description?: string | null;
    status: TaskStatus;
    priority?: TaskPriority;
    created_at: string;
    updated_at: string;
  };
  onEdit?: (taskId: number) => void;
  onDelete?: (taskId: number) => void;
  className?: string;
}

// Status color mapping for left border accent
const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: 'before:from-warning before:to-warning/70',
  planning: 'before:from-info before:to-info/70',
  in_progress: 'before:from-brand-cyan before:to-brand-teal-400',
  testing: 'before:from-info before:to-brand-cyan/70',
  reviewing: 'before:from-info before:to-brand-teal-400',
  completed: 'before:from-success before:to-success/70',
  failed: 'before:from-error before:to-error/70',
  cancelled: 'before:from-text-muted before:to-text-secondary',
};

// Priority color mapping for indicator dots
const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-text-muted',
  medium: 'bg-info',
  high: 'bg-warning',
  urgent: 'bg-error',
};

export function TaskCard({ task, onEdit, onDelete, className }: TaskCardProps) {
  const statusColorClass = STATUS_COLORS[task.status] || STATUS_COLORS.pending;

  return (
    <Card
      className={cn(
        // Base styles
        'group relative overflow-hidden',
        'border-accent-left',
        statusColorClass,
        // Interactive hover effects
        'interactive cursor-pointer',
        'hover:border-primary/30 hover:shadow-card-hover',
        'transition-all duration-200',
        className
      )}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="bg-gradient-teal-subtle absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-30" />

      <CardHeader className="relative flex flex-row items-start justify-between gap-3 pb-3">
        <div className="min-w-0 flex-1 space-y-2">
          {/* Task title with link */}
          <Link
            to="/tasks/$id"
            params={{ id: String(task.id) }}
            className={cn(
              'line-clamp-2 block text-lg leading-tight font-semibold text-text-primary',
              'focus-ring transition-colors hover:text-primary'
            )}
          >
            {task.title}
          </Link>

          {/* Status and priority badges */}
          <div className="flex flex-wrap items-center gap-2">
            <TaskStatusBadge status={task.status} size="sm" />
            {task.priority && <TaskPriorityBadge priority={task.priority} size="sm" />}
          </div>
        </div>

        {/* Actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton
              variant="ghost"
              size="sm"
              icon={<EllipsisHorizontalIcon />}
              aria-label="Task actions"
              className="relative z-10 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link to="/tasks/$id" params={{ id: String(task.id) }}>
                <EyeIcon className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(task.id)}>
                <PencilIcon className="mr-2 h-4 w-4" />
                Edit Task
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(task.id)} destructive>
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      {task.description && (
        <CardContent className="relative py-3">
          <p className="line-clamp-2 text-sm leading-relaxed text-text-secondary">
            {truncate(task.description, 120)}
          </p>
        </CardContent>
      )}

      <CardFooter
        className={cn(
          'relative flex items-center justify-between gap-3 pt-3',
          !task.description && 'pt-0'
        )}
      >
        {/* Last updated timestamp */}
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <ClockIcon className="h-3.5 w-3.5" />
          <span>Updated {formatRelativeTime(task.updated_at)}</span>
        </div>

        {/* Priority indicator dot (visual redundancy) */}
        {task.priority && (
          <div className="flex items-center gap-1.5">
            <div
              className={cn('h-2 w-2 rounded-full', PRIORITY_COLORS[task.priority])}
              title={`${task.priority} priority`}
            />
          </div>
        )}
      </CardFooter>

      {/* AI-powered indicator (subtle badge in corner) */}
      <div className="absolute top-3 right-3 opacity-0 transition-opacity group-hover:opacity-100">
        <div
          className="flex items-center gap-1 rounded-full bg-primary-subtle px-2 py-1 text-xs text-primary"
          title="AI-powered task"
        >
          <SparklesIcon className="h-3 w-3" />
          <span className="font-medium">AI</span>
        </div>
      </div>
    </Card>
  );
}
