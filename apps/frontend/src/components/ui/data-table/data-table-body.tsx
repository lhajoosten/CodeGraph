/**
 * DataTable Body Component
 *
 * Renders the main table content with headers and rows.
 */

import { flexRender, type ColumnDef, type Table } from '@tanstack/react-table';
import { ChevronUpIcon, ChevronDownIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import {
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ReactNode } from 'react';

export interface DataTableBodyProps<TData, TValue> {
  table: Table<TData>;
  columns: ColumnDef<TData, TValue>[];
  enableSorting?: boolean;
  emptyMessage?: string;
  /** Custom empty state component */
  emptyState?: ReactNode;
}

export function DataTableBody<TData, TValue>({
  table,
  columns,
  enableSorting = true,
  emptyMessage = 'No results found.',
  emptyState,
}: DataTableBodyProps<TData, TValue>) {
  return (
    <div className="border-border-steel overflow-hidden rounded-lg border">
      <TableComponent variant="default">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <DataTableHeaderCell
                  key={header.id}
                  header={header}
                  enableSorting={enableSorting}
                />
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {emptyState ?? (
                  <div className="text-text-secondary flex flex-col items-center justify-center space-y-2">
                    <MagnifyingGlassIcon className="h-8 w-8 opacity-50" />
                    <p>{emptyMessage}</p>
                  </div>
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </TableComponent>
    </div>
  );
}

/**
 * Individual header cell with sorting support
 */
interface DataTableHeaderCellProps<TData> {
  header: import('@tanstack/react-table').Header<TData, unknown>;
  enableSorting: boolean;
}

function DataTableHeaderCell<TData>({ header, enableSorting }: DataTableHeaderCellProps<TData>) {
  const isSortable = enableSorting && header.column.getCanSort();
  const sortDirection = header.column.getIsSorted();

  return (
    <TableHead
      className={cn(isSortable && 'cursor-pointer select-none')}
      onClick={isSortable ? header.column.getToggleSortingHandler() : undefined}
    >
      {header.isPlaceholder ? null : (
        <div className="flex items-center space-x-2">
          <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
          {isSortable && (
            <span className="text-text-secondary">
              {sortDirection === 'asc' ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : sortDirection === 'desc' ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronUpDownIcon className="h-4 w-4 opacity-50" />
              )}
            </span>
          )}
        </div>
      )}
    </TableHead>
  );
}
