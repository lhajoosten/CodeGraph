/**
 * DataTable Hooks
 *
 * Custom hooks for DataTable functionality.
 * Handles table configuration, state management, and memoization.
 */

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  RowSelectionState,
  TableOptions,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { DataTableConfig, DataTableState, DataTableHandlers } from './types';
import { useMemo, useState } from 'react';

/**
 * Pre-created row models - stable references that won't change.
 * Creating these outside the component prevents recreation on every render.
 */
const coreRowModel = getCoreRowModel();
const paginationRowModel = getPaginationRowModel();
const sortedRowModel = getSortedRowModel();
const filteredRowModel = getFilteredRowModel();

/**
 * Hook to manage DataTable state.
 * Returns state values and their setters, all properly memoized.
 */
export function useDataTableState() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');

  // Memoize handlers object to prevent recreation
  const handlers: DataTableHandlers = useMemo(
    () => ({
      setSorting,
      setColumnFilters,
      setColumnVisibility,
      setRowSelection,
      setGlobalFilter,
    }),
    []
  );

  // Memoize state object
  const state: DataTableState = useMemo(
    () => ({
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    }),
    [sorting, columnFilters, columnVisibility, rowSelection, globalFilter]
  );

  return { state, handlers };
}

/**
 * Hook to create stable table options that work with React Compiler.
 * Memoizes all configuration to prevent unnecessary re-renders.
 */
export function useDataTableOptions<TData, TValue>(
  data: TData[],
  columns: ColumnDef<TData, TValue>[],
  config: DataTableConfig,
  state: DataTableState,
  handlers: DataTableHandlers
): TableOptions<TData> {
  const {
    pagination,
    enableSorting,
    enableColumnFilters,
    enableColumnVisibility,
    enableRowSelection,
    searchable,
    defaultPageSize,
  } = config;

  // Memoize the table options to create stable references
  return useMemo(
    (): TableOptions<TData> => ({
      data,
      columns,
      getCoreRowModel: coreRowModel,
      getPaginationRowModel: pagination ? paginationRowModel : undefined,
      getSortedRowModel: enableSorting ? sortedRowModel : undefined,
      getFilteredRowModel: enableColumnFilters ? filteredRowModel : undefined,
      onSortingChange: enableSorting ? handlers.setSorting : undefined,
      onColumnFiltersChange: enableColumnFilters ? handlers.setColumnFilters : undefined,
      onColumnVisibilityChange: enableColumnVisibility ? handlers.setColumnVisibility : undefined,
      onRowSelectionChange: handlers.setRowSelection,
      onGlobalFilterChange: handlers.setGlobalFilter,
      state: {
        sorting: enableSorting ? state.sorting : [],
        columnFilters: enableColumnFilters ? state.columnFilters : [],
        columnVisibility: enableColumnVisibility ? state.columnVisibility : {},
        rowSelection: state.rowSelection ?? {},
        globalFilter: searchable ? state.globalFilter : '',
      },
      enableRowSelection,
      initialState: {
        pagination: {
          pageSize: defaultPageSize,
        },
      },
    }),
    [
      data,
      columns,
      pagination,
      enableSorting,
      enableColumnFilters,
      enableColumnVisibility,
      enableRowSelection,
      searchable,
      defaultPageSize,
      state.sorting,
      state.columnFilters,
      state.columnVisibility,
      state.rowSelection,
      state.globalFilter,
      handlers,
    ]
  );
}

/**
 * Hook to create a memoized config object from props.
 */
export function useDataTableConfig(props: {
  pagination: boolean;
  enableSorting: boolean;
  enableColumnFilters: boolean;
  enableColumnVisibility: boolean;
  enableRowSelection: boolean;
  searchable: boolean;
  defaultPageSize: number;
}): DataTableConfig {
  return useMemo(
    () => ({
      pagination: props.pagination,
      enableSorting: props.enableSorting,
      enableColumnFilters: props.enableColumnFilters,
      enableColumnVisibility: props.enableColumnVisibility,
      enableRowSelection: props.enableRowSelection,
      searchable: props.searchable,
      defaultPageSize: props.defaultPageSize,
    }),
    [
      props.pagination,
      props.enableSorting,
      props.enableColumnFilters,
      props.enableColumnVisibility,
      props.enableRowSelection,
      props.searchable,
      props.defaultPageSize,
    ]
  );
}

/**
 * Main hook that combines all table functionality.
 * This is the primary hook for using the DataTable.
 */
export function useDataTable<TData, TValue>(
  data: TData[],
  columns: ColumnDef<TData, TValue>[],
  config: DataTableConfig
) {
  const { state, handlers } = useDataTableState();
  const tableOptions = useDataTableOptions(data, columns, config, state, handlers);

  // Create table instance
  // Note: useReactTable returns unstable function references by design.
  // We've manually optimized inputs via useDataTableOptions to minimize re-renders.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable(tableOptions);

  return {
    table,
    state,
    handlers,
  };
}

/**
 * Hook to get selected row data from a table instance.
 *
 * @example
 * const { table } = useDataTable(data, columns, config);
 * const selectedUsers = useSelectedRows(table);
 */
export function useSelectedRows<TData>(table: ReturnType<typeof useReactTable<TData>>): TData[] {
  return useMemo(
    () => table.getFilteredSelectedRowModel().rows.map((row) => row.original),
    [table]
  );
}

/**
 * Hook to check if any rows are selected.
 *
 * @example
 * const { table } = useDataTable(data, columns, config);
 * const hasSelection = useHasSelection(table);
 */
export function useHasSelection<TData>(table: ReturnType<typeof useReactTable<TData>>): boolean {
  return table.getFilteredSelectedRowModel().rows.length > 0;
}
