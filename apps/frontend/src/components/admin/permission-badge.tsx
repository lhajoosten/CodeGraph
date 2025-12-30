import type { PermissionResponse } from '@/openapi/types.gen';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PermissionBadgeProps {
  permission: PermissionResponse;
  className?: string;
  showDescription?: boolean;
}

/**
 * Badge component for displaying a permission with category-based color coding.
 *
 * Category colors:
 * - task: blue
 * - agent: purple
 * - webhook: green
 * - admin: red
 */
export function PermissionBadge({
  permission,
  className,
  showDescription = false,
}: PermissionBadgeProps) {
  const getCategoryVariant = (resource: string): 'default' | 'success' | 'warning' | 'danger' => {
    switch (resource.toLowerCase()) {
      case 'task':
        return 'default';
      case 'agent':
        return 'warning';
      case 'webhook':
        return 'success';
      case 'admin':
        return 'danger';
      default:
        return 'default';
    }
  };

  const permissionCode = `${permission.resource}:${permission.action}`;

  return (
    <Badge
      variant={getCategoryVariant(permission.resource)}
      size="sm"
      className={cn('font-mono text-xs', className)}
      title={showDescription ? permission.description || undefined : permissionCode}
    >
      {permissionCode}
    </Badge>
  );
}
