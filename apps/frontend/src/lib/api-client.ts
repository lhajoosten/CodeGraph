import { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { client } from '@/openapi/client.gen';
import queryString from 'query-string';
import { router } from '@/main';
import { addToast } from '@/lib/toast';
import isEqual from 'react-fast-compare';
import { getCsrfToken } from '@/lib/csrf';

/**
 * Configure the API client.
 *
 * The baseURL is set in the generated client.gen.ts from the OpenAPI spec.
 * The SDK paths already include /api/v1 prefix from the OpenAPI spec.
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
      if (isEqual(error.response.data, { detail: 'Unauthorized' })) {
        router.navigate({ to: '/login', search: { redirect: router.state.location.pathname } });
      }
    } else if (error.response?.status === 403) {
      if (
        error.response.data.detail === 'Missing permissions' ||
        error.response.data.detail === 'Forbidden'
      ) {
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
