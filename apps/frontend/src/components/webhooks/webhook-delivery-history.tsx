import { useState } from 'react';
import { EyeIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { DeliveryStatusBadge } from './delivery-status-badge';
import { WebhookDeliveryDetail } from './webhook-delivery-detail';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SkeletonCard } from '@/components/ui/skeleton';
import { NoDataEmptyState, ErrorEmptyState } from '@/components/layout/empty-state';
import { useFetchWebhookDeliveries } from '@/hooks/api/webhooks/queries/use-fetch-webhook-deliveries';
import { formatRelativeTime } from '@/lib/formatters';
import { WEBHOOK_EVENT_LABELS } from '@/lib/webhook-constants';
import type { WebhookDeliveryResponse } from '@/openapi/types.gen';
import { cn } from '@/lib/utils';

interface WebhookDeliveryHistoryProps {
  webhookId: number;
  className?: string;
}

export function WebhookDeliveryHistory({ webhookId, className }: WebhookDeliveryHistoryProps) {
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<number | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const { data: response, isLoading, error } = useFetchWebhookDeliveries(webhookId);

  const deliveries = response?.items ?? [];

  const handleViewDetail = (deliveryId: number) => {
    setSelectedDeliveryId(deliveryId);
    setDetailDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} className="h-16" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorEmptyState
        title="Failed to Load Deliveries"
        description="An error occurred while loading delivery history."
        className={className}
      />
    );
  }

  if (deliveries.length === 0) {
    return (
      <NoDataEmptyState
        title="No Deliveries Yet"
        description="Webhook deliveries will appear here once events are triggered."
        className={className}
      />
    );
  }

  return (
    <>
      <div className={cn('space-y-2', className)}>
        {deliveries.map((delivery: WebhookDeliveryResponse) => (
          <div
            key={delivery.id}
            className={`
              flex items-center justify-between rounded-lg border border-border-primary
              bg-surface-secondary p-4 transition-colors
              hover:bg-surface
            `}
          >
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <DeliveryStatusBadge status={delivery.status} size="sm" />
                <span className="text-sm font-medium text-text-primary">
                  {WEBHOOK_EVENT_LABELS[delivery.event_type] || delivery.event_type}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-text-muted">
                <span>Attempt {delivery.attempt_count}</span>
                {delivery.response_status && <span>HTTP {delivery.response_status}</span>}
                <span>{formatRelativeTime(delivery.created_at)}</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleViewDetail(delivery.id)}>
              <EyeIcon className="mr-2 h-4 w-4" />
              View
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Delivery Details</DialogTitle>
          </DialogHeader>
          {selectedDeliveryId && (
            <WebhookDeliveryDetail webhookId={webhookId} deliveryId={selectedDeliveryId} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
