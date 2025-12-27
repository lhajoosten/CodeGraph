import { useCallback } from 'react';
import { useFetchOAuthAccounts, useUnlinkOAuthAccount } from '@/hooks/api';
import type { OAuthAccountResponse } from '@/openapi/types.gen';

/**
 * Navigate to external OAuth authorization URL for linking
 * (when user is already authenticated)
 */
function navigateToOAuthProviderLink(provider: string): void {
  // Uses public path without /api/v1 prefix
  window.location.href = `${import.meta.env.VITE_API_URL}/oauth/${provider}/authorize/link?redirect_url=/settings/account`;
}

const providerInfo = {
  github: {
    name: 'GitHub',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    ),
    color: 'bg-gray-900 hover:bg-gray-800',
  },
  google: {
    name: 'Google',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    ),
    color: 'bg-white hover:bg-gray-50 border border-gray-300',
  },
  microsoft: {
    name: 'Microsoft',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24">
        <path fill="#F25022" d="M1 1h10v10H1z" />
        <path fill="#00A4EF" d="M1 13h10v10H1z" />
        <path fill="#7FBA00" d="M13 1h10v10H13z" />
        <path fill="#FFB900" d="M13 13h10v10H13z" />
      </svg>
    ),
    color: 'bg-white hover:bg-gray-50 border border-gray-300',
  },
};

export const ConnectedAccounts = () => {
  // Fetch connected OAuth accounts using the extracted hook
  const accountsQuery = useFetchOAuthAccounts();

  // Unlink account mutation using the extracted hook
  const unlinkMutation = useUnlinkOAuthAccount();

  // Define handlers before early returns
  const handleConnect = useCallback((provider: string) => {
    navigateToOAuthProviderLink(provider);
  }, []);

  // Check if OAuth feature is available
  if (accountsQuery.isError) {
    return (
      <div className="space-y-4">
        <div
          className={`
            rounded-lg border border-border-steel bg-bg-elevated-lum p-6 text-center
          `}
        >
          <svg
            className="mx-auto h-12 w-12 text-text-muted-lum"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-text-primary-lum">Connected Accounts</h3>
          <p className="mt-2 text-sm text-text-secondary-lum">
            OAuth connections are not yet available. This feature is coming soon!
          </p>
        </div>
      </div>
    );
  }

  if (accountsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div
          className={`
            h-8 w-8 animate-spin rounded-full border-b-2 border-brand-cyan
          `}
        ></div>
      </div>
    );
  }

  const connectedAccounts: OAuthAccountResponse[] = accountsQuery.data?.accounts || [];

  const isConnected = (provider: string): boolean =>
    connectedAccounts.some((acc: OAuthAccountResponse) => acc.provider === provider);

  const getAccount = (provider: string): OAuthAccountResponse | undefined =>
    connectedAccounts.find((acc: OAuthAccountResponse) => acc.provider === provider);

  const handleUnlink = (provider: string) => {
    if (
      confirm(
        `Are you sure you want to disconnect your ${providerInfo[provider as keyof typeof providerInfo]?.name} account?`
      )
    ) {
      unlinkMutation.mutate({ path: { provider } });
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary-lum">
        Connect your accounts for easier sign-in and to access additional features.
      </p>

      <div className="space-y-3">
        {(['github', 'google', 'microsoft'] as const).map((provider) => {
          const info = providerInfo[provider];
          const connected = isConnected(provider);
          const account = getAccount(provider);

          return (
            <div
              key={provider}
              className={`
                flex items-center justify-between rounded-lg border p-4
                ${
                  connected
                    ? 'border-success bg-success/10'
                    : `
                  border-border-steel bg-bg-elevated-lum
                `
                }
              `}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`
                    flex h-10 w-10 items-center justify-center rounded-lg
                    ${provider === 'github' ? 'bg-gray-900 text-white' : ''}
                  `}
                >
                  {info.icon}
                </div>
                <div>
                  <p className="font-medium text-text-primary-lum">{info.name}</p>
                  {connected && account ? (
                    <p className="text-sm text-text-secondary-lum">
                      Connected as {account.email || account.name || account.provider_user_id}
                    </p>
                  ) : (
                    <p className="text-sm text-text-secondary-lum">Not connected</p>
                  )}
                </div>
              </div>

              {connected ? (
                <button
                  onClick={() => handleUnlink(provider)}
                  disabled={unlinkMutation.isPending}
                  className={`
                    rounded-lg border border-error px-4 py-2 text-sm
                    font-medium text-error transition
                    hover:bg-error/5
                    disabled:cursor-not-allowed disabled:opacity-50
                  `}
                >
                  {unlinkMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
                </button>
              ) : (
                <button
                  onClick={() => handleConnect(provider)}
                  className={`
                    rounded-lg border border-border-steel px-4 py-2 text-sm
                    font-medium text-text-secondary-lum transition
                    hover:bg-bg-steel
                  `}
                >
                  Connect
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg bg-brand-cyan/10 p-4">
        <div className="flex items-start gap-3">
          <svg
            className="h-5 w-5 text-brand-cyan"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-sm text-brand-cyan">
              Connecting accounts allows you to sign in with a single click and may provide access
              to additional features like repository imports and team synchronization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
