import { Badge, type BadgeProps } from '@/components/ui/badge';
import { type TaskStatus, TASK_STATUS_LABELS, TASK_STATUS_VARIANTS } from '@/lib/guards';

interface TaskStatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: TaskStatus;
  showDot?: boolean;
}

export function TaskStatusBadge({ status, showDot = true, ...props }: TaskStatusBadgeProps) {
  return (
    <Badge variant={TASK_STATUS_VARIANTS[status]} dot={showDot} {...props}>
      {TASK_STATUS_LABELS[status]}
    </Badge>
  );
}
