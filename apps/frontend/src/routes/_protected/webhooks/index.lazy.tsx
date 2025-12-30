import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { PlusIcon } from '@heroicons/react/24/outline';
import { AppLayout } from '@/components/layout/app-layout';
import { WebhookList } from '@/components/webhooks/webhook-list';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';

function WebhooksPage() {
  const navigate = useNavigate();

  const handleCreateWebhook = () => {
    navigate({ to: '/webhooks/new' });
  };

  const handleEditWebhook = (webhookId: number) => {
    navigate({ to: '/webhooks/$id', params: { id: String(webhookId) } });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Webhooks"
          description="Manage webhooks to receive event notifications"
          actions={
            <Button onClick={handleCreateWebhook}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Webhook
            </Button>
          }
        />
        <WebhookList onCreateWebhook={handleCreateWebhook} onEditWebhook={handleEditWebhook} />
      </div>
    </AppLayout>
  );
}

export const Route = createLazyFileRoute('/_protected/webhooks/')({
  component: WebhooksPage,
});
