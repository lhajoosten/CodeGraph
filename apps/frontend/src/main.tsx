import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import { isAxiosError } from 'axios';
import { Link, RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from '@/routeTree.gen.ts';
import { RouteContext } from '@/lib/types.ts';

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
  defaultErrorComponent: () => (
    <div className="flex size-full flex-col items-center justify-center gap-6">
      {/*<Logo />*/}
      <div className="flex flex-col items-center justify-center gap-3">
        <h1 className="text-2xl font-bold text-text-primary">Oops! Something went wrong.</h1>
        <p className="max-w-lg text-center text-sm text-text-secondary">
          An unexpected error has occurred. Please try again later or contact support if the problem
          persists.
        </p>
      </div>
      <Link to="/">Return Home</Link>
    </div>
  ),
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
