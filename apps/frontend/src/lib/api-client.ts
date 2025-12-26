import { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { client } from '@/openapi/client.gen';
import queryString from 'query-string';
import { router } from '@/main';
import { addToast } from '@/lib/toast';
import isEqual from 'react-fast-compare';
import { getCsrfToken } from '@/lib/csrf';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Configure the API client.
 *
 * The baseURL is set in the generated client.gen.ts to http://localhost:8000
 * The SDK paths include /api/v1 prefix from the OpenAPI spec (e.g., /api/v1/auth/login)
 * Combined: http://localhost:8000 + /api/v1/auth/login = http://localhost:8000/api/v1/auth/login
 * We only configure additional options here.
 */
client.setConfig({
  withCredentials: true,
  querySerializer: (params) => {
    const serialized = queryString.stringify(params, {
      skipNull: true,
      skipEmptyString: true,
    });
    return serialized;
  },
});

// Request interceptor to add CSRF token to state-changing requests
client.instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add CSRF token to non-GET requests
    if (config.method && !['get', 'head', 'options'].includes(config.method.toLowerCase())) {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

client.instance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      const authMethod = error.response.headers['x-auth-method'];
      const errorDetail = error.response.data?.detail;

      // Handle OAuth token expiry - redirect to OAuth provider for re-authentication
      if (authMethod === 'oauth' || errorDetail === 'oauth_reauthentication_required') {
        // Store current path for redirect after OAuth re-authentication
        const currentPath = router.state.location.pathname;
        sessionStorage.setItem('oauth_redirect', currentPath);

        // Get last used OAuth provider from localStorage
        const lastOAuthProvider = localStorage.getItem('last_oauth_provider') || 'github';

        // Redirect to OAuth provider authorization
        window.location.href = `/api/v1/oauth/${lastOAuthProvider}/authorize?redirect_url=${currentPath}`;
        return Promise.reject(error);
      }

      // Handle traditional auth - redirect to login
      if (isEqual(error.response.data, { detail: 'Unauthorized' })) {
        router.navigate({ to: '/login', search: { redirect: router.state.location.pathname } });
      }
    } else if (error.response?.status === 403) {
      const detail = error.response.data?.detail;

      // Handle 2FA verification required
      if (detail === '2fa_verification_required') {
        const { setTwoFactorStatus } = useAuthStore.getState();
        setTwoFactorStatus(true, false, false);

        addToast({
          title: '2FA Verification Required',
          description: 'Please verify your 2FA code to continue.',
          color: 'warning',
        });

        router.navigate({ to: '/verify-2fa' });
        return Promise.reject(error);
      }

      if (detail === 'Missing permissions' || detail === 'Forbidden') {
        addToast({
          title: 'Missing Permissions',
          description: 'You do not have the required permissions to access this resource.',
          color: 'danger',
        });
        router.navigate({ to: '/' });
      }
    } else if (error.response?.status === 500) {
      if (error.response.data.detail === 'Internal Server Error') {
        addToast({
          title: 'Server Error',
          description: 'An unexpected error occurred on the server. Please try again later.',
          color: 'danger',
        });
      }
    }

    return Promise.reject(error);
  }
);

export const apiClient = client;
