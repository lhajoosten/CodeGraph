import { createLazyFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import {
  CpuChipIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useFetchMetricsSummary } from '@/hooks/api/metrics/queries/use-fetch-metrics-summary';
import { useFetchMetricsHistory } from '@/hooks/api/metrics/queries/use-fetch-metrics-history';
import { MetricsSummaryGrid } from '@/components/metrics/metrics-summary-card';
import { CostBreakdown } from '@/components/metrics/cost-breakdown';
import { SavingsDisplay } from '@/components/metrics/savings-display';
import { AgentBreakdown } from '@/components/metrics/agent-breakdown';
import { MetricsChart } from '@/components/metrics/metrics-chart';
import { CostEstimator } from '@/components/metrics/cost-estimator';

const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

const formatLatency = (ms: number): string => {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}min`;
};

const formatCurrency = (amount: number): string => {
  if (amount === 0) return '$0.00';
  if (amount < 0.01) return `$${amount.toFixed(4)}`;
  return `$${amount.toFixed(2)}`;
};

function MetricsDashboard() {
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('7d');
  const { data: summary, isLoading: isSummaryLoading } = useFetchMetricsSummary();
  const { data: history, isLoading: isHistoryLoading } = useFetchMetricsHistory({
    period,
    interval: period === '24h' ? 'hour' : 'day',
  });

  const avgLatency =
    summary && summary.total_runs > 0
      ? summary.total_latency_ms / summary.total_runs
      : 0;

  const totalCost = summary?.costs
    ? summary.costs.local_cost +
      summary.costs.claude_haiku +
      summary.costs.claude_sonnet +
      summary.costs.claude_opus
    : 0;

  const maxSavings = summary?.savings
    ? Math.max(
        summary.savings.vs_claude_haiku,
        summary.savings.vs_claude_sonnet,
        summary.savings.vs_claude_opus
      )
    : 0;

  const summaryMetrics = [
    {
      title: 'Total Tokens',
      value: summary ? formatNumber(summary.total_tokens) : '0',
      subtitle: `${summary ? formatNumber(summary.input_tokens) : '0'} input / ${summary ? formatNumber(summary.output_tokens) : '0'} output`,
      icon: <CpuChipIcon className="h-4 w-4" />,
    },
    {
      title: 'Agent Runs',
      value: summary ? formatNumber(summary.total_runs) : '0',
      subtitle: 'Total executions',
      icon: <ChartBarIcon className="h-4 w-4" />,
    },
    {
      title: 'Avg Latency',
      value: formatLatency(avgLatency),
      subtitle: 'Per agent run',
      icon: <ClockIcon className="h-4 w-4" />,
    },
    {
      title: 'Total Cost',
      value: formatCurrency(totalCost),
      subtitle: `Saved ${formatCurrency(maxSavings)}`,
      icon: <CurrencyDollarIcon className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Metrics & Analytics</h1>
        <p className="mt-2 text-text-secondary">
          Monitor AI agent usage, costs, and performance
        </p>
      </div>

      {/* Summary Cards */}
      <MetricsSummaryGrid metrics={summaryMetrics} isLoading={isSummaryLoading} />

      {/* Usage Chart */}
      <MetricsChart
        data={history}
        isLoading={isHistoryLoading}
        onPeriodChange={setPeriod}
      />

      {/* Cost & Savings Grid */}
      {summary && (
        <div className="grid gap-6 md:grid-cols-2">
          <CostBreakdown costs={summary.costs} isLoading={isSummaryLoading} />
          <SavingsDisplay savings={summary.savings} isLoading={isSummaryLoading} />
        </div>
      )}

      {/* Agent Performance */}
      <AgentBreakdown
        agentMetrics={summary?.by_agent || {}}
        isLoading={isSummaryLoading}
      />

      {/* Cost Estimator */}
      <CostEstimator />
    </div>
  );
}

export const Route = createLazyFileRoute('/_protected/metrics/')({
  component: MetricsDashboard,
});
