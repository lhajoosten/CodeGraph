/**
 * DataTable Column Header Component
 *
 * Reusable column header with sorting support.
 * Use this in your column definitions for consistent styling.
 */

import { ChevronUpIcon, ChevronDownIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Column } from '@tanstack/react-table';

export interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  const sortDirection = column.getIsSorted();

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('data-[state=open]:bg-accent -ml-3 h-8', className)}
      onClick={column.getToggleSortingHandler()}
    >
      <span>{title}</span>
      {sortDirection === 'asc' ? (
        <ChevronUpIcon className="ml-2 h-4 w-4" />
      ) : sortDirection === 'desc' ? (
        <ChevronDownIcon className="ml-2 h-4 w-4" />
      ) : (
        <ChevronUpDownIcon className="ml-2 h-4 w-4 opacity-50" />
      )}
    </Button>
  );
}
