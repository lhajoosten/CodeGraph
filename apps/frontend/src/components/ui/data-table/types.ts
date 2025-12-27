/**
 * DataTable Types
 *
 * Centralized type definitions for the DataTable component.
 * This file contains all shared types, interfaces, and type utilities.
 */

import type { ColumnDef, Table, RowSelectionState } from '@tanstack/react-table';

/**
 * Main DataTable component props
 */
export interface DataTableProps<TData, TValue> {
  /** Column definitions for the table */
  columns: ColumnDef<TData, TValue>[];
  /** Data to display in the table */
  data: TData[];
  /** Callback when row selection changes */
  onRowSelectionChange?: (selectedRows: Record<string, boolean>) => void;
  /** Enable pagination controls */
  pagination?: boolean;
  /** Default number of rows per page */
  defaultPageSize?: number;
  /** Available page size options */
  pageSizeOptions?: number[];
  /** Enable column filtering */
  enableColumnFilters?: boolean;
  /** Enable column sorting */
  enableSorting?: boolean;
  /** Enable row selection with checkboxes */
  enableRowSelection?: boolean;
  /** Enable column visibility toggle */
  enableColumnVisibility?: boolean;
  /** Enable global search */
  searchable?: boolean;
  /** Placeholder text for search input */
  searchPlaceholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** Message shown when no results */
  emptyMessage?: string;
}

/**
 * Configuration object for table behavior
 */
export interface DataTableConfig {
  pagination: boolean;
  enableSorting: boolean;
  enableColumnFilters: boolean;
  enableColumnVisibility: boolean;
  enableRowSelection: boolean;
  searchable: boolean;
  defaultPageSize: number;
}

/**
 * State object for table state management
 */
export interface DataTableState {
  sorting: import('@tanstack/react-table').SortingState;
  columnFilters: import('@tanstack/react-table').ColumnFiltersState;
  columnVisibility: import('@tanstack/react-table').VisibilityState;
  rowSelection: RowSelectionState;
  globalFilter: string;
}

/**
 * Handlers object for state updates
 */
export interface DataTableHandlers {
  setSorting: React.Dispatch<React.SetStateAction<import('@tanstack/react-table').SortingState>>;
  setColumnFilters: React.Dispatch<
    React.SetStateAction<import('@tanstack/react-table').ColumnFiltersState>
  >;
  setColumnVisibility: React.Dispatch<
    React.SetStateAction<import('@tanstack/react-table').VisibilityState>
  >;
  setRowSelection: React.Dispatch<React.SetStateAction<RowSelectionState>>;
  setGlobalFilter: React.Dispatch<React.SetStateAction<string>>;
}

/**
 * Props for the DataTableToolbar component
 */
export interface DataTableToolbarProps<TData> {
  searchable: boolean;
  searchPlaceholder: string;
  globalFilter: string;
  setGlobalFilter: React.Dispatch<React.SetStateAction<string>>;
  enableColumnVisibility: boolean;
  table: Table<TData>;
}

/**
 * Props for the DataTableContent component
 */
export interface DataTableContentProps<TData, TValue> {
  table: Table<TData>;
  columns: ColumnDef<TData, TValue>[];
  enableSorting: boolean;
  emptyMessage: string;
}

/**
 * Props for the DataTablePagination component
 */
export interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  enableRowSelection: boolean;
  pageSizeOptions: number[];
}

/**
 * Props for individual column header with sorting
 */
export interface DataTableColumnHeaderProps<TData> {
  column: import('@tanstack/react-table').Column<TData, unknown>;
  title: string;
  enableSorting?: boolean;
}

/**
 * Props for the search input component
 */
export interface DataTableSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Props for the column visibility dropdown
 */
export interface DataTableColumnVisibilityProps<TData> {
  table: Table<TData>;
}

/**
 * Props for page size selector
 */
export interface DataTablePageSizeProps {
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  options: number[];
}
