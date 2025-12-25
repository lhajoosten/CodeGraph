/**
 * Toast mutation utilities.
 * Provides wrappers and helpers for automatic toast notifications on mutation success/failure.
 */

import { UseMutationOptions } from '@tanstack/react-query';
import { addToast } from '@/lib/toast';

/**
 * Toast configuration for mutation callbacks.
 */
export interface ToastMutationConfig<TData = unknown, TError = unknown> {
  /**
   * Success toast message.
   * Can be a string or a function that receives the response data.
   */
  successMessage?: string | ((data: TData) => string);

  /**
   * Success toast title.
   * Defaults to 'Success'
   */
  successTitle?: string;

  /**
   * Error toast message.
   * Can be a string or a function that receives the error.
   */
  errorMessage?: string | ((error: TError) => string);

  /**
   * Error toast title.
   * Defaults to 'Error'
   */
  errorTitle?: string;

  /**
   * Whether to show toasts. Defaults to true.
   */
  enabled?: boolean;

  /**
   * Toast duration in milliseconds. Defaults to 5000.
   */
  duration?: number;

  /**
   * Custom onSuccess callback that runs after toast is shown.
   */
  onSuccess?: (data: TData) => void;

  /**
   * Custom onError callback that runs after toast is shown.
   */
  onError?: (error: TError) => void;
}

/**
 * Toast callback wrapper for success handler.
 * Composes a success callback with toast notification.
 *
 * @example
 * ```typescript
 * const mutation = useMutation({
 *   ...loginUserApiV1AuthLoginPostMutation(),
 *   onSuccess: wrapSuccessToast({
 *     message: 'Welcome back!',
 *     title: 'Login Successful',
 *   }, originalSuccessCallback),
 * });
 * ```
 */
export function wrapSuccessToast<TData = unknown>(
  config: Pick<
    ToastMutationConfig<TData>,
    'successMessage' | 'successTitle' | 'enabled' | 'duration'
  > & { message?: string },
  originalCallback?: (data: TData) => void | Promise<void>
): (data: TData) => void {
  const {
    successMessage = config.message,
    successTitle = 'Success',
    enabled = true,
    duration,
  } = config;

  return (data: TData) => {
    if (enabled && successMessage) {
      const message = typeof successMessage === 'function' ? successMessage(data) : successMessage;
      addToast({
        title: successTitle,
        description: message,
        color: 'success',
        duration,
      });
    }
    originalCallback?.(data);
  };
}

/**
 * Toast callback wrapper for error handler.
 * Composes an error callback with toast notification.
 *
 * @example
 * ```typescript
 * const mutation = useMutation({
 *   ...loginUserApiV1AuthLoginPostMutation(),
 *   onError: wrapErrorToast({
 *     message: (error) => getErrorMessage(error),
 *     title: 'Login Failed',
 *   }, originalErrorCallback),
 * });
 * ```
 */
export function wrapErrorToast<TError = unknown>(
  config: Pick<
    ToastMutationConfig<unknown, TError>,
    'errorMessage' | 'errorTitle' | 'enabled' | 'duration'
  > & { message?: string | ((error: TError) => string) },
  originalCallback?: (error: TError) => void | Promise<void>
): (error: TError) => void {
  const { errorMessage = config.message, errorTitle = 'Error', enabled = true, duration } = config;

  return (error: TError) => {
    if (enabled && errorMessage) {
      const message = typeof errorMessage === 'function' ? errorMessage(error) : errorMessage;
      addToast({
        title: errorTitle,
        description: message,
        color: 'danger',
        duration,
      });
    }
    originalCallback?.(error);
  };
}

/**
 * Wraps mutation options to add automatic toast notifications.
 * Returns an object that can be spread into useMutation.
 *
 * @deprecated Use wrapSuccessToast/wrapErrorToast directly for better type safety
 * @example
 * ```typescript
 * const mutation = useMutation({
 *   ...loginUserApiV1AuthLoginPostMutation(),
 *   ...withToastNotification({
 *     successMessage: 'Welcome back!',
 *     errorMessage: 'Login failed. Please check your credentials.',
 *   }),
 * });
 * ```
 */
export function withToastNotification<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(
  config: ToastMutationConfig<TData, TError>
): Partial<UseMutationOptions<TData, TError, TVariables, TContext>> {
  const {
    successMessage,
    successTitle = 'Success',
    errorMessage,
    errorTitle = 'Error',
    enabled = true,
    duration,
    onSuccess: customOnSuccess,
    onError: customOnError,
  } = config;

  return {
    onSuccess: (data) => {
      if (enabled && successMessage) {
        const message =
          typeof successMessage === 'function' ? successMessage(data) : successMessage;
        addToast({
          title: successTitle,
          description: message,
          color: 'success',
          duration,
        });
      }
      customOnSuccess?.(data);
    },
    onError: (error) => {
      if (enabled && errorMessage) {
        const message = typeof errorMessage === 'function' ? errorMessage(error) : errorMessage;
        addToast({
          title: errorTitle,
          description: message,
          color: 'danger',
          duration,
        });
      }
      customOnError?.(error);
    },
  } as Partial<UseMutationOptions<TData, TError, TVariables, TContext>>;
}

interface ApiErrorWithResponse extends Error {
  response?: {
    data?: {
      detail?: string | Array<{ msg: string }>;
    };
  };
}

/**
 * Helper to extract error message from API error response.
 * Handles both string and array error responses from FastAPI.
 *
 * @example
 * ```typescript
 * const errorMsg = getErrorMessage(error);
 * ```
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    // Check for API error response structure
    const apiError = error as ApiErrorWithResponse;
    if (apiError.response?.data?.detail) {
      const detail = apiError.response.data.detail;
      if (typeof detail === 'string') {
        return detail;
      }
      if (Array.isArray(detail) && detail.length > 0) {
        return detail[0].msg || 'An error occurred';
      }
    }
    return error.message;
  }

  return 'An unexpected error occurred';
}
