import { Badge, type BadgeProps } from '@/components/ui/badge';
import {
  type AgentStatus,
  type AgentType,
  AGENT_TYPE_LABELS,
  AGENT_STATUS_VARIANTS,
} from '@/lib/guards';

interface AgentStatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: AgentStatus;
}

export function AgentStatusBadge({ status, ...props }: AgentStatusBadgeProps) {
  const statusLabels: Record<AgentStatus, string> = {
    idle: 'Idle',
    running: 'Running',
    completed: 'Completed',
    failed: 'Failed',
  };

  return (
    <Badge variant={AGENT_STATUS_VARIANTS[status]} dot {...props}>
      {statusLabels[status]}
    </Badge>
  );
}

interface AgentTypeBadgeProps extends Omit<BadgeProps, 'variant'> {
  type: AgentType;
}

export function AgentTypeBadge({ type, ...props }: AgentTypeBadgeProps) {
  return (
    <Badge variant="outline" {...props}>
      {AGENT_TYPE_LABELS[type]}
    </Badge>
  );
}
