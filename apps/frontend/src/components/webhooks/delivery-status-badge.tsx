import { Badge, type BadgeProps } from '@/components/ui/badge';
import { DELIVERY_STATUS_LABELS, DELIVERY_STATUS_VARIANTS } from '@/lib/webhook-constants';
import type { DeliveryStatus } from '@/openapi/types.gen';

interface DeliveryStatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: DeliveryStatus;
  showDot?: boolean;
}

export function DeliveryStatusBadge({
  status,
  showDot = true,
  ...props
}: DeliveryStatusBadgeProps) {
  return (
    <Badge variant={DELIVERY_STATUS_VARIANTS[status]} dot={showDot} {...props}>
      {DELIVERY_STATUS_LABELS[status]}
    </Badge>
  );
}
