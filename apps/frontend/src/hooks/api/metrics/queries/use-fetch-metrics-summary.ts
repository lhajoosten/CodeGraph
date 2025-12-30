/**
 * Fetch overall metrics summary for dashboard display.
 *
 * Returns high-level metrics including token usage, costs, and per-agent breakdown.
 *
 * @returns Query hook with metrics summary data
 *
 * @example
 * const { data: metrics, isLoading } = useFetchMetricsSummary();
 */

import { useQuery } from '@tanstack/react-query';
import { getMetricsSummaryApiV1MetricsSummaryGetOptions } from '@/openapi/@tanstack/react-query.gen';

export const useFetchMetricsSummary = () => {
  return useQuery({
    ...getMetricsSummaryApiV1MetricsSummaryGetOptions(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
};
