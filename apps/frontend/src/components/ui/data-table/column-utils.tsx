/**
 * DataTable Column Utilities
 *
 * Helper functions for creating common column definitions.
 */

import type { ColumnDef } from '@tanstack/react-table';
import { SelectAllCheckbox, SelectRowCheckbox } from './data-table-row-selection';

/**
 * Creates a selection column for the DataTable.
 * Add this as the first column when enableRowSelection is true.
 *
 * @example
 * const columns = [
 *   createSelectionColumn<User>(),
 *   { accessorKey: 'name', header: 'Name' },
 *   { accessorKey: 'email', header: 'Email' },
 * ];
 */
export function createSelectionColumn<TData>(): ColumnDef<TData> {
  return {
    id: 'select',
    header: ({ table }) => <SelectAllCheckbox table={table} />,
    cell: ({ row }) => <SelectRowCheckbox row={row} />,
    enableSorting: false,
    enableHiding: false,
    size: 40,
  };
}
