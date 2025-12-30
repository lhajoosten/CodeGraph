import { useState } from 'react';
import type { UserPermissionsResponse, RoleWithPermissionsResponse } from '@/openapi/types.gen';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslationNamespace } from '@/hooks/useTranslation';
import { useAssignUserRole, useRemoveUserRole } from '@/hooks/api/admin';

interface UserRoleAssignmentProps {
  user: UserPermissionsResponse;
  availableRoles: RoleWithPermissionsResponse[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog for assigning or removing roles for a specific user.
 * Displays current role and allows selecting a new role.
 */
export function UserRoleAssignment({
  user,
  availableRoles,
  open,
  onOpenChange,
}: UserRoleAssignmentProps) {
  const { t } = useTranslationNamespace('admin');
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(user.role?.id || null);

  const assignMutation = useAssignUserRole();
  const removeMutation = useRemoveUserRole();

  const handleSave = async () => {
    if (selectedRoleId === null) {
      // Remove current role
      if (user.role) {
        await removeMutation.mutateAsync({
          path: {
            user_id: user.user_id,
          },
        });
      }
    } else if (selectedRoleId !== user.role?.id) {
      // Assign new role (or replace existing)
      await assignMutation.mutateAsync({
        path: { user_id: user.user_id },
        body: { role_id: selectedRoleId },
      });
    }

    onOpenChange(false);
  };

  const isLoading = assignMutation.isPending || removeMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('users.assign_role_title')}</DialogTitle>
          <DialogDescription>
            {t('users.assign_role_description', { userId: user.user_id })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {user.is_superuser && (
            <div className="rounded-lg bg-warning-bg p-3">
              <p className="text-sm text-warning-text">{t('users.superuser_warning')}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              {t('users.current_role')}
            </label>
            <div>
              {user.role ? (
                <Badge variant="default" className="capitalize">
                  {user.role.name}
                </Badge>
              ) : (
                <span className="text-sm text-text-secondary">{t('users.no_role')}</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="role-select" className="text-sm font-medium text-text-primary">
              {t('users.select_role')}
            </label>
            <select
              id="role-select"
              value={selectedRoleId || ''}
              onChange={(e) => setSelectedRoleId(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-md border border-border bg-background-2 px-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-primary focus:outline-none"
              disabled={user.is_superuser}
            >
              <option value="">{t('users.no_role')}</option>
              {availableRoles.map((role) => (
                <option key={role.id} value={role.id} className="capitalize">
                  {role.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isLoading || user.is_superuser}>
            {isLoading ? t('common.saving') : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
