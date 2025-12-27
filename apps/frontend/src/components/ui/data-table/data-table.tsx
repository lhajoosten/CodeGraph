/**
 * DataTable Component
 *
 * A powerful, feature-rich data table built on TanStack Table.
 * Supports sorting, filtering, pagination, row selection, and more.
 *
 * @example
 * ```tsx
 * import { DataTable, createSelectionColumn } from '@/components/ui/data-table';
 *
 * const columns = [
 *   createSelectionColumn<User>(),
 *   { accessorKey: 'name', header: 'Name' },
 *   { accessorKey: 'email', header: 'Email' },
 * ];
 *
 * <DataTable
 *   columns={columns}
 *   data={users}
 *   enableRowSelection
 *   onRowSelectionChange={(selected) => console.log(selected)}
 * />
 * ```
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useDataTable, useDataTableConfig } from './hooks';
import { DataTableToolbar } from './data-table-toolbar';
import { DataTableBody } from './data-table-body';
import { DataTablePagination } from './data-table-pagination';
import type { DataTableProps } from './types';

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowSelectionChange,
  pagination = true,
  defaultPageSize = 10,
  pageSizeOptions = [10, 20, 30, 40, 50],
  enableColumnFilters = true,
  enableSorting = true,
  enableRowSelection = false,
  enableColumnVisibility = true,
  searchable = true,
  searchPlaceholder = 'Search...',
  className,
  emptyMessage = 'No results found.',
}: DataTableProps<TData, TValue>) {
  // Create memoized config
  const config = useDataTableConfig({
    pagination,
    enableSorting,
    enableColumnFilters,
    enableColumnVisibility,
    enableRowSelection,
    searchable,
    defaultPageSize,
  });

  // Create table instance with all state management
  const { table, state, handlers } = useDataTable(data, columns, config);

  // Notify parent of row selection changes
  React.useEffect(() => {
    if (onRowSelectionChange && enableRowSelection) {
      onRowSelectionChange(state.rowSelection);
    }
  }, [state.rowSelection, onRowSelectionChange, enableRowSelection]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      {(searchable || enableColumnVisibility) && (
        <DataTableToolbar
          table={table}
          searchable={searchable}
          searchPlaceholder={searchPlaceholder}
          globalFilter={state.globalFilter}
          onGlobalFilterChange={handlers.setGlobalFilter}
          enableColumnVisibility={enableColumnVisibility}
        />
      )}

      {/* Table Body */}
      <DataTableBody
        table={table}
        columns={columns}
        enableSorting={enableSorting}
        emptyMessage={emptyMessage}
      />

      {/* Pagination */}
      {pagination && (
        <DataTablePagination
          table={table}
          pageSizeOptions={pageSizeOptions}
          showRowSelection={enableRowSelection}
        />
      )}
    </div>
  );
}

// Re-export types for convenience
export type { DataTableProps } from './types';
