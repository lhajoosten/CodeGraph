import { createLazyFileRoute, useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { client } from '@/openapi/client.gen';
import { useAuthStore } from '@/stores/auth-store';
import { getErrorMessage, type ApiError } from '@/lib/error-handler';

export const Route = createLazyFileRoute('/_public/oauth/callback/$provider')({
  component: OAuthCallback,
});

interface CurrentUserResponse {
  id: number;
  email: string;
  email_verified: boolean;
}

function OAuthCallback() {
  const navigate = useNavigate();
  const { provider } = useParams({ from: '/_public/oauth/callback/$provider' });
  const search = useSearch({ from: '/_public/oauth/callback/$provider' });
  const { error: oauthError, error_description } = search;

  const { login } = useAuthStore();
  const processedRef = useRef(false);

  // Fetch current user to complete authentication
  const {
    data: currentUser,
    isError,
    error: fetchError,
    isLoading,
  } = useQuery({
    queryKey: ['current-user-oauth'],
    queryFn: async () => {
      const response = await client.get<CurrentUserResponse>({
        url: '/api/v1/users/me',
      });
      return response.data;
    },
    enabled: !oauthError, // Only fetch if no OAuth error
    retry: 1,
  });

  // Derive status and error message from OAuth params and query state
  const status: 'loading' | 'success' | 'error' = (() => {
    if (oauthError) return 'error';
    if (isError) return 'error';
    if (currentUser) return 'success';
    return 'loading';
  })();

  const errorMessage = (() => {
    if (oauthError) {
      return error_description || oauthError;
    }
    if (isError && fetchError) {
      return getErrorMessage(fetchError as ApiError);
    }
    return 'Failed to complete authentication';
  })();

  useEffect(() => {
    // Only process once
    if (processedRef.current) return;

    // Wait for query to complete (either success or error)
    if (!oauthError && isLoading) return;

    // If we have an OAuth error, don't process auth
    if (oauthError) {
      processedRef.current = true;
      return;
    }

    // If fetch errored or no user, don't process
    if (isError || !currentUser) {
      processedRef.current = true;
      return;
    }

    processedRef.current = true;

    // Authentication successful - update auth store with provider
    login(
      {
        id: currentUser.id,
        email: currentUser.email,
        email_verified: currentUser.email_verified,
      },
      provider // Store which OAuth provider was used
    );

    // Store provider in localStorage for future re-authentication
    localStorage.setItem('last_oauth_provider', provider);

    navigate({ to: '/' });
  }, [currentUser, isError, oauthError, isLoading, login, navigate, provider]);

  const getProviderName = () => {
    switch (provider) {
      case 'github':
        return 'GitHub';
      case 'google':
        return 'Google';
      case 'microsoft':
        return 'Microsoft';
      default:
        return provider;
    }
  };

  return (
    <div
      className={`
        flex min-h-screen items-center justify-center bg-gradient-to-br
        from-blue-500 to-blue-600 px-4 py-12
        sm:px-6
        lg:px-8
      `}
    >
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-white">CodeGraph</h1>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-xl">
          {status === 'loading' && (
            <>
              <div className="mb-4 flex justify-center">
                <div
                  className={`
                    h-12 w-12 animate-spin rounded-full border-b-2
                    border-blue-600
                  `}
                ></div>
              </div>
              <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">
                Connecting to {getProviderName()}
              </h2>
              <p className="text-center text-gray-600">
                Please wait while we complete your authentication...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mb-4 flex justify-center">
                <div className="text-green-500">
                  <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">
                Successfully Connected!
              </h2>
              <p className="text-center text-gray-600">Redirecting you now...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mb-4 flex justify-center">
                <div className="text-red-500">
                  <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">
                Authentication Failed
              </h2>
              <p className="mb-6 text-center text-gray-600">{errorMessage}</p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate({ to: '/login', search: { redirect: '/' } })}
                  className={`
                    w-full rounded-lg bg-blue-600 py-2 text-white transition
                    hover:bg-blue-700
                  `}
                >
                  Back to Login
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className={`
                    w-full rounded-lg border border-gray-300 py-2 text-gray-700
                    transition
                    hover:bg-gray-50
                  `}
                >
                  Try Again
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
