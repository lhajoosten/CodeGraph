import * as React from 'react';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: React.ReactNode;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

function PageHeader({ title, description, breadcrumbs, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-6 space-y-4', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb">
          <ol className="text-text-secondary flex items-center gap-2 text-sm">
            <li>
              <Link
                to="/"
                className={`
                  hover:text-text-primary
                  transition-colors
                `}
              >
                <HomeIcon className="h-4 w-4" />
                <span className="sr-only">Home</span>
              </Link>
            </li>
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={index}>
                <li>
                  <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
                </li>
                <li>
                  {item.href ? (
                    <Link
                      to={item.href}
                      className={`
                        hover:text-text-primary
                        transition-colors
                      `}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-text-primary font-medium">{item.label}</span>
                  )}
                </li>
              </React.Fragment>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1
            className={`
              text-text-primary text-2xl font-bold tracking-tight
              sm:text-3xl
            `}
          >
            {title}
          </h1>
          {description && <p className="text-text-secondary">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export { PageHeader };
export type { PageHeaderProps, BreadcrumbItem };
