import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import {
  PlusIcon,
  BoltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';
import { AppLayout } from '@/components/layout/app-layout';
import { WebhookList } from '@/components/webhooks/webhook-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useFetchWebhooks } from '@/hooks/api/webhooks/queries/use-fetch-webhooks';
import { cn } from '@/lib/utils';

function WebhooksPage() {
  const navigate = useNavigate();
  const { data: response } = useFetchWebhooks();
  const webhooks = response?.items ?? [];

  // Calculate stats
  const totalWebhooks = webhooks.length;
  const activeWebhooks = webhooks.filter((w) => w.status === 'active').length;
  const totalDeliveries = webhooks.reduce((sum, w) => sum + w.success_count + w.failure_count, 0);
  const totalSuccessful = webhooks.reduce((sum, w) => sum + w.success_count, 0);
  const successRate =
    totalDeliveries > 0 ? ((totalSuccessful / totalDeliveries) * 100).toFixed(1) : '100';

  const handleCreateWebhook = () => {
    navigate({ to: '/webhooks/new' });
  };

  const handleEditWebhook = (webhookId: number) => {
    navigate({ to: '/webhooks/$id', params: { id: String(webhookId) } });
  };

  const stats = [
    {
      label: 'Total Webhooks',
      value: totalWebhooks.toString(),
      icon: BoltIcon,
      variant: 'teal' as const,
    },
    {
      label: 'Active',
      value: activeWebhooks.toString(),
      icon: CheckCircleIcon,
      variant: 'green' as const,
    },
    {
      label: 'Total Deliveries',
      value: totalDeliveries.toLocaleString(),
      icon: ArrowTrendingUpIcon,
      variant: 'blue' as const,
    },
    {
      label: 'Success Rate',
      value: `${successRate}%`,
      icon: SignalIcon,
      variant:
        totalDeliveries > 0 && parseFloat(successRate) < 90
          ? ('amber' as const)
          : ('green' as const),
    },
  ];

  const variantStyles = {
    teal: {
      iconBg: 'bg-gradient-to-br from-brand-teal/20 to-brand-cyan/20 border border-brand-teal/30',
      iconColor: 'text-brand-teal',
    },
    green: {
      iconBg: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30',
      iconColor: 'text-green-500',
    },
    blue: {
      iconBg: 'bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30',
      iconColor: 'text-blue-500',
    },
    amber: {
      iconBg: 'bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30',
      iconColor: 'text-amber-500',
    },
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-teal/10 via-brand-cyan/5 to-background p-8 shadow-elevated">
          {/* Decorative pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <BoltIcon className="h-6 w-6 text-brand-teal" />
                <span className="text-sm font-medium tracking-wide text-brand-teal uppercase">
                  Integrations
                </span>
              </div>
              <h1 className="mb-2 text-4xl font-bold tracking-tight text-text-primary">Webhooks</h1>
              <p className="text-lg text-text-secondary">
                Receive real-time event notifications for your integrations
              </p>
            </div>

            <Button
              onClick={handleCreateWebhook}
              size="lg"
              className="bg-gradient-teal gap-2 shadow-button-hover"
            >
              <PlusIcon className="h-5 w-5" />
              Create Webhook
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const styles = variantStyles[stat.variant];
            return (
              <Card
                key={index}
                className={cn(
                  'hc-skel-item border-accent-top overflow-hidden transition-all duration-300 hover:shadow-card-hover'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-text-muted">{stat.label}</p>
                      <p className="mt-1 text-2xl font-bold text-text-primary">{stat.value}</p>
                    </div>
                    <div
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-xl',
                        styles.iconBg
                      )}
                    >
                      <stat.icon className={cn('h-6 w-6', styles.iconColor)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Webhook List Section */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-brand-teal" />
            <h2 className="text-sm font-semibold tracking-wide text-text-secondary uppercase">
              Your Webhooks
            </h2>
            {totalWebhooks > 0 && (
              <span className="ml-2 rounded-full bg-surface-secondary px-2 py-0.5 text-xs text-text-muted">
                {totalWebhooks}
              </span>
            )}
          </div>
          <WebhookList onCreateWebhook={handleCreateWebhook} onEditWebhook={handleEditWebhook} />
        </div>

        {/* Help Section */}
        {totalWebhooks === 0 && (
          <Card className="border-2 border-dashed border-border-secondary bg-surface-secondary/30">
            <CardContent className="flex items-center gap-6 p-6">
              <div className="bg-gradient-teal flex h-14 w-14 items-center justify-center rounded-xl shadow-button">
                <ExclamationTriangleIcon className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-text-primary">Getting Started</h3>
                <p className="mt-1 text-text-secondary">
                  Webhooks allow your applications to receive real-time notifications when events
                  occur. Create your first webhook to start receiving event data.
                </p>
              </div>
              <Button variant="outline" onClick={handleCreateWebhook}>
                Learn More
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

export const Route = createLazyFileRoute('/_protected/webhooks/')({
  component: WebhooksPage,
});
