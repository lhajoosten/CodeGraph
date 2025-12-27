/**
 * DataTable Component Library
 *
 * A modular, feature-rich data table built on TanStack Table.
 *
 * @example Basic usage
 * ```tsx
 * import { DataTable } from '@/components/ui/data-table';
 *
 * const columns = [
 *   { accessorKey: 'name', header: 'Name' },
 *   { accessorKey: 'email', header: 'Email' },
 * ];
 *
 * <DataTable columns={columns} data={users} />
 * ```
 *
 * @example With row selection
 * ```tsx
 * import { DataTable, createSelectionColumn } from '@/components/ui/data-table';
 *
 * const columns = [
 *   createSelectionColumn<User>(),
 *   { accessorKey: 'name', header: 'Name' },
 * ];
 *
 * <DataTable
 *   columns={columns}
 *   data={users}
 *   enableRowSelection
 *   onRowSelectionChange={(selected) => console.log(selected)}
 * />
 * ```
 *
 * @example With custom column headers (sortable)
 * ```tsx
 * import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
 *
 * const columns = [
 *   {
 *     accessorKey: 'name',
 *     header: ({ column }) => (
 *       <DataTableColumnHeader column={column} title="Name" />
 *     ),
 *   },
 * ];
 * ```
 */

// Main component
export { DataTable } from './data-table';

// Sub-components for custom compositions
export { DataTableToolbar } from './data-table-toolbar';
export { DataTableBody } from './data-table-body';
export { DataTablePagination } from './data-table-pagination';
export { DataTableSearch } from './data-table-search';
export { DataTableColumnVisibility } from './data-table-column-visibility';
export { DataTableColumnHeader } from './data-table-column-header';

// Row selection utilities
export { createSelectionColumn } from './column-utils';
export { SelectAllCheckbox, SelectRowCheckbox } from './data-table-row-selection';

// Hooks for custom implementations
export {
  useDataTable,
  useDataTableState,
  useDataTableConfig,
  useDataTableOptions,
  useSelectedRows,
  useHasSelection,
} from './hooks';

// Types
export type {
  DataTableProps,
  DataTableConfig,
  DataTableState,
  DataTableHandlers,
  DataTableToolbarProps,
  DataTableContentProps,
  DataTablePaginationProps,
  DataTableColumnHeaderProps,
  DataTableSearchProps,
  DataTableColumnVisibilityProps,
  DataTablePageSizeProps,
} from './types';
