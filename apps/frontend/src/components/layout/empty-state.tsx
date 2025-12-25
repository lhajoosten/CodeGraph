import * as React from 'react';
import { cn } from '@/lib/utils';
import { type LucideIcon, FileQuestion, Inbox, Search, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  children?: React.ReactNode;
}

function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        `
        flex flex-col items-center justify-center px-4 py-12 text-center
      `,
        className
      )}
    >
      <div className="mb-4 rounded-full bg-secondary p-4">
        <Icon className="h-8 w-8 text-text-tertiary" />
      </div>
      <h3 className="mb-1 text-lg font-semibold text-text-primary">{title}</h3>
      {description && <p className="mb-6 max-w-sm text-sm text-text-secondary">{description}</p>}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && <Button onClick={action.onClick}>{action.label}</Button>}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

// Pre-built empty states for common scenarios
function NoDataEmptyState({
  title = 'No data yet',
  description = "There's nothing here yet. Get started by creating your first item.",
  action,
  className,
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      icon={Inbox}
      title={title}
      description={description}
      action={action}
      className={className}
    />
  );
}

function NoSearchResultsEmptyState({
  title = 'No results found',
  description = "We couldn't find anything matching your search. Try different keywords.",
  action,
  className,
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      icon={Search}
      title={title}
      description={description}
      action={action}
      className={className}
    />
  );
}

function ErrorEmptyState({
  title = 'Something went wrong',
  description = "We couldn't load the data. Please try again.",
  action,
  className,
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      icon={AlertCircle}
      title={title}
      description={description}
      action={action || { label: 'Try again', onClick: () => window.location.reload() }}
      className={className}
    />
  );
}

function NotFoundEmptyState({
  title = 'Page not found',
  description = "The page you're looking for doesn't exist or has been moved.",
  action,
  className,
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      icon={FileQuestion}
      title={title}
      description={description}
      action={action}
      className={className}
    />
  );
}

export {
  EmptyState,
  NoDataEmptyState,
  NoSearchResultsEmptyState,
  ErrorEmptyState,
  NotFoundEmptyState,
};
export type { EmptyStateProps };
