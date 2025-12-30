import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WebhookForm } from '@/components/webhooks/webhook-form';
import { WebhookSecretDisplay } from '@/components/webhooks/webhook-secret-display';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCreateWebhook } from '@/hooks/api/webhooks/mutations/use-create-webhook';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/webhooks' })}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back
          </Button>
          <PageHeader
            title="Create Webhook"
            description="Configure a new webhook to receive event notifications"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Webhook Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6">
              <AlertDescription>
                After creating the webhook, you&apos;ll receive a secret key. Make sure to save it
                securely - it will only be shown once!
              </AlertDescription>
            </Alert>
            <WebhookForm
              onSubmit={(data) => handleSubmit(data as WebhookCreate)}
              isLoading={createMutation.isPending}
              submitLabel="Create Webhook"
            />
          </CardContent>
        </Card>
      </div>

      <Dialog open={secretDialogOpen} onOpenChange={handleCloseSecretDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Webhook Created Successfully!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Save this secret key now - you won&apos;t be able to see it again! Use this secret
                to verify webhook signatures.
              </AlertDescription>
            </Alert>
            {createdSecret && <WebhookSecretDisplay secret={createdSecret} />}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

export const Route = createLazyFileRoute('/_protected/webhooks/new')({
  component: NewWebhookPage,
});
