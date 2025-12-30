import type { RoleWithPermissionsResponse, UserPermissionsResponse } from '@/openapi/types.gen';
import { Card } from '@/components/ui/card';
import { useTranslationNamespace } from '@/hooks/useTranslation';
import { UsersIcon, ShieldCheckIcon, KeyIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface AdminStatsProps {
  users?: UserPermissionsResponse[];
  roles?: RoleWithPermissionsResponse[];
  isLoading?: boolean;
}

/**
 * Summary statistics cards for the admin dashboard.
 * Shows totals for users, roles, superusers, and total permissions.
 */
export function AdminStats({ users = [], roles = [], isLoading }: AdminStatsProps) {
  const { t } = useTranslationNamespace('admin');

  const totalUsers = users.length;
  const totalRoles = roles.length;
  const superusersCount = users.filter((u) => u.is_superuser).length;

  // Get unique permissions across all roles
  const allPermissions = new Set(
    roles.flatMap((role) => role.permissions?.map((p) => `${p.resource}:${p.action}`) || [])
  );
  const totalPermissions = allPermissions.size;

  const stats = [
    {
      label: t('dashboard.stats.total_users'),
      value: totalUsers,
      icon: UsersIcon,
      color: 'text-primary',
    },
    {
      label: t('dashboard.stats.total_roles'),
      value: totalRoles,
      icon: ShieldCheckIcon,
      color: 'text-success',
    },
    {
      label: t('dashboard.stats.superusers'),
      value: superusersCount,
      icon: UserGroupIcon,
      color: 'text-warning',
    },
    {
      label: t('dashboard.stats.unique_permissions'),
      value: totalPermissions,
      icon: KeyIcon,
      color: 'text-info',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="bg-border h-4 w-24 rounded"></div>
              <div className="bg-border mt-2 h-8 w-16 rounded"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm font-medium">{stat.label}</p>
              <p className="text-text-primary mt-2 text-3xl font-bold">{stat.value}</p>
            </div>
            <stat.icon className={`h-8 w-8 ${stat.color}`} />
          </div>
        </Card>
      ))}
    </div>
  );
}
