/**
 * Login with email and password.
 *
 * Sets HTTP-only authentication cookies on successful login.
 * Automatically updates auth store and invalidates current user query.
 *
 * Note: Success/error messages use English defaults.
 * For i18n, components can override by providing custom onSuccess/onError handlers.
 *
 * @returns Mutation hook for user login
 *
 * @example
 * const loginMutation = useLogin();
 * loginMutation.mutate(
 *   { body: { email: 'user@example.com', password: 'password' } },
 *   {
 *     onSuccess: () => {
 *       navigate('/');
 *     }
 *   }
 * );
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loginUserApiV1AuthLoginPostMutation } from '@/openapi/@tanstack/react-query.gen';
import { useAuthStore } from '@/stores/auth-store';
import type { LoginResponse } from '@/openapi/types.gen';
import type { InferHeyApiMutationOptions } from '@/lib/types';
import { addToast } from '@/lib/toast';
import { getErrorMessage } from '@/hooks/api/utils';

export const useLogin = () => {
  const { login } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    ...loginUserApiV1AuthLoginPostMutation(),
    onSuccess: (rawData) => {
      addToast({
        title: 'Login Successful',
        description: 'Welcome back! You have successfully logged in.',
        color: 'success',
      });

      // Note: The API returns LoginResponse but the generated types say TokenResponse.
      // Cast to the actual response type until OpenAPI schema is fixed.
      const data = rawData as unknown as LoginResponse;

      // Update auth state with user data
      login({
        id: data.user.id,
        email: data.user.email,
        email_verified: data.email_verified,
      });
      // Invalidate current user query to fetch fresh data
      queryClient.invalidateQueries({
        queryKey: ['getCurrentUserInfoApiV1UsersMeGet'],
      });
    },
    onError: (error) => {
      addToast({
        title: 'Login Failed',
        description: getErrorMessage(error),
        color: 'danger',
      });
    },
  });
};

export type UseLoginOptions = InferHeyApiMutationOptions<
  typeof loginUserApiV1AuthLoginPostMutation
>;
