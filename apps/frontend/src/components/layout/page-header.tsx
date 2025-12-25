import * as React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
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
          <ol className="flex items-center gap-2 text-sm text-text-secondary">
            <li>
              <Link to="/" className={`
                transition-colors
                hover:text-text-primary
              `}>
                <Home className="h-4 w-4" />
                <span className="sr-only">Home</span>
              </Link>
            </li>
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={index}>
                <li>
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </li>
                <li>
                  {item.href ? (
                    <Link to={item.href} className={`
                      transition-colors
                      hover:text-text-primary
                    `}>
                      {item.label}
                    </Link>
                  ) : (
                    <span className="font-medium text-text-primary">{item.label}</span>
                  )}
                </li>
              </React.Fragment>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className={`
            text-2xl font-bold tracking-tight text-text-primary
            sm:text-3xl
          `}>
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
