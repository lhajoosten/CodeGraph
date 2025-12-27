/**
 * DataTable Search Component
 *
 * Global search input for filtering table data.
 */

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useCallback } from 'react';

export interface DataTableSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function DataTableSearch({
  value,
  onChange,
  placeholder = 'Search...',
  className,
}: DataTableSearchProps) {
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value);
    },
    [onChange]
  );

  return (
    <div className={cn('flex flex-1 items-center space-x-2', className)}>
      <Input
        placeholder={placeholder}
        value={value ?? ''}
        onChange={handleChange}
        className="h-10 w-full max-w-sm"
        leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
      />
    </div>
  );
}
