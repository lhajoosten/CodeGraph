import { UseMutationOptions } from '@tanstack/react-query';

export type InferHeyApiMutationOptions<Fn> = Fn extends () => UseMutationOptions<
  infer TData,
  infer TError,
  infer TVariables,
  infer TContext
>
  ? UseMutationOptions<TData, TError, TVariables, TContext>
  : never;

export type RouteContext = { user: UserRead | null };

export interface UserRead {
  id: string;
  username: string;
  email: string;
  isActive: boolean;
  isSuperuser: boolean;
  fullName: string | null;
  createdAt: string;
  updatedAt: string;
}
