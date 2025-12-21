import {
  createRootRouteWithContext,
  NavigateOptions,
  Outlet,
  ToOptions,
  useRouter,
} from '@tanstack/react-router';
import '@fontsource-variable/roboto';

import React, { Suspense } from 'react';
import { RouteContext } from '@/lib/types.ts';
import { RouterProvider } from 'react-router-dom';

declare module '@react-types/shared' {
  interface RouterConfig {
    href: ToOptions;
    routerOptions: Omit<NavigateOptions, keyof ToOptions>;
  }
}

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
  const router = useRouter();

  return (
    <RouterProvider
      navigate={(href, opts) => {
        const options = typeof href === 'string' ? { href, ...opts } : { ...href, ...opts };

        return router.navigate(options);
      }}
      useHref={(href) => {
        if (href) {
          return router.buildLocation(href as ToOptions).href;
        }

        return '/';
      }}
    >
      <Outlet />
      <Suspense>
        <TanStackRouterDevtools />
      </Suspense>
    </RouterProvider>
  );
}

export const Route = createRootRouteWithContext<RouteContext>()({
  component: Root,
});
