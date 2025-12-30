import type { RoleWithPermissionsResponse, PermissionResponse } from '@/openapi/types.gen';
import { useTranslationNamespace } from '@/hooks/useTranslation';
import { PermissionBadge } from './permission-badge';
import { Card } from '@/components/ui/card';

interface RolePermissionsProps {
  role: RoleWithPermissionsResponse;
}

/**
 * Display permissions for a role, grouped by category.
 * Currently read-only - permission management to be added when backend supports it.
 */
export function RolePermissions({ role }: RolePermissionsProps) {
  const { t } = useTranslationNamespace('admin');

  // Group permissions by resource (category)
  const groupedPermissions = (role.permissions || []).reduce(
    (acc, permission) => {
      const resource = permission.resource;
      if (!acc[resource]) {
        acc[resource] = [];
      }
      acc[resource].push(permission);
      return acc;
    },
    {} as Record<string, PermissionResponse[]>
  );

  const categories = Object.keys(groupedPermissions).sort();

  if (categories.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-text-secondary text-center">{t('roles.no_permissions')}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <Card key={category} className="p-4">
          <h3 className="text-text-primary mb-3 text-sm font-semibold capitalize">
            {category} {t('roles.permissions_category')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {groupedPermissions[category].map((permission) => (
              <PermissionBadge key={permission.id} permission={permission} showDescription />
            ))}
          </div>
          {groupedPermissions[category].length === 0 && (
            <p className="text-text-secondary text-sm">{t('roles.no_permissions_in_category')}</p>
          )}
        </Card>
      ))}

      <div className="bg-info-bg rounded-lg p-4">
        <p className="text-info-text text-sm">{t('roles.permissions_readonly_note')}</p>
      </div>
    </div>
  );
}
