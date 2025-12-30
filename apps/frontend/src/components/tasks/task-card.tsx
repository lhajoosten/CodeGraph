import { Link } from '@tanstack/react-router';
import {
  EllipsisHorizontalIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
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

export function TaskCard({ task, onEdit, onDelete, className }: TaskCardProps) {
  return (
    <Card
      className={cn(
        `
          hover:border-primary/50 hover:shadow-card
          transition-all duration-200
        `,
        className
      )}
    >
      <CardHeader
        className={`
        flex flex-row items-start justify-between gap-4 pb-2
      `}
      >
        <div className="min-w-0 flex-1 space-y-1">
          <Link
            to="/tasks/$id"
            params={{ id: String(task.id) }}
            className={`
              text-text-primary line-clamp-1 text-lg font-semibold
              transition-colors
              hover:text-primary
            `}
          >
            {task.title}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <TaskStatusBadge status={task.status} size="sm" />
            {task.priority && <TaskPriorityBadge priority={task.priority} size="sm" />}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton
              variant="ghost"
              size="sm"
              icon={<EllipsisHorizontalIcon />}
              aria-label="Task actions"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to="/tasks/$id" params={{ id: String(task.id) }}>
                <EyeIcon className="mr-2 h-4 w-4" />
                View
              </Link>
            </DropdownMenuItem>
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(task.id)}>
                <PencilIcon className="mr-2 h-4 w-4" />
                Edit
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
        <CardContent className="py-2">
          <p className="text-text-secondary line-clamp-2 text-sm">
            {truncate(task.description, 150)}
          </p>
        </CardContent>
      )}

      <CardFooter className="text-text-secondary pt-2 text-xs">
        Updated {formatRelativeTime(task.updated_at)}
      </CardFooter>
    </Card>
  );
}
