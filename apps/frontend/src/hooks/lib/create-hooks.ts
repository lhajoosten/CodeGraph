/**
 * Library utilities for creating TanStack Query hooks from API functions.
 * These utilities provide a consistent way to wrap generated API operations.
 */

import { useQuery } from '@tanstack/react-query';

/**
 * Create a useQuery hook from query options.
 * Provides a consistent interface for wrapping generated query options.
 *
 * @example
 * const useUserQuery = createQueryHook(() =>
 *   useQuery({
 *     ...getCurrentUserInfoApiV1UsersMeGetOptions(),
 *     retry: false
 *   })
 * );
 */
export function createQueryHook<TData = unknown, TError = unknown>(
  hookFn: () => ReturnType<typeof useQuery<TData, TError>>
) {
  return hookFn;
}

/**
 * Type helper for extracting the data type from a query hook
 * @example
 * type UserData = QueryData<typeof useCurrentUser>;
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type QueryData<T> = T extends ReturnType<typeof useQuery<infer D, any>> ? D : never;

/**
 * Type helper for extracting the error type from a query hook
 * @example
 * type UserError = QueryError<typeof useCurrentUser>;
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type QueryError<T> = T extends ReturnType<typeof useQuery<any, infer E>> ? E : never;
