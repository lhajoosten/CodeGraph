import { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { client } from '@/openapi/client.gen';
import queryString from 'query-string';
import { router } from '@/main';
import { addToast } from '@/lib/toast';
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

// Track if we're currently refreshing to avoid multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(undefined);
    }
  });
  failedQueue = [];
};

client.instance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

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

        // Redirect to OAuth provider authorization (uses public path without /api/v1)
        window.location.href = `/oauth/${lastOAuthProvider}/authorize?redirect_url=${currentPath}`;
        return Promise.reject(error);
      }

      // Don't retry refresh endpoint or if we've already retried
      if (originalRequest.url?.includes('/auth/refresh') || originalRequest._retry) {
        // Clear auth state and redirect to login
        const { logout } = useAuthStore.getState();
        logout();
        router.navigate({ to: '/login', search: { redirect: router.state.location.pathname } });
        return Promise.reject(error);
      }

      // Attempt to refresh the token
      if (isRefreshing) {
        // Queue the request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return client.instance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token
        await client.instance.post('/api/v1/auth/refresh');
        processQueue(null);
        // Retry the original request
        return client.instance(originalRequest);
      } catch (refreshError: unknown) {
        processQueue(refreshError);

        // Check if this is an OAuth user that needs to re-authenticate via provider
        const axiosError = refreshError as { response?: { data?: { detail?: string } } };
        if (axiosError.response?.data?.detail === 'oauth_reauthentication_required') {
          // Store current path for redirect after OAuth re-authentication
          const currentPath = router.state.location.pathname;
          sessionStorage.setItem('oauth_redirect', currentPath);

          // Get last used OAuth provider from localStorage
          const lastOAuthProvider = localStorage.getItem('last_oauth_provider') || 'github';

          // Redirect to OAuth provider
          window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/oauth/${lastOAuthProvider}/authorize?redirect_url=${currentPath}`;
          return Promise.reject(refreshError);
        }

        // Regular auth failed - clear auth state and redirect to login
        const { logout } = useAuthStore.getState();
        logout();
        router.navigate({ to: '/login', search: { redirect: router.state.location.pathname } });
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
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

        router.navigate({
          to: '/verify-2fa',
          search: { provider: undefined, oauth: undefined, from: 'protected' },
        });
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
