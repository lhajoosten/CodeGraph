/**
 * Authentication API hooks.
 * Handles user registration, login, logout, and current user queries.
 *
 * Note: Uses HTTP-only cookie-based authentication for security.
 * Tokens are automatically sent with requests via cookies.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getCurrentUserInfoApiV1UsersMeGetOptions,
  loginUserApiV1AuthLoginPostMutation,
  logoutApiV1AuthLogoutPostMutation,
  registerUserApiV1AuthRegisterPostMutation,
} from '@/openapi/@tanstack/react-query.gen';
import type { LoginResponse } from '@/openapi/types.gen';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Fetch the current authenticated user.
 *
 * Automatically uses cookies for authentication.
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
 * Sets HTTP-only authentication cookies on successful login.
 *
 * @returns Mutation hook for user login
 *
 * @example
 * const loginMutation = useLogin();
 * loginMutation.mutate(
 *   { body: { email: 'user@example.com', password: 'password' } },
 *   {
 *     onSuccess: () => {
 *       login(); // Update auth store
 *       navigate('/');
 *     }
 *   }
 * );
 */
export const useLogin = () => {
  const { login } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    ...loginUserApiV1AuthLoginPostMutation(),
    onSuccess: (rawData) => {
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
      queryClient.invalidateQueries({ queryKey: ['getCurrentUserInfoApiV1UsersMeGet'] });
    },
  });
};

/**
 * Logout the current user.
 *
 * Clears HTTP-only cookies and auth state.
 *
 * @returns Mutation hook for user logout
 *
 * @example
 * const logoutMutation = useLogout();
 * logoutMutation.mutate({}, {
 *   onSuccess: () => navigate('/login')
 * });
 */
export const useLogout = () => {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    ...logoutApiV1AuthLogoutPostMutation(),
    onSuccess: () => {
      // Clear auth state
      logout();
      // Clear all cached queries
      queryClient.clear();
    },
  });
};
