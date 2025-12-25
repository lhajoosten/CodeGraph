/**
 * Authentication API hooks - Queries and mutations.
 * Handles user authentication operations.
 */

export { useFetchCurrentUser } from './queries';
export { useLogin, useLogout, useRegister } from './mutations';
export type { UseLoginOptions, UseLogoutOptions, UseRegisterOptions } from './mutations';
