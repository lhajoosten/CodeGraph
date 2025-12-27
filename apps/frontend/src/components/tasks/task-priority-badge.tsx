import { Badge, type BadgeProps } from '@/components/ui/badge';
import { type TaskPriority, TASK_PRIORITY_LABELS, TASK_PRIORITY_VARIANTS } from '@/lib/guards';

interface TaskPriorityBadgeProps extends Omit<BadgeProps, 'variant'> {
  priority: TaskPriority;
}

export function TaskPriorityBadge({ priority, ...props }: TaskPriorityBadgeProps) {
  return (
    <Badge variant={TASK_PRIORITY_VARIANTS[priority]} {...props}>
      {TASK_PRIORITY_LABELS[priority]}
    </Badge>
  );
}
