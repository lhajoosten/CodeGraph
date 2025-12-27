/**
 * Centralized error handling utilities.
 * Formats errors from different sources and provides translated messages.
 */

import i18n from '@/locales/config';
import { addToast } from '@/lib/toast';
import { ERROR_CODE_TO_I18N_KEY } from '@/lib/error-codes';

/**
 * Error type for API errors with response data.
 */
export interface ApiError {
  response?: {
    status?: number;
    data?: {
      // New structured error format
      error_code?: string;
      message?: string;
      details?: Record<string, unknown>;
      validation_errors?: Array<{
        loc: string[];
        msg: string;
        type: string;
      }>;
      // Legacy support
      detail?: string | Array<{ msg: string }>;
    };
  };
  message?: string;
}

/**
 * Extract error code from API error response.
 */
export function getErrorCode(error: unknown): string | null {
  const apiError = error as ApiError;
  return apiError.response?.data?.error_code || null;
}

/**
 * Extract error details from API error response.
 */
export function getErrorDetails(error: unknown): Record<string, unknown> | null {
  const apiError = error as ApiError;
  return apiError.response?.data?.details || null;
}

/**
 * Extract validation errors from API error response.
 */
export function getValidationErrors(
  error: unknown
): Array<{ loc: string[]; msg: string; type: string }> | null {
  const apiError = error as ApiError;
  return apiError.response?.data?.validation_errors || null;
}

/**
 * Extract all validation error messages as strings.
 */
export function getValidationErrorMessages(error: unknown): string[] {
  const validationErrors = getValidationErrors(error);
  if (!validationErrors || validationErrors.length === 0) {
    return [];
  }

  return validationErrors.map((err) => {
    const field = err.loc.join('.');
    return `${field}: ${err.msg}`;
  });
}

/**
 * Extract error message from various error types.
 * Tries multiple sources: API response, error message, etc.
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  const apiError = error as ApiError;
  const t = i18n.t;

  // Try new error code format first
  const errorCode = getErrorCode(error);
  if (errorCode && ERROR_CODE_TO_I18N_KEY[errorCode]) {
    const i18nKey = ERROR_CODE_TO_I18N_KEY[errorCode];
    const details = getErrorDetails(error);

    // Handle special cases with interpolation
    if (errorCode === 'ACCOUNT_LOCKED' && details?.locked_until) {
      const lockedUntil = new Date(details.locked_until as string);
      const now = new Date();
      const diffMs = lockedUntil.getTime() - now.getTime();
      const diffMins = Math.ceil(diffMs / 60000);

      if (diffMins <= 0) {
        return t(i18nKey, {
          defaultValue: 'Account is temporarily locked. Please try again later.',
        });
      }

      const minuteStr = diffMins === 1 ? 'minute' : 'minutes';
      return t(i18nKey, {
        defaultValue: `Account is locked. Try again in ${diffMins} ${minuteStr}.`,
        time: `in ${diffMins} ${minuteStr}`,
      });
    }

    // Return translated message with fallback
    return t(i18nKey, {
      defaultValue: apiError.response?.data?.message || 'An error occurred',
    });
  }

  // Legacy: Try to extract from API response message field (new format)
  if (apiError.response?.data?.message) {
    return apiError.response.data.message;
  }

  // Legacy: Try to extract from API response detail field (old format)
  if (apiError.response?.data?.detail) {
    const detail = apiError.response.data.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    if (Array.isArray(detail) && detail.length > 0) {
      return detail[0].msg || 'An error occurred';
    }
  }

  // Fall back to error message
  if (apiError.message && typeof apiError.message === 'string') {
    return apiError.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

/**
 * Map HTTP status codes to translated error messages.
 */
function getTranslatedErrorMessage(statusCode?: number): string {
  const t = i18n.t;

  switch (statusCode) {
    case 400:
      return t('error:invalidInput', {
        defaultValue: 'Invalid input. Please check your data and try again.',
      });
    case 401:
      return t('error:unauthorized', {
        defaultValue: 'You are not authorized to perform this action.',
      });
    case 403:
      return t('error:forbidden', {
        defaultValue: 'Access denied. You do not have permission to access this resource.',
      });
    case 404:
      return t('error:notFound', { defaultValue: 'The requested resource was not found.' });
    case 500:
      return t('error:serverError', {
        defaultValue: 'A server error occurred. Please try again later.',
      });
    default:
      return t('error:unexpected', {
        defaultValue: 'An unexpected error occurred. Please try again later.',
      });
  }
}

/**
 * Show an error toast with translated message.
 * Automatically detects error type and uses appropriate message.
 */
export function showErrorToast(
  error: unknown,
  options?: {
    title?: string;
    duration?: number;
  }
) {
  const t = i18n.t;
  const apiError = error as ApiError;
  const statusCode = apiError.response?.status;

  // Get custom message from API or generic translated message
  let message = getErrorMessage(error);
  if (!message || message.includes('status') || message.includes('Error')) {
    message = getTranslatedErrorMessage(statusCode);
  }

  addToast({
    title: options?.title || t('message:error', { defaultValue: 'Error' }),
    description: message,
    color: 'danger',
    duration: options?.duration,
  });
}

/**
 * Show a success toast with optional translated message.
 */
export function showSuccessToast(
  message: string,
  options?: {
    title?: string;
    duration?: number;
  }
) {
  const t = i18n.t;

  addToast({
    title: options?.title || t('message:success', { defaultValue: 'Success' }),
    description: message,
    color: 'success',
    duration: options?.duration,
  });
}

/**
 * Handle a promise that might fail, automatically showing error toast.
 */
export async function handleWithErrorToast<T>(
  promise: Promise<T>,
  errorTitle?: string
): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    showErrorToast(error, { title: errorTitle });
    return null;
  }
}
