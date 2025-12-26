/**
 * Update user profile information.
 *
 * @returns Mutation hook for profile updates
 *
 * @example
 * const updateProfileMutation = useUpdateProfile();
 * updateProfileMutation.mutate(
 *   { body: { firstName: 'John', lastName: 'Doe' } },
 *   { onSuccess: (data) => console.log('Profile updated!', data) }
 * );
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProfileApiV1AuthProfilePutMutation } from '@/openapi/@tanstack/react-query.gen';
import type { InferHeyApiMutationOptions } from '@/lib/types';
import { addToast } from '@/lib/toast';
import { getErrorMessage } from '@/hooks/api/utils';

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...updateProfileApiV1AuthProfilePutMutation(),
    onSuccess: () => {
      // Invalidate the current user query to refresh profile data
      queryClient.invalidateQueries({
        queryKey: ['getCurrentUserInfoApiV1UsersMeGet'],
      });

      addToast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
        color: 'success',
      });
    },
    onError: (error) => {
      addToast({
        title: 'Profile Update Failed',
        description: getErrorMessage(error),
        color: 'danger',
      });
    },
  });
};

export type UseUpdateProfileOptions = InferHeyApiMutationOptions<
  typeof updateProfileApiV1AuthProfilePutMutation
>;
