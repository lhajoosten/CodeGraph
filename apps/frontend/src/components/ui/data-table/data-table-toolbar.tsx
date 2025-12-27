/**
 * DataTable Toolbar Component
 *
 * Contains search, filters, and column visibility controls.
 * Easily extensible for additional toolbar actions.
 */

import type { Table } from '@tanstack/react-table';
import { DataTableSearch } from './data-table-search';
import { DataTableColumnVisibility } from './data-table-column-visibility';
import { useCallback } from 'react';

export interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchable?: boolean;
  searchPlaceholder?: string;
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  enableColumnVisibility?: boolean;
  /** Slot for additional toolbar actions (left side) */
  leftActions?: React.ReactNode;
  /** Slot for additional toolbar actions (right side) */
  rightActions?: React.ReactNode;
}

export function DataTableToolbar<TData>({
  table,
  searchable = true,
  searchPlaceholder = 'Search...',
  globalFilter = '',
  onGlobalFilterChange,
  enableColumnVisibility = true,
  leftActions,
  rightActions,
}: DataTableToolbarProps<TData>) {
  const handleFilterChange = useCallback(
    (value: string) => {
      onGlobalFilterChange?.(value);
    },
    [onGlobalFilterChange]
  );

  const hasLeftContent = searchable || leftActions;
  const hasRightContent = enableColumnVisibility || rightActions;

  if (!hasLeftContent && !hasRightContent) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Left side: Search and custom actions */}
      <div className="flex flex-1 items-center gap-2">
        {searchable && (
          <DataTableSearch
            value={globalFilter}
            onChange={handleFilterChange}
            placeholder={searchPlaceholder}
          />
        )}
        {leftActions}
      </div>

      {/* Right side: Column visibility and custom actions */}
      <div className="flex items-center gap-2">
        {rightActions}
        {enableColumnVisibility && <DataTableColumnVisibility table={table} />}
      </div>
    </div>
  );
}
