/**
 * DataTable Pagination Component
 *
 * Pagination controls with page size selector and navigation.
 */

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Table } from '@tanstack/react-table';
import { useCallback } from 'react';

export interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  pageSizeOptions?: number[];
  showRowSelection?: boolean;
  showPageInfo?: boolean;
  showPageSizeSelector?: boolean;
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 20, 30, 40, 50],
  showRowSelection = true,
  showPageInfo = true,
  showPageSizeSelector = true,
}: DataTablePaginationProps<TData>) {
  const handlePageSizeChange = useCallback(
    (value: string) => {
      table.setPageSize(Number(value));
    },
    [table]
  );

  const handlePreviousPage = useCallback(() => {
    table.previousPage();
  }, [table]);

  const handleNextPage = useCallback(() => {
    table.nextPage();
  }, [table]);

  const handleFirstPage = useCallback(() => {
    table.setPageIndex(0);
  }, [table]);

  const handleLastPage = useCallback(() => {
    table.setPageIndex(table.getPageCount() - 1);
  }, [table]);

  // Safely get selected row count - only if row selection is enabled
  const selectedCount = showRowSelection
    ? (table.getFilteredSelectedRowModel?.()?.rows?.length ?? 0)
    : 0;
  const totalCount = table.getFilteredRowModel?.()?.rows?.length ?? 0;
  const currentPage = (table.getState?.()?.pagination?.pageIndex ?? 0) + 1;
  const pageCount = table.getPageCount?.() ?? 1;

  return (
    <div className="flex items-center justify-between px-2">
      {/* Row Selection Info */}
      <div className="text-text-secondary flex-1 text-sm">
        {showRowSelection && selectedCount > 0 && (
          <span>
            {selectedCount} of {totalCount} row(s) selected.
          </span>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center space-x-6 lg:space-x-8">
        {/* Page Size Selector */}
        {showPageSizeSelector && (
          <div className="flex items-center space-x-2">
            <p className="text-text-primary-lum text-sm font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="h-8 w-18">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizeOptions.map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Page Info */}
        {showPageInfo && (
          <div className="text-text-primary-lum flex w-24 items-center justify-center text-sm font-medium">
            Page {currentPage} of {pageCount}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFirstPage}
            disabled={!table.getCanPreviousPage()}
            className="hidden lg:flex"
          >
            First
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLastPage}
            disabled={!table.getCanNextPage()}
            className="hidden lg:flex"
          >
            Last
          </Button>
        </div>
      </div>
    </div>
  );
}
