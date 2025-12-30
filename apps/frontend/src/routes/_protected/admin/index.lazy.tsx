import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminStats } from '@/components/admin';
import { useFetchRoles, useFetchAdminUsers } from '@/hooks/api';
import { useTranslationNamespace } from '@/hooks/useTranslation';
import { ShieldCheckIcon, UsersIcon, KeyIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

function AdminDashboard() {
  const { t } = useTranslationNamespace('admin');

  const { data: roles, isLoading: rolesLoading } = useFetchRoles();
  const { data: users, isLoading: usersLoading } = useFetchAdminUsers();

  const isLoading = rolesLoading || usersLoading;

  return (
    <AppLayout>
      <div className="space-y-8">
        <PageHeader title={t('dashboard.title')} description={t('dashboard.description')} />

        {/* Stats Section */}
        <AdminStats users={users} roles={roles} isLoading={isLoading} />

        {/* Quick Actions Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Manage Roles */}
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <ShieldCheckIcon className="text-primary h-8 w-8" />
              </div>
              <CardTitle className="mt-4">{t('dashboard.manage_roles.title')}</CardTitle>
              <CardDescription>{t('dashboard.manage_roles.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin/roles">
                <Button variant="outline" className="w-full justify-between">
                  {t('dashboard.manage_roles.action')}
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Manage Users */}
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <UsersIcon className="text-success h-8 w-8" />
              </div>
              <CardTitle className="mt-4">{t('dashboard.manage_users.title')}</CardTitle>
              <CardDescription>{t('dashboard.manage_users.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin/users">
                <Button variant="outline" className="w-full justify-between">
                  {t('dashboard.manage_users.action')}
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* View Permissions */}
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <KeyIcon className="text-warning h-8 w-8" />
              </div>
              <CardTitle className="mt-4">{t('dashboard.view_permissions.title')}</CardTitle>
              <CardDescription>{t('dashboard.view_permissions.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin/roles">
                <Button variant="outline" className="w-full justify-between">
                  {t('dashboard.view_permissions.action')}
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.system_info.title')}</CardTitle>
            <CardDescription>{t('dashboard.system_info.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">{t('dashboard.system_info.roles_count')}</span>
              <span className="text-text-primary font-medium">{roles?.length || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">{t('dashboard.system_info.users_count')}</span>
              <span className="text-text-primary font-medium">{users?.length || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">{t('dashboard.system_info.system_roles')}</span>
              <span className="text-text-primary font-medium">
                {roles?.filter((r) => ['admin', 'developer', 'viewer'].includes(r.name)).length ||
                  0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

export const Route = createLazyFileRoute('/_protected/admin/')({
  component: AdminDashboard,
});
