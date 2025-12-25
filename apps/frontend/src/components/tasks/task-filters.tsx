import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IconButton } from '@/components/ui/icon-button';
import {
  type TaskStatus,
  type TaskPriority,
  TASK_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
} from '@/lib/guards';
import { cn } from '@/lib/utils';

interface TaskFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: TaskStatus | 'all';
  onStatusChange: (value: TaskStatus | 'all') => void;
  priority: TaskPriority | 'all';
  onPriorityChange: (value: TaskPriority | 'all') => void;
  className?: string;
}

export function TaskFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  className,
}: TaskFiltersProps) {
  return (
    <div className={cn(`
      flex flex-col gap-3
      sm:flex-row
    `, className)}>
      {/* Search input */}
      <div className="relative flex-1">
        <Input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          rightIcon={
            search ? (
              <IconButton
                variant="ghost"
                size="xs"
                icon={<X />}
                aria-label="Clear search"
                onClick={() => onSearchChange('')}
              />
            ) : undefined
          }
          className="w-full"
        />
      </div>

      {/* Status filter */}
      <Select value={status} onValueChange={(value) => onStatusChange(value as TaskStatus | 'all')}>
        <SelectTrigger className={`
          w-full
          sm:w-[160px]
        `}>
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
        value={priority}
        onValueChange={(value) => onPriorityChange(value as TaskPriority | 'all')}
      >
        <SelectTrigger className={`
          w-full
          sm:w-[140px]
        `}>
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
  );
}
