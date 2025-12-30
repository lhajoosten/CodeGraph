import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { AgentMetricsResponse } from '@/openapi/types.gen';

interface AgentBreakdownProps {
  agentMetrics: Record<string, AgentMetricsResponse>;
  isLoading?: boolean;
}

const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

const formatLatency = (ms: number): string => {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}min`;
};

const agentTypeLabels: Record<string, string> = {
  planner: 'Planner',
  researcher: 'Researcher',
  coder: 'Coder',
  tester: 'Tester',
  reviewer: 'Reviewer',
  documenter: 'Documenter',
};

export function AgentBreakdown({ agentMetrics, isLoading = false }: AgentBreakdownProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-40" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-56" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const agents = Object.entries(agentMetrics).map(([type, metrics]) => ({
    type,
    label: agentTypeLabels[type] || type,
    ...metrics,
  }));

  // Sort by total runs descending
  agents.sort((a, b) => b.total_runs - a.total_runs);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Performance</CardTitle>
        <CardDescription>Breakdown by agent type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                  Agent
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-text-secondary">
                  Runs
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-text-secondary">
                  Tokens
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-text-secondary">
                  Avg Latency
                </th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => {
                return (
                  <tr key={agent.type} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{agent.label}</td>
                    <td className="px-4 py-3 text-right">{formatNumber(agent.total_runs)}</td>
                    <td className="px-4 py-3 text-right">{formatNumber(agent.total_tokens)}</td>
                    <td className="px-4 py-3 text-right">{formatLatency(agent.avg_latency_ms)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {agents.length === 0 && (
          <div className="py-8 text-center text-text-tertiary">
            <p>No agent activity yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
