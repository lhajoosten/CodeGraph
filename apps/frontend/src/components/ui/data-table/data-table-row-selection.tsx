/**
 * DataTable Row Selection Components
 *
 * Checkbox components for row selection.
 */

import { Checkbox } from '@/components/ui/checkbox';
import type { Row, Table } from '@tanstack/react-table';
import { useCallback } from 'react';

/**
 * Checkbox for selecting all rows on the current page
 */
interface SelectAllCheckboxProps<TData> {
  table: Table<TData>;
}

export function SelectAllCheckbox<TData>({ table }: SelectAllCheckboxProps<TData>) {
  const isAllSelected = table.getIsAllPageRowsSelected();
  const isSomeSelected = table.getIsSomePageRowsSelected();

  const handleChange = useCallback(
    (checked: boolean) => {
      table.toggleAllPageRowsSelected(checked);
    },
    [table]
  );

  return (
    <Checkbox
      checked={isAllSelected || (isSomeSelected && 'indeterminate')}
      onCheckedChange={handleChange}
      aria-label="Select all rows"
    />
  );
}

/**
 * Checkbox for selecting a single row
 */
interface SelectRowCheckboxProps<TData> {
  row: Row<TData>;
}

export function SelectRowCheckbox<TData>({ row }: SelectRowCheckboxProps<TData>) {
  const handleChange = useCallback(
    (checked: boolean) => {
      row.toggleSelected(checked);
    },
    [row]
  );

  return (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={handleChange}
      aria-label="Select row"
    />
  );
}
