import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import {
  PencilIcon,
  TrashIcon,
  KeyIcon,
  ArrowLeftIcon,
  BoltIcon,
  ClockIcon,
  CalendarIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';
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
import { formatDateTime, formatDate } from '@/lib/formatters';
import { WEBHOOK_EVENT_LABELS } from '@/lib/webhook-constants';
import { cn } from '@/lib/utils';
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
        <div className="container mx-auto max-w-7xl px-4 py-6">
          {/* Hero Skeleton */}
          <div className="bg-gradient-teal mb-8 overflow-hidden rounded-2xl p-8">
            <Skeleton className="mb-4 h-8 w-32 bg-white/20" />
            <Skeleton className="mb-4 h-10 w-3/4 bg-white/30" />
            <div className="flex gap-3">
              <Skeleton className="h-6 w-24 bg-white/20" />
              <Skeleton className="h-6 w-24 bg-white/20" />
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <SkeletonText lines={4} />
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <SkeletonText lines={6} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !webhook) {
    return (
      <AppLayout>
        <div className="container mx-auto max-w-7xl px-4 py-6">
          <div className="flex h-[400px] flex-col items-center justify-center gap-6 rounded-2xl border border-border bg-surface/50 backdrop-blur">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-error-bg">
              <div className="h-10 w-10 text-error">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-bold text-text-primary">Webhook Not Found</h2>
              <p className="text-text-secondary">
                The webhook you&rsquo;re looking for doesn&rsquo;t exist or has been deleted.
              </p>
            </div>
            <Button asChild variant="default" className="shadow-button-hover">
              <Link to="/webhooks">
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Back to Webhooks
              </Link>
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const totalDeliveries = webhook.success_count + webhook.failure_count;
  const successRate =
    totalDeliveries > 0 ? ((webhook.success_count / totalDeliveries) * 100).toFixed(1) : '100';

  const breadcrumbItems = [
    { label: 'Webhooks', onClick: () => navigate({ to: '/webhooks' }) },
    { label: webhook.name },
  ];

  return (
    <AppLayout>
      <div className="container mx-auto max-w-7xl px-4 py-6">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumbs items={breadcrumbItems} className="mb-4" />
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-teal relative mb-8 overflow-hidden rounded-2xl p-8 shadow-elevated">
          {/* Noise texture */}
          <div className="noise absolute inset-0" />

          <div className="relative z-10">
            {/* Back Button */}
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="mb-4 border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/20"
            >
              <Link to="/webhooks">
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Back to Webhooks
              </Link>
            </Button>

            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              {/* Title and Badges */}
              <div className="flex-1">
                <h1 className="mb-2 text-4xl font-bold text-white drop-shadow-lg">
                  {webhook.name}
                </h1>
                <div className="mb-4 rounded-lg bg-white/10 p-2 backdrop-blur">
                  <code className="font-mono text-sm text-white/90">{webhook.url}</code>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <WebhookStatusBadge status={webhook.status} />
                  <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium text-white backdrop-blur">
                    <BoltIcon className="h-4 w-4" />
                    <span>
                      {webhook.events.includes('*')
                        ? 'All Events'
                        : `${webhook.events.length} events`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium text-white backdrop-blur">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Created {formatDate(webhook.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <WebhookTestButton
                  webhookId={webhookId}
                  availableEvents={webhook.events}
                  variant="outline"
                  className="border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/20"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/20"
                  onClick={() => setEditDialogOpen(true)}
                >
                  <PencilIcon className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="bg-error/90 text-white hover:bg-error"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Subscribed Events Card */}
            <Card className="hc-skel-item border-accent-top shadow-card">
              <CardHeader>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
                  <BoltIcon className="h-5 w-5 text-brand-teal" />
                  Subscribed Events
                </h2>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {webhook.events.includes('*') ? (
                    <span className="bg-gradient-teal rounded-full px-4 py-1.5 text-sm font-medium text-white shadow-button">
                      All Events
                    </span>
                  ) : (
                    webhook.events.map((event) => (
                      <span
                        key={event}
                        className="rounded-full border border-border-primary bg-surface-secondary px-3 py-1 text-sm font-medium text-text-primary"
                      >
                        {WEBHOOK_EVENT_LABELS[event] || event}
                      </span>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Custom Headers Card */}
            {webhook.headers && Object.keys(webhook.headers).length > 0 && (
              <Card
                className="hc-skel-item border-accent-left shadow-card"
                style={{ animationDelay: '50ms' }}
              >
                <CardHeader>
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
                    <DocumentTextIcon className="h-5 w-5 text-brand-cyan" />
                    Custom Headers
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 rounded-lg bg-surface-secondary/50 p-4">
                    {Object.entries(webhook.headers).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 font-mono text-sm">
                        <span className="font-semibold text-brand-teal">{key}:</span>
                        <span className="text-text-secondary">{value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Delivery History Card */}
            <Card className="hc-skel-item shadow-card" style={{ animationDelay: '100ms' }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
                    <ClockIcon className="h-5 w-5 text-blue-500" />
                    Delivery History
                  </h2>
                  {totalDeliveries > 0 && (
                    <span className="rounded-full bg-surface-secondary px-2.5 py-0.5 text-xs font-medium text-text-muted">
                      {totalDeliveries} deliveries
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <WebhookDeliveryHistory webhookId={webhookId} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats Card */}
            <Card className="hc-skel-item border-accent-left shadow-card">
              <CardHeader>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
                  <Cog6ToothIcon className="h-5 w-5 text-brand-cyan" />
                  Configuration
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status */}
                <div className="group">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="status-dot status-ready" />
                    <p className="text-xs font-medium tracking-wide text-text-muted uppercase">
                      Status
                    </p>
                  </div>
                  <div className="ml-5">
                    <WebhookStatusBadge status={webhook.status} />
                  </div>
                </div>

                <div className="divider" />

                {/* Retry Count */}
                <div className="group">
                  <div className="mb-2 flex items-center gap-2">
                    <ArrowPathIcon className="h-4 w-4 text-text-muted" />
                    <p className="text-xs font-medium tracking-wide text-text-muted uppercase">
                      Retry Count
                    </p>
                  </div>
                  <p className="ml-6 text-sm font-medium text-text-primary">
                    {webhook.retry_count} attempts
                  </p>
                </div>

                <div className="divider" />

                {/* Timeout */}
                <div className="group">
                  <div className="mb-2 flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 text-text-muted" />
                    <p className="text-xs font-medium tracking-wide text-text-muted uppercase">
                      Timeout
                    </p>
                  </div>
                  <p className="ml-6 text-sm font-medium text-text-primary">
                    {webhook.timeout_seconds} seconds
                  </p>
                </div>

                <div className="divider" />

                {/* Last Updated */}
                <div className="group">
                  <div className="mb-2 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-text-muted" />
                    <p className="text-xs font-medium tracking-wide text-text-muted uppercase">
                      Last Updated
                    </p>
                  </div>
                  <p className="ml-6 text-sm font-medium text-text-primary">
                    {formatDateTime(webhook.updated_at)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Stats Card */}
            <Card className="hc-skel-item shadow-card" style={{ animationDelay: '50ms' }}>
              <CardHeader>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
                  <svg
                    className="h-5 w-5 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                    />
                  </svg>
                  Delivery Stats
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-success-bg p-3 text-center">
                    <CheckCircleIcon className="mx-auto h-5 w-5 text-success" />
                    <p className="mt-1 text-2xl font-bold text-success">{webhook.success_count}</p>
                    <p className="text-xs text-success/80">Successful</p>
                  </div>
                  <div className="rounded-lg bg-error-bg p-3 text-center">
                    <XCircleIcon className="mx-auto h-5 w-5 text-error" />
                    <p className="mt-1 text-2xl font-bold text-error">{webhook.failure_count}</p>
                    <p className="text-xs text-error/80">Failed</p>
                  </div>
                </div>
                <div
                  className={cn(
                    'rounded-lg p-3 text-center',
                    parseFloat(successRate) >= 90
                      ? 'bg-success-bg'
                      : parseFloat(successRate) >= 70
                        ? 'bg-warning-bg'
                        : 'bg-error-bg'
                  )}
                >
                  <p
                    className={cn(
                      'text-3xl font-bold',
                      parseFloat(successRate) >= 90
                        ? 'text-success'
                        : parseFloat(successRate) >= 70
                          ? 'text-warning'
                          : 'text-error'
                    )}
                  >
                    {successRate}%
                  </p>
                  <p className="text-xs text-text-muted">Success Rate</p>
                </div>
              </CardContent>
            </Card>

            {/* Secret Management Card */}
            <Card
              className="hc-skel-item border-l-4 border-l-warning shadow-card"
              style={{ animationDelay: '100ms' }}
            >
              <CardHeader>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
                  <KeyIcon className="h-5 w-5 text-warning" />
                  Webhook Secret
                </h2>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-text-secondary">
                  Secret is hidden for security. Regenerate to get a new secret if needed.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setRegenerateDialogOpen(true)}
                >
                  <KeyIcon className="mr-2 h-4 w-4" />
                  Regenerate Secret
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
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
            <p className="text-sm text-text-muted">
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
