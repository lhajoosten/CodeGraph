/**
 * Hook for managing form errors and validation.
 */

import { useCallback, useState } from 'react';

interface FormError {
  message: string;
  field?: string;
}

/**
 * Manage form errors.
 *
 * @returns Error state and control functions
 *
 * @example
 * const { error, setError, clearError } = useFormError();
 *
 * const handleSubmit = async () => {
 *   try {
 *     await submitForm();
 *   } catch (err) {
 *     setError({ message: err.message });
 *   }
 * };
 */
export const useFormError = () => {
  const [error, setError] = useState<FormError | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const handleError = useCallback((err: unknown) => {
    if (err instanceof Error) {
      setError({ message: err.message });
    } else if (typeof err === 'string') {
      setError({ message: err });
    } else if (typeof err === 'object' && err !== null && 'message' in err) {
      const errObj = err as { message?: unknown };
      setError({ message: String(errObj.message) });
    } else {
      setError({ message: 'An error occurred' });
    }
  }, []);

  return {
    error,
    setError,
    clearError,
    handleError,
  };
};
