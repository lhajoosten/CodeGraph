import React from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage?: number;
  totalItems?: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  showFirstLast?: boolean;
  showItemsPerPageSelector?: boolean;
  itemsPerPageOptions?: number[];
  className?: string;
}

/**
 * Pagination Component - Navigate through paginated data
 * Features:
 * - Page numbers with ellipsis for large page counts
 * - Previous/Next navigation
 * - First/Last page buttons
 * - Items per page selector
 * - Total count display
 * - Keyboard navigation (arrow keys)
 * - Luminous cyan styling with glow effects
 */
export function Pagination({
  currentPage,
  totalPages,
  itemsPerPage = 10,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
  showFirstLast = true,
  showItemsPerPageSelector = true,
  itemsPerPageOptions = [5, 10, 25, 50],
  className,
}: PaginationProps) {
  const [localItemsPerPage, setLocalItemsPerPage] = React.useState(itemsPerPage);

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentPage > 1) {
        onPageChange(currentPage - 1);
      } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
        onPageChange(currentPage + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, onPageChange]);

  // Generate page numbers with ellipsis
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const showPages = 5; // Number of page buttons to show
    const halfShow = Math.floor(showPages / 2);

    let startPage = Math.max(1, currentPage - halfShow);
    const endPage = Math.min(totalPages, startPage + showPages - 1);

    if (endPage - startPage < showPages - 1) {
      startPage = Math.max(1, endPage - showPages + 1);
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('ellipsis-start');
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('ellipsis-end');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  const handleItemsPerPageChange = (newValue: number) => {
    setLocalItemsPerPage(newValue);
    onItemsPerPageChange?.(newValue);
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Info and items per page */}
        <div className="flex flex-wrap items-center gap-4">
          {totalItems && (
            <div className="text-sm text-text-secondary-lum">
              Total: <span className="font-medium text-text-primary-lum">{totalItems}</span> items
            </div>
          )}

          {showItemsPerPageSelector && (
            <div className="flex items-center gap-2">
              <label htmlFor="items-per-page" className="text-sm text-text-secondary-lum">
                Per page:
              </label>
              <select
                id="items-per-page"
                value={localItemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="rounded-lg border border-border-steel bg-bg-elevated-lum px-2 py-1 text-sm text-text-primary-lum focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 focus:outline-none"
              >
                {itemsPerPageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right: Current page info */}
        <div className="text-sm text-text-secondary-lum">
          Page <span className="font-medium text-text-primary-lum">{currentPage}</span> of{' '}
          <span className="font-medium text-text-primary-lum">{totalPages}</span>
        </div>
      </div>

      {/* Pagination controls */}
      <div className="flex flex-wrap items-center justify-center gap-1">
        {/* First page button */}
        {showFirstLast && (
          <Button
            variant="ghost"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => onPageChange(1)}
            title="Go to first page"
            className="h-8 w-8 p-0"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
        )}

        {/* Previous button */}
        <Button
          variant="ghost"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          title="Previous page (←)"
          className="h-8 w-8 p-0"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>

        {/* Page numbers */}
        {pageNumbers.map((page, index) => {
          if (page === 'ellipsis-start' || page === 'ellipsis-end') {
            return (
              <div key={`${page}-${index}`} className="flex h-8 w-8 items-center justify-center">
                <EllipsisHorizontalIcon className="h-4 w-4 text-text-secondary-lum" />
              </div>
            );
          }

          const isCurrentPage = page === currentPage;
          return (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={cn(
                'h-8 w-8 rounded-lg transition-all duration-200',
                isCurrentPage
                  ? 'bg-brand-cyan font-semibold text-white shadow-[0_0_8px_rgba(34,211,238,0.4)]'
                  : 'border border-border-steel bg-transparent text-text-primary-lum hover:border-brand-cyan/50 hover:bg-bg-elevated-lum'
              )}
            >
              {page}
            </button>
          );
        })}

        {/* Next button */}
        <Button
          variant="ghost"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          title="Next page (→)"
          className="h-8 w-8 p-0"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>

        {/* Last page button */}
        {showFirstLast && (
          <Button
            variant="ghost"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(totalPages)}
            title="Go to last page"
            className="h-8 w-8 p-0"
          >
            <ChevronRightIcon className="h-4 w-4" />
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export type { PaginationProps };
