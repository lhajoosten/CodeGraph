import { createLazyFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { PencilIcon, TrashIcon, KeyIcon } from '@heroicons/react/24/outline';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { WebhookStatusBadge } from '@/components/webhooks/webhook-status-badge';
import { WebhookTestButton } from '@/components/webhooks/webhook-test-button';
import { WebhookDeliveryHistory } from '@/components/webhooks/webhook-delivery-history';
import { WebhookSecretDisplay } from '@/components/webhooks/webhook-secret-display';
import { WebhookForm } from '@/components/webhooks/webhook-form';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useFetchWebhook } from '@/hooks/api/webhooks/queries/use-fetch-webhook';
import { useUpdateWebhook } from '@/hooks/api/webhooks/mutations/use-update-webhook';
import { useDeleteWebhook } from '@/hooks/api/webhooks/mutations/use-delete-webhook';
import { useRegenerateWebhookSecret } from '@/hooks/api/webhooks/mutations/use-regenerate-webhook-secret';
import { formatDateTime } from '@/lib/formatters';
import { WEBHOOK_EVENT_LABELS } from '@/lib/webhook-constants';
import type { WebhookUpdate } from '@/openapi/types.gen';

export const Route = createLazyFileRoute('/_protected/webhooks/$id')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const webhookId = parseInt(id, 10);
  const navigate = Route.useNavigate();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [secretDialogOpen, setSecretDialogOpen] = useState(false);

  const { data: webhook, isLoading, error } = useFetchWebhook(webhookId);
  const updateMutation = useUpdateWebhook();
  const deleteMutation = useDeleteWebhook();
  const regenerateMutation = useRegenerateWebhookSecret();

  const handleUpdate = (data: WebhookUpdate) => {
    updateMutation.mutate(
      {
        path: { webhook_id: webhookId },
        body: data,
      },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
        },
      }
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(
      { path: { webhook_id: webhookId } },
      {
        onSuccess: () => {
          navigate({ to: '/webhooks' });
        },
      }
    );
  };

  const handleRegenerateSecret = () => {
    regenerateMutation.mutate(
      { path: { webhook_id: webhookId } },
      {
        onSuccess: (data) => {
          setNewSecret(data.secret || null);
          setRegenerateDialogOpen(false);
          setSecretDialogOpen(true);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-[400px] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  if (error || !webhook) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-2xl font-semibold">Webhook Not Found</h2>
          <p className="mt-2 text-text-muted-lum">
            The webhook you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to
            it.
          </p>
          <Button onClick={() => navigate({ to: '/webhooks' })} className="mt-4">
            Back to Webhooks
          </Button>
        </div>
      </AppLayout>
    );
  }

  const totalDeliveries = webhook.success_count + webhook.failure_count;
  const successRate =
    totalDeliveries > 0 ? ((webhook.success_count / totalDeliveries) * 100).toFixed(1) : '0';

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{webhook.name}</h1>
            <p className="font-mono text-sm text-text-muted-lum">{webhook.url}</p>
          </div>
          <div className="flex gap-2">
            <WebhookTestButton
              webhookId={webhookId}
              availableEvents={webhook.events}
              variant="outline"
            />
            <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              <PencilIcon className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(true)}>
              <TrashIcon className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Webhook Info */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-text-muted-lum">Status</p>
                <WebhookStatusBadge status={webhook.status} className="mt-1" />
              </div>
              <div>
                <p className="text-sm text-text-muted-lum">Retry Count</p>
                <p className="mt-1 font-medium">{webhook.retry_count}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted-lum">Timeout</p>
                <p className="mt-1 font-medium">{webhook.timeout_seconds}s</p>
              </div>
              <div>
                <p className="text-sm text-text-muted-lum">Success Rate</p>
                <p className="mt-1 font-medium">{successRate}%</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-text-muted-lum">Subscribed Events</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {webhook.events.includes('*') ? (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    All Events
                  </span>
                ) : (
                  webhook.events.map((event) => (
                    <span
                      key={event}
                      className="rounded-full bg-bg-elevated-lum px-3 py-1 text-xs font-medium"
                    >
                      {WEBHOOK_EVENT_LABELS[event] || event}
                    </span>
                  ))
                )}
              </div>
            </div>

            {webhook.headers && Object.keys(webhook.headers).length > 0 && (
              <div>
                <p className="text-sm text-text-muted-lum">Custom Headers</p>
                <div className="mt-2 space-y-1">
                  {Object.entries(webhook.headers).map(([key, value]) => (
                    <div key={key} className="flex gap-2 text-sm">
                      <span className="font-medium">{key}:</span>
                      <span className="text-text-muted-lum">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm text-text-muted-lum">Webhook Secret</p>
                <Button variant="ghost" size="sm" onClick={() => setRegenerateDialogOpen(true)}>
                  <KeyIcon className="mr-2 h-4 w-4" />
                  Regenerate Secret
                </Button>
              </div>
              <p className="text-xs text-text-muted-lum">
                Secret is not shown for security. Regenerate if needed.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-text-muted-lum">Created</p>
                <p className="font-medium">{formatDateTime(webhook.created_at)}</p>
              </div>
              <div>
                <p className="text-text-muted-lum">Updated</p>
                <p className="font-medium">{formatDateTime(webhook.updated_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery History */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery History</CardTitle>
          </CardHeader>
          <CardContent>
            <WebhookDeliveryHistory webhookId={webhookId} />
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Webhook</DialogTitle>
          </DialogHeader>
          <WebhookForm
            initialData={webhook}
            onSubmit={handleUpdate}
            isLoading={updateMutation.isPending}
            submitLabel="Update Webhook"
            showStatus
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Webhook"
        description="Are you sure you want to delete this webhook? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />

      {/* Regenerate Secret Confirmation */}
      <ConfirmDialog
        open={regenerateDialogOpen}
        onOpenChange={setRegenerateDialogOpen}
        title="Regenerate Secret"
        description="Are you sure you want to regenerate the webhook secret? The old secret will stop working immediately."
        confirmLabel="Regenerate"
        onConfirm={handleRegenerateSecret}
        isLoading={regenerateMutation.isPending}
      />

      {/* New Secret Display */}
      <Dialog open={secretDialogOpen} onOpenChange={setSecretDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Webhook Secret</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-text-muted-lum">
              Your new webhook secret has been generated. Make sure to save it now - you won&apos;t
              be able to see it again!
            </p>
            {newSecret && <WebhookSecretDisplay secret={newSecret} />}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
