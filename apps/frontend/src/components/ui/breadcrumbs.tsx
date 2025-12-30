import React from 'react';
import { ChevronRightIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  maxItems?: number;
  collapsedLabel?: string;
  className?: string;
  onCollapsedClick?: () => void;
}

/**
 * Breadcrumbs Component - Navigate through page hierarchy
 * Features:
 * - Customizable separator (chevron, slash, etc.)
 * - Automatic ellipsis for long paths
 * - Current page indicator (non-clickable last item)
 * - Responsive collapse on mobile
 * - Luminous cyan for active/hover states
 * - Keyboard navigation support
 */
export function Breadcrumbs({
  items,
  separator = <ChevronRightIcon className="text-text-secondary h-4 w-4" />,
  maxItems = 5,
  collapsedLabel: _collapsedLabel = 'More',
  className,
  onCollapsedClick,
}: BreadcrumbsProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // Show collapsed view on mobile
  React.useEffect(() => {
    const handleResize = () => {
      setIsCollapsed(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine which items to show
  const getVisibleItems = () => {
    if (items.length <= maxItems || !isCollapsed) {
      return { itemsToShow: items, hasCollapsed: false };
    }

    // Show first, last, and ellipsis
    const itemsToShow = [items[0], items[items.length - 1]];
    return { itemsToShow, hasCollapsed: true };
  };

  const { itemsToShow, hasCollapsed } = getVisibleItems();

  const handleCollapsedClick = () => {
    setIsCollapsed(false);
    onCollapsedClick?.();
  };

  return (
    <nav
      className={cn('flex items-center gap-2 overflow-x-auto', className)}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center gap-2">
        {itemsToShow.map((item, index) => {
          const isLast = index === itemsToShow.length - 1;
          const isFirst = index === 0;

          return (
            <li key={index} className="flex items-center gap-2">
              {!isFirst && separator}

              {hasCollapsed && index === 1 && (
                <button
                  onClick={handleCollapsedClick}
                  className="border-border-primary text-text-secondary flex h-8 w-8 items-center justify-center rounded-lg border transition-all hover:bg-surface hover:text-brand-cyan"
                  title={`Show ${items.length - 2} more items`}
                  aria-label="Show more breadcrumb items"
                >
                  <EllipsisHorizontalIcon className="h-4 w-4" />
                </button>
              )}

              {isLast ? (
                <span className="text-text-primary inline-flex items-center text-sm font-medium">
                  {item.label}
                </span>
              ) : (
                <button
                  onClick={item.onClick}
                  disabled={item.disabled}
                  className={cn(
                    'inline-flex items-center rounded-lg px-3 py-1 text-sm font-medium transition-all',
                    item.disabled
                      ? 'text-text-muted cursor-not-allowed'
                      : 'text-text-secondary hover:bg-surface hover:text-brand-cyan'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export type { BreadcrumbsProps };
