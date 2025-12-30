import { createLazyFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import {
  CpuChipIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  SparklesIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { useFetchMetricsSummary } from '@/hooks/api/metrics/queries/use-fetch-metrics-summary';
import { useFetchMetricsHistory } from '@/hooks/api/metrics/queries/use-fetch-metrics-history';
import { MetricsSummaryGrid } from '@/components/metrics/metrics-summary-card';
import { CostBreakdown } from '@/components/metrics/cost-breakdown';
import { SavingsDisplay } from '@/components/metrics/savings-display';
import { AgentBreakdown } from '@/components/metrics/agent-breakdown';
import { MetricsChart } from '@/components/metrics/metrics-chart';
import { CostEstimator } from '@/components/metrics/cost-estimator';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    interval: period === '24h' ? '1h' : '1d',
  });

  const avgLatency =
    summary && summary.total_runs > 0 ? summary.total_latency_ms / summary.total_runs : 0;

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
      icon: <CpuChipIcon className="h-5 w-5" />,
      variant: 'teal' as const,
      trend: {
        value: 12.5,
        direction: 'up' as const,
        isPositive: true,
      },
    },
    {
      title: 'Agent Runs',
      value: summary ? formatNumber(summary.total_runs) : '0',
      subtitle: 'Total executions',
      icon: <ChartBarIcon className="h-5 w-5" />,
      variant: 'blue' as const,
      trend: {
        value: 8.3,
        direction: 'up' as const,
        isPositive: true,
      },
    },
    {
      title: 'Avg Latency',
      value: formatLatency(avgLatency),
      subtitle: 'Per agent run',
      icon: <ClockIcon className="h-5 w-5" />,
      variant: 'amber' as const,
      trend: {
        value: 5.2,
        direction: 'down' as const,
        isPositive: true,
      },
    },
    {
      title: 'Total Cost',
      value: formatCurrency(totalCost),
      subtitle: `Saved ${formatCurrency(maxSavings)}`,
      icon: <CurrencyDollarIcon className="h-5 w-5" />,
      variant: 'green' as const,
      trend: {
        value: 15.7,
        direction: 'down' as const,
        isPositive: true,
      },
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-teal/10 via-brand-cyan/5 to-background p-8 shadow-elevated">
          {/* Decorative pattern overlay */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <SparklesIcon className="h-6 w-6 text-brand-teal" />
                <span className="text-sm font-medium tracking-wide text-brand-teal uppercase">
                  Insights
                </span>
              </div>
              <h1 className="mb-2 text-4xl font-bold tracking-tight text-text-primary">
                Analytics Dashboard
              </h1>
              <p className="text-lg text-text-secondary">
                Monitor AI agent usage, costs, and performance metrics in real-time
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Period Selector */}
              <Tabs value={period} onValueChange={(value) => setPeriod(value as typeof period)}>
                <TabsList className="bg-surface shadow-card">
                  <TabsTrigger value="24h" className="min-w-[80px]">
                    24 Hours
                  </TabsTrigger>
                  <TabsTrigger value="7d" className="min-w-[80px]">
                    7 Days
                  </TabsTrigger>
                  <TabsTrigger value="30d" className="min-w-[80px]">
                    30 Days
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Export Button */}
              <Button variant="outline" size="default" className="gap-2">
                <ArrowDownTrayIcon className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-brand-teal" />
            <h2 className="text-sm font-semibold tracking-wide text-text-secondary uppercase">
              Overview
            </h2>
          </div>
          <MetricsSummaryGrid metrics={summaryMetrics} isLoading={isSummaryLoading} />
        </div>

        {/* Usage Chart */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-brand-teal" />
            <h2 className="text-sm font-semibold tracking-wide text-text-secondary uppercase">
              Usage Trends
            </h2>
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
            <div className="border-b border-border bg-surface-secondary px-6 py-4">
              <h3 className="text-lg font-semibold text-text-primary">Token Usage Over Time</h3>
              <p className="mt-1 text-sm text-text-muted">
                Track token consumption and identify usage patterns
              </p>
            </div>
            <div className="p-6">
              <MetricsChart
                data={history}
                isLoading={isHistoryLoading}
                onPeriodChange={setPeriod}
              />
            </div>
          </div>
        </div>

        {/* Cost & Savings Grid */}
        {summary && (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-brand-teal" />
              <h2 className="text-sm font-semibold tracking-wide text-text-secondary uppercase">
                Cost Analysis
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card transition-shadow duration-300 hover:shadow-card-hover">
                <div className="border-b border-border bg-surface-secondary px-6 py-4">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
                    <CurrencyDollarIcon className="h-5 w-5 text-brand-teal" />
                    Cost Breakdown
                  </h3>
                  <p className="mt-1 text-sm text-text-muted">Detailed cost analysis by model</p>
                </div>
                <div className="p-6">
                  <CostBreakdown costs={summary.costs} isLoading={isSummaryLoading} />
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card transition-shadow duration-300 hover:shadow-card-hover">
                <div className="border-b border-border bg-surface-secondary px-6 py-4">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
                    <SparklesIcon className="h-5 w-5 text-green-500" />
                    Cost Savings
                  </h3>
                  <p className="mt-1 text-sm text-text-muted">
                    Savings compared to alternative models
                  </p>
                </div>
                <div className="p-6">
                  <SavingsDisplay savings={summary.savings} isLoading={isSummaryLoading} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Agent Performance */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-brand-teal" />
            <h2 className="text-sm font-semibold tracking-wide text-text-secondary uppercase">
              Agent Performance
            </h2>
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
            <div className="border-b border-border bg-surface-secondary px-6 py-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
                <ChartBarIcon className="h-5 w-5 text-blue-500" />
                Agent Breakdown
              </h3>
              <p className="mt-1 text-sm text-text-muted">
                Performance metrics for each agent type
              </p>
            </div>
            <div className="p-6">
              <AgentBreakdown
                agentMetrics={summary?.by_agent || {}}
                isLoading={isSummaryLoading}
              />
            </div>
          </div>
        </div>

        {/* Cost Estimator */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-brand-teal" />
            <h2 className="text-sm font-semibold tracking-wide text-text-secondary uppercase">
              Planning Tools
            </h2>
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
            <div className="border-b border-border bg-surface-secondary px-6 py-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
                <CurrencyDollarIcon className="h-5 w-5 text-amber-500" />
                Cost Estimator
              </h3>
              <p className="mt-1 text-sm text-text-muted">
                Estimate costs for future agent executions
              </p>
            </div>
            <div className="p-6">
              <CostEstimator />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export const Route = createLazyFileRoute('/_protected/metrics/')({
  component: MetricsDashboard,
});
