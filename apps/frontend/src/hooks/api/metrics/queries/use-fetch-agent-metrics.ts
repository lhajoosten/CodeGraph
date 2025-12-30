/**
 * Fetch metrics for a specific agent type.
 *
 * Returns detailed metrics for a single agent type (planner, coder, etc.).
 *
 * @param agentType - The agent type to fetch metrics for
 * @returns Query hook with agent-specific metrics
 *
 * @example
 * const { data: plannerMetrics } = useFetchAgentMetrics('planner');
 */

import { useQuery } from '@tanstack/react-query';
import { getAgentMetricsApiV1MetricsAgentAgentTypeGetOptions } from '@/openapi/@tanstack/react-query.gen';
import type { AgentType } from '@/openapi/types.gen';

export const useFetchAgentMetrics = (agentType: AgentType) => {
  return useQuery({
    ...getAgentMetricsApiV1MetricsAgentAgentTypeGetOptions({
      path: {
        agent_type: agentType,
      },
    }),
    enabled: !!agentType,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
