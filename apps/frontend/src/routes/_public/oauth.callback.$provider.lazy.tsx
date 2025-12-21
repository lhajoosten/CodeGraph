import { createLazyFileRoute, useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { client } from '@/openapi/client.gen';
import { useAuthStore } from '@/stores/auth-store';

export const Route = createLazyFileRoute('/_public/oauth/callback/$provider')({
  component: OAuthCallback,
});

interface OAuthCallbackResponse {
  success: boolean;
  message?: string;
  is_new_user?: boolean;
  user?: {
    id: number;
    email: string;
    email_verified: boolean;
  };
  redirect_url: string;
}

function OAuthCallback() {
  const navigate = useNavigate();
  const { provider } = useParams({ from: '/_public/oauth/callback/$provider' });
  const search = useSearch({ from: '/_public/oauth/callback/$provider' });
  const { code, state, error, error_description } = search;
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const { login } = useAuthStore();

  const callbackMutation = useMutation({
    mutationFn: async () => {
      const response = await client.post<OAuthCallbackResponse>({
        url: `/api/v1/oauth/${provider}/callback`,
        body: { code, state },
      });
      return response.data;
    },
    onSuccess: (data) => {
      setStatus('success');

      if (!data) {
        navigate({ to: '/' });
        return;
      }

      // If this was a login (not account linking)
      if (data.user) {
        login({
          id: data.user.id,
          email: data.user.email,
          email_verified: data.user.email_verified,
        });
      }

      // Redirect after a short delay
      setTimeout(() => {
        navigate({ to: data.redirect_url || '/' });
      }, 1500);
    },
    onError: (err: Error & { response?: { data?: { detail?: string } } }) => {
      setStatus('error');
      setErrorMessage(err.response?.data?.detail || 'Failed to complete authentication');
    },
  });

  useEffect(() => {
    // Handle OAuth errors from provider
    if (error) {
      setStatus('error');
      setErrorMessage(error_description || error);
      return;
    }

    // Validate required parameters
    if (!code || !state) {
      setStatus('error');
      setErrorMessage('Missing required OAuth parameters');
      return;
    }

    // Process the callback
    callbackMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
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
                  className="w-full rounded-lg bg-blue-600 py-2 text-white transition hover:bg-blue-700"
                >
                  Back to Login
                </button>
                <button
                  onClick={() => {
                    setStatus('loading');
                    callbackMutation.mutate();
                  }}
                  className="w-full rounded-lg border border-gray-300 py-2 text-gray-700 transition hover:bg-gray-50"
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
