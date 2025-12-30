import { DeliveryStatusBadge } from './delivery-status-badge';
import { SkeletonCard } from '@/components/ui/skeleton';
import { ErrorEmptyState } from '@/components/layout/empty-state';
import { useFetchWebhookDelivery } from '@/hooks/api/webhooks/queries/use-fetch-webhook-delivery';
import { formatDateTime } from '@/lib/formatters';
import { WEBHOOK_EVENT_LABELS } from '@/lib/webhook-constants';
import { cn } from '@/lib/utils';

interface WebhookDeliveryDetailProps {
  webhookId: number;
  deliveryId: number;
  className?: string;
}

export function WebhookDeliveryDetail({
  webhookId,
  deliveryId,
  className,
}: WebhookDeliveryDetailProps) {
  const { data: delivery, isLoading, error } = useFetchWebhookDelivery(webhookId, deliveryId);

  if (isLoading) {
    return <SkeletonCard className="h-64" />;
  }

  if (error || !delivery) {
    return (
      <ErrorEmptyState
        title="Failed to Load Delivery"
        description="An error occurred while loading delivery details."
      />
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Status and Event Info */}
      <div className="space-y-3 rounded-lg border border-border-steel bg-bg-steel p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Status</h3>
          <DeliveryStatusBadge status={delivery.status} />
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-text-muted-lum">Event Type</p>
            <p className="font-medium">
              {WEBHOOK_EVENT_LABELS[delivery.event_type] || delivery.event_type}
            </p>
          </div>
          <div>
            <p className="text-text-muted-lum">Event ID</p>
            <p className="font-mono text-xs">{delivery.event_id}</p>
          </div>
          <div>
            <p className="text-text-muted-lum">Attempt Count</p>
            <p className="font-medium">{delivery.attempt_count}</p>
          </div>
          <div>
            <p className="text-text-muted-lum">Response Status</p>
            <p className="font-medium">
              {delivery.response_status ? `HTTP ${delivery.response_status}` : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Timestamps */}
      <div className="space-y-2 rounded-lg border border-border-steel bg-bg-steel p-4">
        <h3 className="font-semibold">Timestamps</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-text-muted-lum">Created</p>
            <p className="font-medium">{formatDateTime(delivery.created_at)}</p>
          </div>
          {delivery.delivered_at && (
            <div>
              <p className="text-text-muted-lum">Delivered</p>
              <p className="font-medium">{formatDateTime(delivery.delivered_at)}</p>
            </div>
          )}
          {delivery.next_retry_at && (
            <div>
              <p className="text-text-muted-lum">Next Retry</p>
              <p className="font-medium">{formatDateTime(delivery.next_retry_at)}</p>
            </div>
          )}
          {delivery.duration_ms && (
            <div>
              <p className="text-text-muted-lum">Duration</p>
              <p className="font-medium">{delivery.duration_ms}ms</p>
            </div>
          )}
        </div>
      </div>

      {/* Response */}
      {delivery.response_body && (
        <div className="space-y-2 rounded-lg border border-border-steel bg-bg-steel p-4">
          <h3 className="font-semibold">Response Body</h3>
          <pre className="max-h-64 overflow-auto rounded bg-bg-elevated-lum p-3 font-mono text-xs">
            {delivery.response_body}
          </pre>
        </div>
      )}

      {/* Error */}
      {delivery.error_message && (
        <div className="space-y-2 rounded-lg border border-error bg-error/10 p-4">
          <h3 className="font-semibold text-error">Error Message</h3>
          <p className="text-sm text-error">{delivery.error_message}</p>
        </div>
      )}
    </div>
  );
}
