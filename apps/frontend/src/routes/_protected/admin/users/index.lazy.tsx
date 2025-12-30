import { createLazyFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/layout/page-header';
import { UserRolesList } from '@/components/admin';
import { useFetchAdminUsers, useFetchRoles } from '@/hooks/api';
import { useTranslationNamespace } from '@/hooks/useTranslation';
import { Alert, AlertDescription } from '@/components/ui/alert';

function UsersPage() {
  const { t } = useTranslationNamespace('admin');

  const { data: users, isLoading: usersLoading, error: usersError } = useFetchAdminUsers();
  const { data: roles, isLoading: rolesLoading, error: rolesError } = useFetchRoles();

  const error = usersError || rolesError;
  const isLoading = usersLoading || rolesLoading;

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader title={t('users.page_title')} description={t('users.page_description')} />

        {error && (
          <Alert variant="danger">
            <AlertDescription>{t('common.error_loading_data')}</AlertDescription>
          </Alert>
        )}

        <UserRolesList users={users || []} roles={roles || []} isLoading={isLoading} />
      </div>
    </AppLayout>
  );
}

export const Route = createLazyFileRoute('/_protected/admin/users/')({
  component: UsersPage,
});
