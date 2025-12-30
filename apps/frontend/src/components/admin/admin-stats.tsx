import type { RoleWithPermissionsResponse, UserPermissionsResponse } from '@/openapi/types.gen';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslationNamespace } from '@/hooks/useTranslation';
import { UsersIcon, ShieldCheckIcon, KeyIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

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
      variant: 'teal' as const,
    },
    {
      label: t('dashboard.stats.total_roles'),
      value: totalRoles,
      icon: ShieldCheckIcon,
      variant: 'green' as const,
    },
    {
      label: t('dashboard.stats.superusers'),
      value: superusersCount,
      icon: UserGroupIcon,
      variant: 'amber' as const,
    },
    {
      label: t('dashboard.stats.unique_permissions'),
      value: totalPermissions,
      icon: KeyIcon,
      variant: 'blue' as const,
    },
  ];

  const variantStyles = {
    teal: {
      iconBg: 'bg-gradient-to-br from-brand-teal/20 to-brand-cyan/20 border border-brand-teal/30',
      iconColor: 'text-brand-teal',
    },
    green: {
      iconBg: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30',
      iconColor: 'text-green-500',
    },
    amber: {
      iconBg: 'bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30',
      iconColor: 'text-amber-500',
    },
    blue: {
      iconBg: 'bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30',
      iconColor: 'text-blue-500',
    },
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-accent-top overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-20 animate-pulse rounded bg-surface-secondary" />
                  <div className="h-8 w-14 animate-pulse rounded bg-surface-secondary" />
                </div>
                <div className="h-12 w-12 animate-pulse rounded-xl bg-surface-secondary" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const styles = variantStyles[stat.variant];
        return (
          <Card
            key={stat.label}
            className={cn(
              'hc-skel-item border-accent-top overflow-hidden transition-all duration-300 hover:shadow-card-hover'
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-muted">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-text-primary">{stat.value}</p>
                </div>
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 hover:scale-110',
                    styles.iconBg
                  )}
                >
                  <stat.icon className={cn('h-6 w-6', styles.iconColor)} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
