import { useState } from 'react';
import { WebhookCard } from './webhook-card';
import { SkeletonCard } from '@/components/ui/skeleton';
import { NoDataEmptyState, ErrorEmptyState } from '@/components/layout/empty-state';
import { useFetchWebhooks } from '@/hooks/api/webhooks/queries/use-fetch-webhooks';
import { useDeleteWebhook } from '@/hooks/api/webhooks/mutations/use-delete-webhook';
import { useTestWebhook } from '@/hooks/api/webhooks/mutations/use-test-webhook';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import type { WebhookResponse } from '@/openapi/types.gen';
import { cn } from '@/lib/utils';

interface WebhookListProps {
  onCreateWebhook?: () => void;
  onEditWebhook?: (webhookId: number) => void;
  className?: string;
}

export function WebhookList({ onCreateWebhook, onEditWebhook, className }: WebhookListProps) {
  const [webhookToDelete, setWebhookToDelete] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: response, isLoading, error } = useFetchWebhooks();
  const deleteMutation = useDeleteWebhook();
  const testMutation = useTestWebhook();

  const webhooks = response?.items ?? [];

  const handleDeleteClick = (webhookId: number) => {
    setWebhookToDelete(webhookId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (webhookToDelete) {
      deleteMutation.mutate(
        { path: { webhook_id: webhookToDelete } },
        {
          onSuccess: () => {
            setDeleteDialogOpen(false);
            setWebhookToDelete(null);
          },
        }
      );
    }
  };

  const handleTest = (webhookId: number) => {
    testMutation.mutate({
      path: { webhook_id: webhookId },
      body: {},
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-3', className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <ErrorEmptyState
        title="Failed to Load Webhooks"
        description="An error occurred while loading webhooks. Please try again."
        className={className}
      />
    );
  }

  // Empty state
  if (webhooks.length === 0) {
    return (
      <NoDataEmptyState
        title="No Webhooks Yet"
        description="Create your first webhook to receive event notifications."
        action={onCreateWebhook ? { label: 'Create Webhook', onClick: onCreateWebhook } : undefined}
        className={className}
      />
    );
  }

  return (
    <>
      <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-3', className)}>
        {webhooks.map((webhook: WebhookResponse) => (
          <WebhookCard
            key={webhook.id}
            webhook={webhook}
            onEdit={onEditWebhook}
            onDelete={handleDeleteClick}
            onTest={handleTest}
          />
        ))}
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Webhook"
        description="Are you sure you want to delete this webhook? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
