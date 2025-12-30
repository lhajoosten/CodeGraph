import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { AppLayout } from '@/components/layout/app-layout';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { UserRolesList } from '@/components/admin';
import { useFetchAdminUsers, useFetchRoles } from '@/hooks/api';
import { useTranslationNamespace } from '@/hooks/useTranslation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  UsersIcon,
  ArrowLeftIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

function UsersPage() {
  const { t } = useTranslationNamespace('admin');

  const { data: users, isLoading: usersLoading, error: usersError } = useFetchAdminUsers();
  const { data: roles, isLoading: rolesLoading, error: rolesError } = useFetchRoles();

  const error = usersError || rolesError;
  const isLoading = usersLoading || rolesLoading;

  // Stats
  const totalUsers = users?.length || 0;
  const superusersCount = users?.filter((u) => u.is_superuser).length || 0;
  const totalRoles = roles?.length || 0;

  const stats = [
    {
      label: 'Total Users',
      value: totalUsers,
      icon: UsersIcon,
      variant: 'teal' as const,
    },
    {
      label: 'Superusers',
      value: superusersCount,
      icon: UserGroupIcon,
      variant: 'amber' as const,
    },
    {
      label: 'Available Roles',
      value: totalRoles,
      icon: ShieldCheckIcon,
      variant: 'green' as const,
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
  };

  const breadcrumbItems = [{ label: 'Admin', onClick: () => {} }, { label: t('users.page_title') }];

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} />

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-teal/10 via-brand-cyan/5 to-background p-8 shadow-elevated">
          {/* Decorative pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          <div className="relative">
            {/* Back Button */}
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="mb-4 border-brand-teal/20 bg-brand-teal/10 text-brand-teal backdrop-blur hover:bg-brand-teal/20"
            >
              <Link to="/admin">
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Back to Admin
              </Link>
            </Button>

            <div className="flex items-center gap-3">
              <div className="bg-gradient-teal flex h-14 w-14 items-center justify-center rounded-xl shadow-button">
                <UsersIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-text-primary">
                  {t('users.page_title')}
                </h1>
                <p className="text-text-secondary">{t('users.page_description')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((stat, index) => {
            const styles = variantStyles[stat.variant];
            return (
              <Card
                key={index}
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
                        'flex h-12 w-12 items-center justify-center rounded-xl',
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

        {error && (
          <Alert variant="danger">
            <AlertDescription>{t('common.error_loading_data')}</AlertDescription>
          </Alert>
        )}

        {/* User List Section */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-brand-teal" />
            <h2 className="text-sm font-semibold tracking-wide text-text-secondary uppercase">
              User Management
            </h2>
            {totalUsers > 0 && (
              <span className="ml-2 rounded-full bg-surface-secondary px-2 py-0.5 text-xs text-text-muted">
                {totalUsers} users
              </span>
            )}
          </div>
          <UserRolesList users={users || []} roles={roles || []} isLoading={isLoading} />
        </div>
      </div>
    </AppLayout>
  );
}

export const Route = createLazyFileRoute('/_protected/admin/users/')({
  component: UsersPage,
});
