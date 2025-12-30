import { Badge, type BadgeProps } from '@/components/ui/badge';
import { WEBHOOK_STATUS_LABELS, WEBHOOK_STATUS_VARIANTS } from '@/lib/webhook-constants';
import type { WebhookStatus } from '@/openapi/types.gen';

interface WebhookStatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: WebhookStatus;
  showDot?: boolean;
}

export function WebhookStatusBadge({ status, showDot = true, ...props }: WebhookStatusBadgeProps) {
  return (
    <Badge variant={WEBHOOK_STATUS_VARIANTS[status]} dot={showDot} {...props}>
      {WEBHOOK_STATUS_LABELS[status]}
    </Badge>
  );
}
