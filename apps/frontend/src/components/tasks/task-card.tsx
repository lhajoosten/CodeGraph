import { Link } from '@tanstack/react-router';
import { MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react';
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
          transition-all duration-200
          hover:border-primary/50 hover:shadow-card
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
              line-clamp-1 text-lg font-semibold text-text-primary
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
              icon={<MoreHorizontal />}
              aria-label="Task actions"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to="/tasks/$id" params={{ id: String(task.id) }}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </Link>
            </DropdownMenuItem>
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(task.id)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(task.id)} destructive>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      {task.description && (
        <CardContent className="py-2">
          <p className="line-clamp-2 text-sm text-text-secondary">
            {truncate(task.description, 150)}
          </p>
        </CardContent>
      )}

      <CardFooter className="pt-2 text-xs text-text-tertiary">
        Updated {formatRelativeTime(task.updated_at)}
      </CardFooter>
    </Card>
  );
}
