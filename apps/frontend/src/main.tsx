import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import { isAxiosError } from 'axios';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from '@/routeTree.gen.ts';
import { RouteContext } from '@/lib/types.ts';

// Initialize API client configuration (must be imported before any API calls)
import '@/lib/api-client';

// Initialize i18n (must be imported before rendering)
import '@/locales/config';

if (import.meta.env.VITE_ENABLE_SCAN === 'true') {
  import('react-scan').then(({ scan }) => {
    scan({ enabled: true });
  });
}

// Create a new router instance
export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  context: { user: null } satisfies RouteContext,
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export const queryClient = new QueryClient(
  process.env.NODE_ENV === 'development'
    ? {
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
        queryCache: new QueryCache({
          onSuccess: () => {},
        }),
      }
    : {
        defaultOptions: {
          queries: {
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors
              if (isAxiosError(error)) {
                if (error.status && `${error.status}`.startsWith('4')) return false;
              }
              return failureCount < 3;
            },
          },
        },
      }
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
