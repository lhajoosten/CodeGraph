import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { Toaster } from 'sonner';
import React, { Suspense } from 'react';
import { RouteContext } from '@/lib/types.ts';
import { ErrorBoundary } from '@/components/error-boundary';

const TanStackRouterDevtools =
  process.env.NODE_ENV === 'production'
    ? () => null // Render nothing in production
    : React.lazy(() =>
        // Lazy load in development
        import('@tanstack/react-router-devtools').then((res) => ({
          default: res.TanStackRouterDevtools,
          // For Embedded Mode
          // default: res.TanStackRouterDevtoolsPanel
        }))
      );

function Root() {
  return (
    <ErrorBoundary>
      <RootContent />
    </ErrorBoundary>
  );
}

function RootContent() {
  return (
    <>
      <Outlet />
      <Toaster richColors position="top-right" theme="system" visibleToasts={3} closeButton />
      <Suspense>
        <TanStackRouterDevtools />
      </Suspense>
    </>
  );
}

export const Route = createRootRouteWithContext<RouteContext>()({
  component: Root,
});
