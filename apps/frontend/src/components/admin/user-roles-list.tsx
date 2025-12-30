import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { UserPermissionsResponse, RoleWithPermissionsResponse } from '@/openapi/types.gen';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslationNamespace } from '@/hooks/useTranslation';
import { UserRoleAssignment } from './user-role-assignment';

interface UserRolesListProps {
  users: UserPermissionsResponse[];
  roles: RoleWithPermissionsResponse[];
  isLoading?: boolean;
}

/**
 * Table displaying all users with their assigned roles and permissions.
 * Includes actions to manage role assignments.
 */
export function UserRolesList({ users, roles, isLoading }: UserRolesListProps) {
  const { t } = useTranslationNamespace('admin');
  const [selectedUser, setSelectedUser] = useState<UserPermissionsResponse | null>(null);

  const columns = useMemo<ColumnDef<UserPermissionsResponse>[]>(
    () => [
      {
        accessorKey: 'user_id',
        header: t('users.columns.user_id'),
        cell: ({ row }) => <span className="font-mono text-sm">#{row.original.user_id}</span>,
      },
      {
        id: 'role',
        header: t('users.columns.role'),
        cell: ({ row }) => {
          if (row.original.is_superuser) {
            return (
              <Badge variant="danger" size="sm">
                {t('users.superuser')}
              </Badge>
            );
          }

          if (row.original.role) {
            return (
              <Badge variant="default" size="sm" className="capitalize">
                {row.original.role.name}
              </Badge>
            );
          }

          return <span className="text-sm text-text-secondary">{t('users.no_role')}</span>;
        },
      },
      {
        id: 'permissions',
        header: t('users.columns.permissions'),
        cell: ({ row }) => (
          <span className="text-sm text-text-secondary">
            {row.original.permissions?.length || 0} {t('users.permissions_count')}
          </span>
        ),
      },
      {
        id: 'actions',
        header: t('users.columns.actions'),
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedUser(row.original)}
            disabled={row.original.is_superuser}
          >
            {t('users.actions.manage_roles')}
          </Button>
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
    <>
      <DataTable
        columns={columns}
        data={users}
        enableColumnFilters={false}
        enableRowSelection={false}
        searchable={false}
        emptyMessage={t('users.empty_message')}
      />

      {selectedUser && (
        <UserRoleAssignment
          user={selectedUser}
          availableRoles={roles}
          open={!!selectedUser}
          onOpenChange={(open) => !open && setSelectedUser(null)}
        />
      )}
    </>
  );
}
