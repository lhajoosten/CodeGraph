import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  QuestionMarkCircleIcon,
  InboxIcon,
  MagnifyingGlassIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
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
  icon: Icon = InboxIcon,
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
      <div className="bg-surface mb-4 rounded-full p-4">
        <Icon className="text-text-secondary h-8 w-8" />
      </div>
      <h3 className="text-text-primary mb-1 text-lg font-semibold">{title}</h3>
      {description && (
        <p className="text-text-secondary mb-6 max-w-sm text-sm">{description}</p>
      )}
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
      icon={InboxIcon}
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
      icon={MagnifyingGlassIcon}
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
      icon={ExclamationCircleIcon}
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
      icon={QuestionMarkCircleIcon}
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
