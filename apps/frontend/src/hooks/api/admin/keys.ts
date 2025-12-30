/**
 * Admin query key factory for TanStack Query cache management.
 * Provides structured query keys for consistent cache invalidation.
 */

export const adminQueryKeys = {
  all: ['admin'] as const,

  // Roles
  roles: () => [...adminQueryKeys.all, 'roles'] as const,
  rolesList: () => [...adminQueryKeys.roles(), 'list'] as const,
  role: (roleId: number) => [...adminQueryKeys.roles(), roleId] as const,

  // Permissions
  permissions: () => [...adminQueryKeys.all, 'permissions'] as const,
  permissionsList: () => [...adminQueryKeys.permissions(), 'list'] as const,

  // Users
  users: () => [...adminQueryKeys.all, 'users'] as const,
  usersList: (filters?: { page?: number; pageSize?: number }) =>
    [...adminQueryKeys.users(), 'list', { filters }] as const,
  userPermissions: (userId: number) => [...adminQueryKeys.users(), userId, 'permissions'] as const,
};
