import { createLazyFileRoute, useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { getErrorMessage, type ApiError } from '@/lib/error-handler';
import { ERROR_CODE_TO_I18N_KEY } from '@/lib/error-codes';
import i18n from '@/locales/config';
import { useHandle2FARouting } from '@/hooks/api/auth/use-handle-two-factor';
import { addToast } from '@/lib/toast';
import type { LoginResponse, UserResponse, TwoFactorStatusResponse } from '@/openapi/types.gen';
import { getCurrentUserInfoApiV1UsersMeGetOptions } from '@/openapi/@tanstack/react-query.gen';
import { getTwoFactorStatusApiV1TwoFactorStatusGetOptions } from '@/openapi/@tanstack/react-query.gen';

export const Route = createLazyFileRoute('/_public/oauth/callback/$provider')({
  component: OAuthCallback,
});

interface CallbackSearchParams {
  code?: string;
  state?: string;
  error?: string;
  error_code?: string;
  error_description?: string;
  oauth?: boolean;
  status?: string;
}

/**
 * Creates a handler for OAuth backend flow routing
 * Routes user based on backend status (2FA required, setup required, etc.)
 */
function createBackendFlowHandler(
  navigate: ReturnType<typeof useNavigate>,
  queryClient: ReturnType<typeof useQueryClient>,
  login: (
    user?: { id: number; email: string; email_verified: boolean },
    oauthProvider?: string | null
  ) => void,
  isBackendFlow: boolean,
  backendStatus: string | undefined,
  isLinkFlow: boolean,
  provider: string
) {
  return (isError: boolean, user: UserResponse | undefined) => {
    if (!isBackendFlow || isError || !user) return false;

    if (isLinkFlow) {
      queryClient.invalidateQueries({ queryKey: ['oauth-accounts'] });
      navigate({ to: '/' });
      return true;
    }

    // Login flow: Update auth and route based on backend status
    login(
      {
        id: user.id,
        email: user.email,
        email_verified: user.email_verified,
      },
      provider
    );

    switch (backendStatus) {
      case '2fa_required':
        addToast({
          title: '2FA Verification Required',
          description: 'Please verify your 2FA code to continue.',
          color: 'info',
        });
        navigate({
          to: '/verify-2fa',
          search: { oauth: true, provider, from: 'oauth-callback' },
        });
        break;

      case '2fa_setup_required':
        addToast({
          title: '2FA Setup Required',
          description: 'Please set up two-factor authentication to continue.',
          color: 'warning',
        });
        navigate({
          to: '/setup-2fa',
          search: { oauth: true, provider, from: 'oauth-callback' },
        });
        break;

      case 'profile_completion_required':
        addToast({
          title: 'Profile Setup',
          description: 'Please complete your profile to continue.',
          color: 'info',
        });
        navigate({
          to: '/complete-profile',
          search: { oauth: true, provider, from: 'oauth-callback' },
        });
        break;

      case 'success':
      default:
        addToast({
          title: 'Login Successful',
          description: 'Welcome back! You have successfully logged in.',
          color: 'success',
        });
        localStorage.setItem('last_oauth_provider', provider);
        queryClient.invalidateQueries({
          queryKey: ['getCurrentUserInfoApiV1UsersMeGet'],
        });
        navigate({ to: '/' });
    }

    return true;
  };
}

/**
 * Creates a handler for direct OAuth provider flow routing
 * Routes user based on 2FA status from API
 */
function createDirectFlowHandler(
  navigate: ReturnType<typeof useNavigate>,
  queryClient: ReturnType<typeof useQueryClient>,
  login: (
    user?: { id: number; email: string; email_verified: boolean },
    oauthProvider?: string | null
  ) => void,
  handle2FARouting: ReturnType<typeof useHandle2FARouting>,
  provider: string,
  isLinkFlow: boolean
) {
  return (currentUser: UserResponse, twoFactorStatus: TwoFactorStatusResponse | undefined) => {
    if (isLinkFlow) {
      queryClient.invalidateQueries({ queryKey: ['oauth-accounts'] });
      navigate({ to: '/' });
      return;
    }

    login(
      {
        id: currentUser.id,
        email: currentUser.email,
        email_verified: currentUser.email_verified,
      },
      provider
    );

    if (twoFactorStatus) {
      const routingResponse = {
        requires_two_factor: true,
        two_factor_enabled: twoFactorStatus.enabled,
      };

      const { shouldRoute, destination } = handle2FARouting(
        routingResponse as unknown as LoginResponse
      );

      if (shouldRoute && destination) {
        navigate({
          to: destination,
          search: { oauth: true, provider, from: 'oauth-callback' },
        });
        return;
      }
    }

    addToast({
      title: 'Login Successful',
      description: 'Welcome back! You have successfully logged in.',
      color: 'success',
    });
    localStorage.setItem('last_oauth_provider', provider);
    queryClient.invalidateQueries({
      queryKey: ['getCurrentUserInfoApiV1UsersMeGet'],
    });
    navigate({ to: '/' });
  };
}

function OAuthCallback() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { provider } = useParams({ from: '/_public/oauth/callback/$provider' });
  const search = useSearch({ from: '/_public/oauth/callback/$provider' });
  const searchParams = search as CallbackSearchParams;

  // Check if this is a backend OAuth completion redirect (vs direct OAuth provider redirect)
  const isBackendOAuthFlow = searchParams.oauth === true;
  const backendStatus = searchParams.status;

  const oauthErrorCode = searchParams.error_code;
  const oauthErrorMessage = searchParams.error_description;
  const oauthError = oauthErrorCode || searchParams.error;

  const { login, isAuthenticated } = useAuthStore();
  const handle2FARouting = useHandle2FARouting();
  const processedRef = useRef(false);
  const isLinkFlow = isAuthenticated;

  // Fetch current user to complete authentication using generated hook
  // For backend OAuth flow: always fetch (cookies are already set by backend)
  // For direct OAuth flow: only fetch if no OAuth error and not linking
  const {
    data: currentUser,
    isError,
    error: fetchError,
    isLoading,
  } = useQuery({
    ...getCurrentUserInfoApiV1UsersMeGetOptions(),
    enabled: isBackendOAuthFlow || (!oauthError && !isLinkFlow), // Backend flow always fetches, otherwise check errors
    retry: 1,
  });

  // Fetch 2FA status for login flow (not for linking) using generated hook
  // For backend flow: use the status from backend, still fetch for confirmation
  const { data: twoFactorStatus, isLoading: twoFactorLoading } = useQuery({
    ...getTwoFactorStatusApiV1TwoFactorStatusGetOptions(),
    enabled: (isBackendOAuthFlow || !oauthError) && !isLinkFlow && !!currentUser, // Fetch after user is fetched, in login flow
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

    // Wait for user query to complete (either success or error)
    if (isLoading) return;

    // For backend OAuth flow: route based on status param (no need to wait for 2FA status)
    if (isBackendOAuthFlow) {
      // If fetch errored or no user, don't process
      if (isError || !currentUser) {
        processedRef.current = true;
        return;
      }

      processedRef.current = true;

      const handleRouting = createBackendFlowHandler(
        navigate,
        queryClient,
        login,
        isBackendOAuthFlow,
        backendStatus,
        isLinkFlow,
        provider
      );

      handleRouting(isError, currentUser);
      return;
    }

    // Direct OAuth provider flow (not from backend)
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

    const handleRouting = createDirectFlowHandler(
      navigate,
      queryClient,
      login,
      handle2FARouting,
      provider,
      isLinkFlow
    );

    handleRouting(currentUser, twoFactorStatus);
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
    isBackendOAuthFlow,
    backendStatus,
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
      style={{
        background: `linear-gradient(135deg, var(--color-bg-primary-lum) 0%, var(--color-bg-elevated-lum) 100%)`,
      }}
      className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
    >
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 style={{ color: 'var(--color-brand-cyan)' }} className="mb-2 text-4xl font-bold">
            CodeGraph
          </h1>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-bg-secondary-lum)',
            borderColor: 'var(--color-border-steel)',
          }}
          className="rounded-lg border p-8 shadow-xl"
        >
          {status === 'loading' && (
            <>
              <div className="mb-4 flex justify-center">
                <div
                  style={{
                    borderBottomColor: 'var(--color-brand-cyan)',
                  }}
                  className="h-12 w-12 animate-spin rounded-full border-b-2"
                ></div>
              </div>
              <h2
                style={{ color: 'var(--color-text-primary-lum)' }}
                className="mb-2 text-center text-2xl font-bold"
              >
                {isLinkFlow ? 'Linking' : 'Connecting to'} {getProviderName()}
              </h2>
              <p style={{ color: 'var(--color-text-secondary-lum)' }} className="text-center">
                Please wait while we{' '}
                {isLinkFlow ? 'link your account' : 'complete your authentication'}...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mb-4 flex justify-center">
                <div style={{ color: 'var(--color-success)' }}>
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
              <h2
                style={{ color: 'var(--color-text-primary-lum)' }}
                className="mb-2 text-center text-2xl font-bold"
              >
                {isLinkFlow ? 'Account Linked Successfully!' : 'Successfully Connected!'}
              </h2>
              <p style={{ color: 'var(--color-text-secondary-lum)' }} className="text-center">
                Redirecting you {isLinkFlow ? 'back to settings' : 'to your dashboard'}...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mb-4 flex justify-center">
                <div style={{ color: 'var(--color-error)' }}>
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
              <h2
                style={{ color: 'var(--color-text-primary-lum)' }}
                className="mb-2 text-center text-2xl font-bold"
              >
                Authentication Failed
              </h2>
              <p style={{ color: 'var(--color-text-secondary-lum)' }} className="mb-6 text-center">
                {errorMessage}
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate({ to: '/login', search: { redirect: '/' } })}
                  style={{
                    backgroundColor: 'var(--color-brand-cyan)',
                    color: 'var(--color-bg-primary-lum)',
                  }}
                  className="w-full rounded-lg py-2 font-medium transition hover:opacity-90"
                >
                  Back to Login
                </button>
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    borderColor: 'var(--color-border-steel)',
                    color: 'var(--color-text-secondary-lum)',
                  }}
                  className="hover:bg-bg-steel w-full rounded-lg border py-2 transition"
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
