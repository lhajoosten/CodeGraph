/**
 * Register a new user account.
 *
 * @returns Mutation hook for user registration
 *
 * @example
 * const registerMutation = useRegister();
 * registerMutation.mutate(
 *   { body: { email: 'user@example.com', password: 'password' } },
 *   { onSuccess: (data) => console.log('Registered!', data) }
 * );
 */

import { useMutation } from '@tanstack/react-query';
import { registerUserApiV1AuthRegisterPostMutation } from '@/openapi/@tanstack/react-query.gen';
import type { InferHeyApiMutationOptions } from '@/lib/types';
import { addToast } from '@/lib/toast';
import { getErrorMessage } from '@/hooks/api/utils';

export const useRegister = () => {
  return useMutation({
    ...registerUserApiV1AuthRegisterPostMutation(),
    onSuccess: () => {
      addToast({
        title: 'Registration Successful',
        description: 'Account created! Please check your email to verify your account.',
        color: 'success',
      });
    },
    onError: (error) => {
      addToast({
        title: 'Registration Failed',
        description: getErrorMessage(error),
        color: 'danger',
      });
    },
  });
};

export type UseRegisterOptions = InferHeyApiMutationOptions<
  typeof registerUserApiV1AuthRegisterPostMutation
>;
