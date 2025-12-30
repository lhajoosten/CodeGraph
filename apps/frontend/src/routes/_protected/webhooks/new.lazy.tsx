import { createLazyFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { WebhookForm } from '@/components/webhooks/webhook-form';
import { WebhookSecretDisplay } from '@/components/webhooks/webhook-secret-display';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCreateWebhook } from '@/hooks/api/webhooks/mutations/use-create-webhook';
import {
  ArrowLeftIcon,
  BoltIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import type { WebhookCreate } from '@/openapi/types.gen';

function NewWebhookPage() {
  const navigate = useNavigate();
  const createMutation = useCreateWebhook();
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [secretDialogOpen, setSecretDialogOpen] = useState(false);

  const handleSubmit = (data: WebhookCreate) => {
    createMutation.mutate(
      { body: data },
      {
        onSuccess: (response) => {
          if ('secret' in response && response.secret) {
            setCreatedSecret(response.secret);
            setSecretDialogOpen(true);
          } else {
            navigate({ to: '/webhooks' });
          }
        },
      }
    );
  };

  const handleCloseSecretDialog = () => {
    setSecretDialogOpen(false);
    navigate({ to: '/webhooks' });
  };

  const breadcrumbItems = [
    { label: 'Webhooks', onClick: () => navigate({ to: '/webhooks' }) },
    { label: 'Create Webhook' },
  ];

  return (
    <AppLayout>
      <div className="container mx-auto max-w-4xl px-4 py-6">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumbs items={breadcrumbItems} className="mb-4" />
        </div>

        {/* Hero Section */}
        <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-teal/10 via-brand-cyan/5 to-background p-8 shadow-elevated">
          {/* Decorative pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          <div className="relative">
            {/* Back Button */}
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="mb-4 border-brand-teal/20 bg-brand-teal/10 text-brand-teal backdrop-blur hover:bg-brand-teal/20"
            >
              <Link to="/webhooks">
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Back to Webhooks
              </Link>
            </Button>

            <div className="flex items-center gap-3">
              <div className="bg-gradient-teal flex h-14 w-14 items-center justify-center rounded-xl shadow-button">
                <BoltIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-text-primary">
                  Create Webhook
                </h1>
                <p className="text-text-secondary">
                  Configure a new webhook to receive real-time event notifications
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <div className="flex items-start gap-3 rounded-lg border border-border-primary bg-surface p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <InformationCircleIcon className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-medium text-text-primary">How it works</h3>
              <p className="mt-1 text-sm text-text-secondary">
                When events occur, we&apos;ll send HTTP POST requests to your endpoint with event
                data.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning-bg p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/20">
              <ShieldCheckIcon className="h-5 w-5 text-warning" />
            </div>
            <div>
              <h3 className="font-medium text-text-primary">Security Note</h3>
              <p className="mt-1 text-sm text-text-secondary">
                You&apos;ll receive a secret key after creation. Save it securely - it&apos;s shown
                only once!
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <Card className="border-accent-top shadow-card">
          <CardHeader>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
              <BoltIcon className="h-5 w-5 text-brand-teal" />
              Webhook Configuration
            </h2>
            <p className="text-sm text-text-muted">
              Fill in the details below to create your webhook endpoint
            </p>
          </CardHeader>
          <CardContent>
            <WebhookForm
              onSubmit={(data) => handleSubmit(data as WebhookCreate)}
              isLoading={createMutation.isPending}
              submitLabel="Create Webhook"
            />
          </CardContent>
        </Card>
      </div>

      {/* Success Dialog */}
      <Dialog open={secretDialogOpen} onOpenChange={handleCloseSecretDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-bg">
                <CheckCircleIcon className="h-8 w-8 text-success" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">Webhook Created!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-warning/30 bg-warning-bg p-4">
              <div className="flex items-start gap-3">
                <ShieldCheckIcon className="h-5 w-5 shrink-0 text-warning" />
                <p className="text-sm text-text-primary">
                  <strong>Important:</strong> Save this secret key now. You won&apos;t be able to
                  see it again! Use this secret to verify webhook signatures.
                </p>
              </div>
            </div>
            {createdSecret && <WebhookSecretDisplay secret={createdSecret} />}
            <Button className="bg-gradient-teal w-full" onClick={handleCloseSecretDialog}>
              I&apos;ve Saved the Secret
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

export const Route = createLazyFileRoute('/_protected/webhooks/new')({
  component: NewWebhookPage,
});
