import { createFileRoute } from '@tanstack/react-router';

/**
 * Admin root route - check for admin permissions.
 * Only superusers can access the admin panel.
 * Authorization is handled by the sidebar visibility and component-level checks.
 */
export const Route = createFileRoute('/_protected/admin/')({});
