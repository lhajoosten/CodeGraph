import { createLazyFileRoute, useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { client } from '@/openapi/client.gen';
import { useAuthStore } from '@/stores/auth-store';
import { getErrorMessage, type ApiError } from '@/lib/error-handler';
import { ERROR_CODE_TO_I18N_KEY } from '@/lib/error-codes';
import i18n from '@/locales/config';
import { useQueryClient } from '@tanstack/react-query';
import { useHandle2FARouting } from '@/hooks/api/auth/use-handle-two-factor';
import { addToast } from '@/lib/toast';
import { LoginResponse } from '@/openapi';

export const Route = createLazyFileRoute('/_public/oauth/callback/$provider')({
  component: OAuthCallback,
});

interface CurrentUserResponse {
  id: number;
  email: string;
  email_verified: boolean;
}

interface TwoFactorStatusResponse {
  enabled: boolean;
  backup_codes_remaining?: number;
}

function OAuthCallback() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { provider } = useParams({ from: '/_public/oauth/callback/$provider' });
  const search = useSearch({ from: '/_public/oauth/callback/$provider' });
  const searchParams = search as {
    code?: string;
    error_code?: string;
    error?: string;
    error_description?: string;
  };
  const oauthErrorCode = searchParams.error_code;
  const oauthErrorMessage = searchParams.error_description;
  const oauthError = oauthErrorCode || searchParams.error;

  const { login, isAuthenticated } = useAuthStore();
  const handle2FARouting = useHandle2FARouting();
  const processedRef = useRef(false);
  const isLinkFlow = isAuthenticated;

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
    enabled: !oauthError && !isLinkFlow, // Only fetch if no OAuth error and not linking
    retry: 1,
  });

  // Fetch 2FA status for login flow (not for linking)
  const { data: twoFactorStatus, isLoading: twoFactorLoading } = useQuery({
    queryKey: ['two-factor-status-oauth'],
    queryFn: async () => {
      const response = await client.get<TwoFactorStatusResponse>({
        url: '/api/v1/two-factor/status',
      });
      return response.data;
    },
    enabled: !oauthError && !isLinkFlow && !!currentUser, // Only fetch after user is fetched, in login flow
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
    if (oauthErrorCode && ERROR_CODE_TO_I18N_KEY[oauthErrorCode]) {
      // New format with error code
      const i18nKey = ERROR_CODE_TO_I18N_KEY[oauthErrorCode];
      const t = i18n.t;
      return t(i18nKey, {
        defaultValue: oauthErrorMessage || 'OAuth authentication failed.',
        provider: provider
          ? provider.charAt(0).toUpperCase() + provider.slice(1)
          : 'OAuth provider',
      });
    }
    if (oauthError) {
      // Legacy error format (fallback)
      return oauthErrorMessage || oauthError;
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

    // For login flow, also wait for 2FA status to load
    if (!oauthError && !isLinkFlow && (twoFactorLoading || !twoFactorStatus)) return;

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

    if (isLinkFlow) {
      // Link flow: User was already authenticated, just linking an additional provider
      // Invalidate the oauth-accounts query to refresh the connected accounts list
      queryClient.invalidateQueries({ queryKey: ['oauth-accounts'] });
      // Redirect back to dashboard
      navigate({ to: '/' });
    } else {
      // Login flow: User is logging in for the first time or switching providers
      // Set the basic auth state first
      login(
        {
          id: currentUser.id,
          email: currentUser.email,
          email_verified: currentUser.email_verified,
        },
        provider
      );

      // Check 2FA status and handle routing
      if (twoFactorStatus) {
        // 2FA status is available - use it to determine routing
        // Create a routing response object for handle2FARouting
        const routingResponse = {
          requires_two_factor: true,
          two_factor_enabled: twoFactorStatus.enabled,
        };

        const { shouldRoute, destination } = handle2FARouting(
          routingResponse as unknown as LoginResponse
        );

        if (shouldRoute && destination) {
          // Route to 2FA setup or verification
          navigate({ to: destination });
          return;
        }
      }

      // No 2FA routing needed - complete login normally
      addToast({
        title: 'Login Successful',
        description: 'Welcome back! You have successfully logged in.',
        color: 'success',
      });

      // Store provider in localStorage for future re-authentication
      localStorage.setItem('last_oauth_provider', provider);

      // Invalidate current user query to fetch fresh data
      queryClient.invalidateQueries({
        queryKey: ['getCurrentUserInfoApiV1UsersMeGet'],
      });

      navigate({ to: '/' });
    }
  }, [
    currentUser,
    isError,
    oauthError,
    isLoading,
    login,
    navigate,
    provider,
    isLinkFlow,
    queryClient,
    twoFactorStatus,
    twoFactorLoading,
    handle2FARouting,
  ]);

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
                {isLinkFlow ? 'Linking' : 'Connecting to'} {getProviderName()}
              </h2>
              <p className="text-center text-gray-600">
                Please wait while we{' '}
                {isLinkFlow ? 'link your account' : 'complete your authentication'}...
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
                {isLinkFlow ? 'Account Linked Successfully!' : 'Successfully Connected!'}
              </h2>
              <p className="text-center text-gray-600">
                Redirecting you {isLinkFlow ? 'back to settings' : 'to your dashboard'}...
              </p>
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
