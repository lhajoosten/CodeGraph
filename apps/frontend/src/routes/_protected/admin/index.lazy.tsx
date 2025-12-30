import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminStats } from '@/components/admin';
import { useFetchRoles, useFetchAdminUsers } from '@/hooks/api';
import { useTranslationNamespace } from '@/hooks/useTranslation';
import {
  ShieldCheckIcon,
  UsersIcon,
  KeyIcon,
  ArrowRightIcon,
  Cog6ToothIcon,
  ServerIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

function AdminDashboard() {
  const { t } = useTranslationNamespace('admin');

  const { data: roles, isLoading: rolesLoading } = useFetchRoles();
  const { data: users, isLoading: usersLoading } = useFetchAdminUsers();

  const isLoading = rolesLoading || usersLoading;

  const quickActions = [
    {
      title: t('dashboard.manage_roles.title'),
      description: t('dashboard.manage_roles.description'),
      action: t('dashboard.manage_roles.action'),
      icon: ShieldCheckIcon,
      to: '/admin/roles',
      variant: 'teal' as const,
    },
    {
      title: t('dashboard.manage_users.title'),
      description: t('dashboard.manage_users.description'),
      action: t('dashboard.manage_users.action'),
      icon: UsersIcon,
      to: '/admin/users',
      variant: 'green' as const,
    },
    {
      title: t('dashboard.view_permissions.title'),
      description: t('dashboard.view_permissions.description'),
      action: t('dashboard.view_permissions.action'),
      icon: KeyIcon,
      to: '/admin/roles',
      variant: 'amber' as const,
    },
  ];

  const variantStyles = {
    teal: {
      iconBg: 'bg-gradient-to-br from-brand-teal/20 to-brand-cyan/20 border border-brand-teal/30',
      iconColor: 'text-brand-teal',
      hoverBorder: 'group-hover:border-brand-teal/50',
    },
    green: {
      iconBg: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30',
      iconColor: 'text-green-500',
      hoverBorder: 'group-hover:border-green-500/50',
    },
    amber: {
      iconBg: 'bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30',
      iconColor: 'text-amber-500',
      hoverBorder: 'group-hover:border-amber-500/50',
    },
  };

  // Calculate system stats
  const superusersCount = users?.filter((u) => u.is_superuser).length || 0;
  const systemRolesCount =
    roles?.filter((r) => ['admin', 'developer', 'viewer'].includes(r.name)).length || 0;
  const allPermissions = new Set(
    roles?.flatMap((role) => role.permissions?.map((p) => `${p.resource}:${p.action}`) || []) || []
  );

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-teal/10 via-brand-cyan/5 to-background p-8 shadow-elevated">
          {/* Decorative pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <Cog6ToothIcon className="h-6 w-6 text-brand-teal" />
                <span className="text-sm font-medium tracking-wide text-brand-teal uppercase">
                  Administration
                </span>
              </div>
              <h1 className="mb-2 text-4xl font-bold tracking-tight text-text-primary">
                {t('dashboard.title')}
              </h1>
              <p className="text-lg text-text-secondary">{t('dashboard.description')}</p>
            </div>

            <div className="flex items-center gap-3">
              <Button asChild size="lg" className="bg-gradient-teal gap-2 shadow-button-hover">
                <Link to="/admin/users">
                  <UsersIcon className="h-5 w-5" />
                  Manage Users
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-brand-teal" />
            <h2 className="text-sm font-semibold tracking-wide text-text-secondary uppercase">
              Overview
            </h2>
          </div>
          <AdminStats users={users} roles={roles} isLoading={isLoading} />
        </div>

        {/* Quick Actions Grid */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-brand-teal" />
            <h2 className="text-sm font-semibold tracking-wide text-text-secondary uppercase">
              Quick Actions
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action, index) => {
              const styles = variantStyles[action.variant];
              return (
                <Card
                  key={index}
                  className={cn(
                    'hc-skel-item group relative overflow-hidden transition-all duration-300',
                    'hover:shadow-card-hover',
                    styles.hoverBorder
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Hover gradient overlay */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-teal/0 to-brand-cyan/0 opacity-0 transition-opacity duration-300 group-hover:from-brand-teal/5 group-hover:to-brand-cyan/5 group-hover:opacity-100" />

                  <CardHeader className="relative pb-2">
                    <div
                      className={cn(
                        'mb-4 flex h-14 w-14 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110',
                        styles.iconBg
                      )}
                    >
                      <action.icon className={cn('h-7 w-7', styles.iconColor)} />
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary">{action.title}</h3>
                    <p className="text-sm text-text-muted">{action.description}</p>
                  </CardHeader>
                  <CardContent className="relative pt-0">
                    <Button
                      asChild
                      variant="outline"
                      className="w-full justify-between group-hover:border-brand-teal/50 group-hover:text-brand-teal"
                    >
                      <Link to={action.to as '/admin/roles' | '/admin/users'}>
                        {action.action}
                        <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* System Info Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* System Information */}
          <Card className="hc-skel-item border-accent-left shadow-card">
            <CardHeader>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
                <ServerIcon className="h-5 w-5 text-brand-cyan" />
                {t('dashboard.system_info.title')}
              </h2>
              <p className="text-sm text-text-muted">{t('dashboard.system_info.description')}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-surface-secondary/50 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-teal/10">
                    <ShieldCheckIcon className="h-5 w-5 text-brand-teal" />
                  </div>
                  <span className="text-sm text-text-secondary">
                    {t('dashboard.system_info.roles_count')}
                  </span>
                </div>
                <span className="text-xl font-bold text-text-primary">{roles?.length || 0}</span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-surface-secondary/50 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                    <UsersIcon className="h-5 w-5 text-green-500" />
                  </div>
                  <span className="text-sm text-text-secondary">
                    {t('dashboard.system_info.users_count')}
                  </span>
                </div>
                <span className="text-xl font-bold text-text-primary">{users?.length || 0}</span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-surface-secondary/50 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                    <KeyIcon className="h-5 w-5 text-amber-500" />
                  </div>
                  <span className="text-sm text-text-secondary">
                    {t('dashboard.system_info.system_roles')}
                  </span>
                </div>
                <span className="text-xl font-bold text-text-primary">{systemRolesCount}</span>
              </div>
            </CardContent>
          </Card>

          {/* Security Overview */}
          <Card
            className="hc-skel-item border-accent-top shadow-card"
            style={{ animationDelay: '50ms' }}
          >
            <CardHeader>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
                <ChartBarIcon className="h-5 w-5 text-brand-teal" />
                Security Overview
              </h2>
              <p className="text-sm text-text-muted">Access control statistics</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-warning-bg p-4 text-center">
                  <p className="text-3xl font-bold text-warning">{superusersCount}</p>
                  <p className="mt-1 text-xs text-warning/80">Superusers</p>
                </div>
                <div className="rounded-lg bg-blue-500/10 p-4 text-center">
                  <p className="text-3xl font-bold text-blue-500">{allPermissions.size}</p>
                  <p className="mt-1 text-xs text-blue-500/80">Unique Permissions</p>
                </div>
              </div>

              <div className="rounded-lg border border-border-primary p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-text-muted">Permission Coverage</span>
                  <span className="font-medium text-text-primary">
                    {roles?.length
                      ? Math.round((allPermissions.size / (roles.length * 10)) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-secondary">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-teal to-brand-cyan transition-all duration-500"
                    style={{
                      width: `${roles?.length ? Math.min(100, (allPermissions.size / (roles.length * 10)) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

export const Route = createLazyFileRoute('/_protected/admin/')({
  component: AdminDashboard,
});
