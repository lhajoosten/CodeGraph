/**
 * Fetch time-series metrics data for charting.
 *
 * Returns bucketed metrics data suitable for time-series charts.
 *
 * @param options - Query parameters (period, interval)
 * @returns Query hook with time-series metrics data
 *
 * @example
 * const { data: history } = useFetchMetricsHistory({ period: '7d', interval: 'day' });
 */

import { useQuery } from '@tanstack/react-query';
import { getMetricsHistoryApiV1MetricsHistoryGetOptions } from '@/openapi/@tanstack/react-query.gen';

export interface UseFetchMetricsHistoryOptions {
  period?: '24h' | '7d' | '30d';
  interval?: '1h' | '6h' | '1d';
}

export const useFetchMetricsHistory = (options?: UseFetchMetricsHistoryOptions) => {
  return useQuery({
    ...getMetricsHistoryApiV1MetricsHistoryGetOptions({
      query: {
        period: options?.period,
        interval: options?.interval,
      },
    }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
