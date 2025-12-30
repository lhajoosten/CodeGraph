/**
 * Estimate monthly cost based on usage patterns.
 *
 * Provides projection of monthly costs based on current or specified usage.
 *
 * @returns Mutation hook for cost estimation
 *
 * @example
 * const estimate = useEstimateMonthlyCost();
 * estimate.mutate(
 *   { body: { tasks_per_month: 100, avg_tokens_per_task: 50000 } }
 * );
 */

import { useMutation } from '@tanstack/react-query';
import { estimateMonthlyCostApiV1MetricsEstimatePostMutation } from '@/openapi/@tanstack/react-query.gen';
import { addToast } from '@/lib/toast';
import { getErrorMessage } from '@/hooks/api/utils';

export const useEstimateMonthlyCost = () => {
  return useMutation({
    ...estimateMonthlyCostApiV1MetricsEstimatePostMutation(),
    onError: (error) => {
      addToast({
        title: 'Estimation Failed',
        description: getErrorMessage(error),
        color: 'danger',
      });
    },
  });
};
