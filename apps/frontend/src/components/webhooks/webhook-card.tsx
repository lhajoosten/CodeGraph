import { Link } from '@tanstack/react-router';
import {
  EllipsisHorizontalIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ArrowPathIcon,
  BoltIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WebhookStatusBadge } from './webhook-status-badge';
import { formatRelativeTime, truncate } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { WebhookResponse } from '@/openapi/types.gen';

interface WebhookCardProps {
  webhook: WebhookResponse;
  onEdit?: (webhookId: number) => void;
  onDelete?: (webhookId: number) => void;
  onTest?: (webhookId: number) => void;
  className?: string;
}

const statusAccentColors = {
  active: 'border-l-success',
  paused: 'border-l-warning',
  disabled: 'border-l-text-muted',
};

export function WebhookCard({ webhook, onEdit, onDelete, onTest, className }: WebhookCardProps) {
  const eventCount = webhook.events.includes('*')
    ? 'All Events'
    : `${webhook.events.length} events`;
  const totalDeliveries = webhook.success_count + webhook.failure_count;
  const successRate =
    totalDeliveries > 0 ? ((webhook.success_count / totalDeliveries) * 100).toFixed(1) : null;

  return (
    <Card
      className={cn(
        'group relative overflow-hidden border-l-4 transition-all duration-300',
        'hover:border-brand-teal/30 hover:shadow-card-hover',
        statusAccentColors[webhook.status] || 'border-l-brand-teal',
        className
      )}
    >
      {/* Hover gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-teal/0 to-brand-cyan/0 opacity-0 transition-opacity duration-300 group-hover:from-brand-teal/5 group-hover:to-brand-cyan/5 group-hover:opacity-100" />

      <CardHeader className="relative flex flex-row items-start justify-between gap-4 pb-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Link
            to="/webhooks/$id"
            params={{ id: String(webhook.id) }}
            className="line-clamp-1 text-lg font-semibold text-text-primary transition-colors hover:text-brand-teal"
          >
            {webhook.name}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <WebhookStatusBadge status={webhook.status} size="sm" />
            <span className="flex items-center gap-1 rounded-full bg-surface-secondary px-2 py-0.5 text-xs text-text-muted">
              <BoltIcon className="h-3 w-3" />
              {eventCount}
            </span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton
              variant="ghost"
              size="sm"
              icon={<EllipsisHorizontalIcon />}
              aria-label="Webhook actions"
              className="opacity-0 transition-opacity group-hover:opacity-100"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to="/webhooks/$id" params={{ id: String(webhook.id) }}>
                <EyeIcon className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(webhook.id)}>
                <PencilIcon className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}
            {onTest && (
              <DropdownMenuItem onClick={() => onTest(webhook.id)}>
                <ArrowPathIcon className="mr-2 h-4 w-4" />
                Send Test
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(webhook.id)} destructive>
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="relative space-y-3 py-0 pb-3">
        {/* URL Display */}
        <div className="flex items-center gap-2 rounded-lg bg-surface-secondary/50 p-2">
          <code className="line-clamp-1 flex-1 font-mono text-xs text-text-secondary">
            {truncate(webhook.url, 50)}
          </code>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs">
            <CheckCircleIcon className="h-3.5 w-3.5 text-success" />
            <span className="font-medium text-text-primary">{webhook.success_count}</span>
            <span className="text-text-muted">success</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <XCircleIcon className="h-3.5 w-3.5 text-error" />
            <span className="font-medium text-text-primary">{webhook.failure_count}</span>
            <span className="text-text-muted">failed</span>
          </div>
          {successRate && (
            <div
              className={cn(
                'ml-auto rounded-full px-2 py-0.5 text-xs font-medium',
                parseFloat(successRate) >= 90
                  ? 'bg-success-bg text-success'
                  : parseFloat(successRate) >= 70
                    ? 'bg-warning-bg text-warning'
                    : 'bg-error-bg text-error'
              )}
            >
              {successRate}% rate
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="relative border-t border-border-primary/50 pt-3 text-xs text-text-muted">
        <div className="flex items-center gap-1.5">
          <ClockIcon className="h-3.5 w-3.5" />
          Updated {formatRelativeTime(webhook.updated_at)}
        </div>
      </CardFooter>
    </Card>
  );
}
