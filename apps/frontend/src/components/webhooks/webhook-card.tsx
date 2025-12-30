import { Link } from '@tanstack/react-router';
import {
  EllipsisHorizontalIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ArrowPathIcon,
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

export function WebhookCard({ webhook, onEdit, onDelete, onTest, className }: WebhookCardProps) {
  const eventCount = webhook.events.includes('*')
    ? 'All Events'
    : `${webhook.events.length} events`;
  const totalDeliveries = webhook.success_count + webhook.failure_count;
  const successRate =
    totalDeliveries > 0 ? ((webhook.success_count / totalDeliveries) * 100).toFixed(1) : 'N/A';

  return (
    <Card
      className={cn(
        `
          hover:border-primary/50 hover:shadow-card
          transition-all duration-200
        `,
        className
      )}
    >
      <CardHeader
        className={`
        flex flex-row items-start justify-between gap-4 pb-2
      `}
      >
        <div className="min-w-0 flex-1 space-y-1">
          <Link
            to="/webhooks/$id"
            params={{ id: String(webhook.id) }}
            className={`
              text-text-primary line-clamp-1 text-lg font-semibold
              transition-colors
              hover:text-primary
            `}
          >
            {webhook.name}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <WebhookStatusBadge status={webhook.status} size="sm" />
            <span className="text-text-muted-lum text-xs">{eventCount}</span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton
              variant="ghost"
              size="sm"
              icon={<EllipsisHorizontalIcon />}
              aria-label="Webhook actions"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to="/webhooks/$id" params={{ id: String(webhook.id) }}>
                <EyeIcon className="mr-2 h-4 w-4" />
                View
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
                Test
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

      <CardContent className="space-y-2 py-2">
        <p className="text-text-secondary line-clamp-1 font-mono text-sm">
          {truncate(webhook.url, 60)}
        </p>
        <div className="text-text-muted-lum flex items-center gap-4 text-xs">
          <span>Success: {webhook.success_count}</span>
          <span>Failed: {webhook.failure_count}</span>
          {totalDeliveries > 0 && <span>({successRate}%)</span>}
        </div>
      </CardContent>

      <CardFooter className="text-text-secondary-lum pt-2 text-xs">
        Updated {formatRelativeTime(webhook.updated_at)}
      </CardFooter>
    </Card>
  );
}
