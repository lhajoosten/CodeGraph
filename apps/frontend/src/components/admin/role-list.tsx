import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { RoleWithPermissionsResponse } from '@/openapi/types.gen';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslationNamespace } from '@/hooks/useTranslation';
import { Link } from '@tanstack/react-router';

interface RoleListProps {
  roles: RoleWithPermissionsResponse[];
  isLoading?: boolean;
}

/**
 * Table displaying all roles with their permissions and user counts.
 * Includes actions to view/edit role details.
 */
export function RoleList({ roles, isLoading }: RoleListProps) {
  const { t } = useTranslationNamespace('admin');

  const columns = useMemo<ColumnDef<RoleWithPermissionsResponse>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('roles.columns.name'),
        cell: ({ row }) => {
          const isSystemRole = ['admin', 'developer', 'viewer'].includes(row.original.name);
          return (
            <div className="flex items-center gap-2">
              <span className="font-medium capitalize">{row.original.name}</span>
              {isSystemRole && (
                <Badge variant="default" size="sm">
                  {t('roles.system_role')}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'description',
        header: t('roles.columns.description'),
        cell: ({ row }) => (
          <span className="text-text-secondary">{row.original.description || '-'}</span>
        ),
      },
      {
        id: 'permissions',
        header: t('roles.columns.permissions'),
        cell: ({ row }) => (
          <span className="text-text-secondary">
            {row.original.permissions?.length || 0} {t('roles.permissions_count')}
          </span>
        ),
      },
      {
        id: 'actions',
        header: t('roles.columns.actions'),
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link
                to="/admin/roles/$id"
                params={{ id: String(row.original.id) }}
                className="hover:text-primary-hover text-primary"
              >
                {t('roles.actions.view')}
              </Link>
            </Button>
          </div>
        ),
      },
    ],
    [t]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-text-secondary">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={roles}
      enableColumnFilters={false}
      enableRowSelection={false}
      searchable={true}
      searchPlaceholder={t('roles.search_placeholder')}
      emptyMessage={t('roles.empty_message')}
    />
  );
}
