/**
 * Authentication API hooks.
 * Handles user registration, login, and current user queries.
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import {
  getCurrentUserInfoApiV1UsersMeGetOptions,
  loginUserApiV1AuthLoginPostMutation,
  registerUserApiV1AuthRegisterPostMutation,
} from '@/openapi/@tanstack/react-query.gen';

/**
 * Fetch the current authenticated user.
 *
 * @returns Query hook with current user data or null if not authenticated
 *
 * @example
 * const { data: user, isLoading } = useCurrentUser();
 */
export const useCurrentUser = () => {
  return useQuery({
    ...getCurrentUserInfoApiV1UsersMeGetOptions(),
    retry: false, // Don't retry if not authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

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
export const useRegister = () => {
  return useMutation(registerUserApiV1AuthRegisterPostMutation());
};

/**
 * Login with email and password.
 *
 * @returns Mutation hook for user login
 *
 * @example
 * const loginMutation = useLogin();
 * loginMutation.mutate(
 *   { body: { email: 'user@example.com', password: 'password' } },
 *   {
 *     onSuccess: (data) => {
 *       // Save token and redirect
 *       localStorage.setItem('token', data.access_token);
 *       navigate('/dashboard');
 *     }
 *   }
 * );
 */
export const useLogin = () => {
  return useMutation(loginUserApiV1AuthLoginPostMutation());
};
