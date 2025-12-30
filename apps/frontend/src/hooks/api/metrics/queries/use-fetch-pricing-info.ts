/**
 * Fetch current LLM pricing information.
 *
 * Returns pricing per 1M tokens for all model tiers.
 *
 * @returns Query hook with pricing data
 *
 * @example
 * const { data: pricing } = useFetchPricingInfo();
 */

import { useQuery } from '@tanstack/react-query';
import { getPricingInfoApiV1MetricsPricingGetOptions } from '@/openapi/@tanstack/react-query.gen';

export const useFetchPricingInfo = () => {
  return useQuery({
    ...getPricingInfoApiV1MetricsPricingGetOptions(),
    staleTime: 60 * 60 * 1000, // 1 hour (pricing rarely changes)
  });
};
