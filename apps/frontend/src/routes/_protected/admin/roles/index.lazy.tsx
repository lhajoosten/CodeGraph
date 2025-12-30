import { createLazyFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/layout/page-header';
import { RoleList } from '@/components/admin';
import { useFetchRoles } from '@/hooks/api';
import { useTranslationNamespace } from '@/hooks/useTranslation';
import { Alert, AlertDescription } from '@/components/ui/alert';

function RolesPage() {
  const { t } = useTranslationNamespace('admin');
  const { data: roles, isLoading, error } = useFetchRoles();

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader title={t('roles.page_title')} description={t('roles.page_description')} />

        {error && (
          <Alert variant="danger">
            <AlertDescription>{t('common.error_loading_data')}</AlertDescription>
          </Alert>
        )}

        <RoleList roles={roles || []} isLoading={isLoading} />
      </div>
    </AppLayout>
  );
}

export const Route = createLazyFileRoute('/_protected/admin/roles/')({
  component: RolesPage,
});
