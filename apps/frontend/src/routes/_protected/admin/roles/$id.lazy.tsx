import { createLazyFileRoute, Link, useParams } from '@tanstack/react-router';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/layout/page-header';
import { RolePermissions } from '@/components/admin';
import { useFetchRole } from '@/hooks/api';
import { useTranslationNamespace } from '@/hooks/useTranslation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeftIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

function RoleDetailPage() {
  const { t } = useTranslationNamespace('admin');
  const { id } = useParams({ from: '/_protected/admin/roles/$id' });
  const roleId = Number(id);

  const { data: role, isLoading, error } = useFetchRole(roleId);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (error || !role) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <PageHeader
            title={t('roles.detail_page_title')}
            description={t('roles.detail_page_description')}
          />
          <Alert variant="danger">
            <AlertDescription>{t('roles.error_loading_role')}</AlertDescription>
          </Alert>
          <Link to="/admin/roles">
            <Button variant="outline">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              {t('common.back_to_list')}
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const isSystemRole = ['admin', 'developer', 'viewer'].includes(role.name);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/admin/roles">
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
          </Link>
          <div className="mb-6 flex items-center gap-4">
            <ShieldCheckIcon className="text-primary h-8 w-8" />
            <div className="flex-1">
              <h1 className="text-text-primary text-2xl font-bold tracking-tight sm:text-3xl">
                <span className="capitalize">{role.name}</span>
                {isSystemRole && (
                  <Badge variant="default" size="sm" className="ml-3">
                    {t('roles.system_role')}
                  </Badge>
                )}
              </h1>
              {role.description && (
                <p className="text-text-secondary mt-1">
                  {role.description || t('roles.no_description')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Role Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t('roles.role_information')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">{t('roles.columns.name')}</span>
              <span className="text-text-primary font-medium capitalize">{role.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">{t('roles.columns.description')}</span>
              <span className="text-text-primary font-medium">{role.description || '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">{t('roles.total_permissions')}</span>
              <span className="text-text-primary font-medium">{role.permissions?.length || 0}</span>
            </div>
            {isSystemRole && (
              <Alert>
                <AlertDescription>{t('roles.system_role_info')}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Permissions */}
        <div className="space-y-4">
          <h2 className="text-text-primary text-xl font-semibold">
            {t('roles.permissions_section')}
          </h2>
          <RolePermissions role={role} />
        </div>
      </div>
    </AppLayout>
  );
}

export const Route = createLazyFileRoute('/_protected/admin/roles/$id')({
  component: RoleDetailPage,
});
