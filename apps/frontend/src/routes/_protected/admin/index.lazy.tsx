import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminStats } from '@/components/admin';
import { useFetchRoles, useFetchAdminUsers } from '@/hooks/api';
import { useHasMounted } from '@/hooks/common';
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
  const hasMounted = useHasMounted();

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
      iconBg: 'bg-linear-to-br from-brand-teal/20 to-brand-cyan/20 border border-brand-teal/30',
      iconColor: 'text-brand-teal',
      hoverBorder: 'group-hover:border-brand-teal/50',
    },
    green: {
      iconBg: 'bg-linear-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30',
      iconColor: 'text-green-500',
      hoverBorder: 'group-hover:border-green-500/50',
    },
    amber: {
      iconBg: 'bg-linear-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30',
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
        {/* Hero Section - Enhanced with animated orbs */}
        <div className="noise relative overflow-hidden rounded-2xl bg-linear-to-br from-brand-teal/10 via-brand-cyan/5 to-background p-8 shadow-elevated">
          {/* Animated gradient orbs */}
          <div className="orb orb-teal orb-animated pointer-events-none absolute -top-24 -right-24 h-72 w-72 opacity-20" />
          <div className="orb orb-cyan animate-drift-reverse pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 opacity-15" />
          <div className="orb orb-purple animate-drift-slow pointer-events-none absolute top-1/2 right-1/4 h-40 w-40 -translate-y-1/2 opacity-10" />

          {/* Decorative pattern */}
          <div
            className="pointer-events-none absolute inset-0 opacity-5"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="flex-1">
              <div
                className={cn(
                  'mb-4 flex items-center gap-3',
                  hasMounted ? 'animate-slide-up' : 'opacity-0'
                )}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-brand-teal-400 to-brand-cyan shadow-lg">
                  <Cog6ToothIcon className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm font-medium tracking-wide text-brand-teal uppercase">
                  Administration
                </span>
              </div>
              <h1
                className={cn(
                  'mb-2 text-4xl font-bold tracking-tight text-text-primary',
                  hasMounted ? 'stagger-1 animate-slide-up' : 'opacity-0'
                )}
              >
                <span className="text-gradient-animated">{t('dashboard.title')}</span>
              </h1>
              <p
                className={cn(
                  'text-lg text-text-secondary',
                  hasMounted ? 'stagger-2 animate-slide-up' : 'opacity-0'
                )}
              >
                {t('dashboard.description')}
              </p>
            </div>

            <div
              className={cn(
                'flex items-center gap-3',
                hasMounted ? 'stagger-3 animate-slide-up' : 'opacity-0'
              )}
            >
              <Button
                asChild
                size="lg"
                className="group bg-gradient-teal relative gap-2 overflow-hidden shadow-button-hover transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Link to="/admin/users">
                  {/* Shine effect */}
                  <span className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <UsersIcon className="h-5 w-5 transition-transform group-hover:scale-110" />
                  <span className="relative">Manage Users</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className={hasMounted ? 'stagger-4 animate-slide-up' : 'opacity-0'}>
          <div className="mb-4 flex items-center gap-2">
            <div className="status-dot-premium status-alive" />
            <h2 className="text-sm font-semibold tracking-wide text-text-secondary uppercase">
              Overview
            </h2>
          </div>
          <AdminStats users={users} roles={roles} isLoading={isLoading} />
        </div>

        {/* Quick Actions Grid */}
        <div className={hasMounted ? 'stagger-5 animate-slide-up' : 'opacity-0'}>
          <div className="mb-4 flex items-center gap-2">
            <div className="status-dot-premium status-working" />
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
                    'group relative overflow-hidden transition-all duration-300',
                    'hover-lift-premium glass-subtle',
                    styles.hoverBorder,
                    hasMounted ? 'animate-slide-up' : 'opacity-0'
                  )}
                  style={{ animationDelay: `${300 + index * 100}ms` }}
                >
                  {/* Hover gradient overlay */}
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-brand-teal/0 to-brand-cyan/0 opacity-0 transition-opacity duration-300 group-hover:from-brand-teal/5 group-hover:to-brand-cyan/5 group-hover:opacity-100" />

                  <CardHeader className="relative pb-2">
                    <div
                      className={cn(
                        'mb-4 flex h-14 w-14 items-center justify-center rounded-xl shadow-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg',
                        styles.iconBg
                      )}
                    >
                      <action.icon
                        className={cn(
                          'h-7 w-7 transition-transform group-hover:rotate-6',
                          styles.iconColor
                        )}
                      />
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary transition-colors group-hover:text-primary">
                      {action.title}
                    </h3>
                    <p className="text-sm text-text-muted">{action.description}</p>
                  </CardHeader>
                  <CardContent className="relative pt-0">
                    <Button
                      asChild
                      variant="outline"
                      className="w-full justify-between transition-all group-hover:border-brand-teal/50 group-hover:text-brand-teal"
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
                    className="h-full rounded-full bg-linear-to-r from-brand-teal to-brand-cyan transition-all duration-500"
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
