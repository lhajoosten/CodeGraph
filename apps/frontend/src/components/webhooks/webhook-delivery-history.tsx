import { useState } from 'react';
import { EyeIcon, ClockIcon, ArrowPathIcon, BoltIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { DeliveryStatusBadge } from './delivery-status-badge';
import { WebhookDeliveryDetail } from './webhook-delivery-detail';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SkeletonCard } from '@/components/ui/skeleton';
import { ErrorEmptyState } from '@/components/layout/empty-state';
import { useFetchWebhookDeliveries } from '@/hooks/api/webhooks/queries/use-fetch-webhook-deliveries';
import { formatRelativeTime } from '@/lib/formatters';
import { WEBHOOK_EVENT_LABELS } from '@/lib/webhook-constants';
import type { WebhookDeliveryResponse } from '@/openapi/types.gen';
import { cn } from '@/lib/utils';

interface WebhookDeliveryHistoryProps {
  webhookId: number;
  className?: string;
}

const statusAccentColors: Record<string, string> = {
  success: 'border-l-success',
  failed: 'border-l-error',
  pending: 'border-l-warning',
  retrying: 'border-l-blue-500',
};

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
      <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border-secondary bg-surface-secondary/30 p-8">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-subtle">
          <BoltIcon className="h-7 w-7 text-brand-teal" />
        </div>
        <p className="mb-1 text-sm font-medium text-text-primary">No Deliveries Yet</p>
        <p className="text-center text-sm text-text-muted">
          Webhook deliveries will appear here once events are triggered.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={cn('space-y-2', className)}>
        {deliveries.map((delivery: WebhookDeliveryResponse, index: number) => (
          <div
            key={delivery.id}
            className={cn(
              'hc-skel-item group relative flex items-center justify-between overflow-hidden rounded-lg border border-border-primary',
              'border-l-4 bg-surface p-4 transition-all duration-200',
              'hover:border-brand-teal/30 hover:shadow-card-hover',
              statusAccentColors[delivery.status] || 'border-l-brand-teal'
            )}
            style={{ animationDelay: `${index * 30}ms` }}
          >
            {/* Hover gradient */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-brand-teal/0 to-brand-cyan/0 opacity-0 transition-opacity duration-200 group-hover:from-brand-teal/5 group-hover:to-brand-cyan/5 group-hover:opacity-100" />

            <div className="relative flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <DeliveryStatusBadge status={delivery.status} size="sm" />
                <span className="text-sm font-semibold text-text-primary">
                  {WEBHOOK_EVENT_LABELS[delivery.event_type] || delivery.event_type}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
                <span className="flex items-center gap-1">
                  <ArrowPathIcon className="h-3.5 w-3.5" />
                  Attempt {delivery.attempt_count}
                </span>
                {delivery.response_status && (
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 font-mono font-medium',
                      delivery.response_status >= 200 && delivery.response_status < 300
                        ? 'bg-success-bg text-success'
                        : delivery.response_status >= 400
                          ? 'bg-error-bg text-error'
                          : 'bg-warning-bg text-warning'
                    )}
                  >
                    HTTP {delivery.response_status}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <ClockIcon className="h-3.5 w-3.5" />
                  {formatRelativeTime(delivery.created_at)}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewDetail(delivery.id)}
              className="relative opacity-0 transition-opacity group-hover:opacity-100"
            >
              <EyeIcon className="mr-2 h-4 w-4" />
              Details
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BoltIcon className="h-5 w-5 text-brand-teal" />
              Delivery Details
            </DialogTitle>
          </DialogHeader>
          {selectedDeliveryId && (
            <WebhookDeliveryDetail webhookId={webhookId} deliveryId={selectedDeliveryId} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
