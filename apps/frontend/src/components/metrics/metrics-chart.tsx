import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { MetricsTimeseriesResponse } from '@/openapi/types.gen';

interface MetricsChartProps {
  data: MetricsTimeseriesResponse | undefined;
  isLoading?: boolean;
  onPeriodChange?: (period: '24h' | '7d' | '30d') => void;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const formatTimestamp = (timestamp: string, interval: string): string => {
  const date = new Date(timestamp);

  if (interval === 'hour') {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

export function MetricsChart({ data, isLoading = false, onPeriodChange }: MetricsChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'24h' | '7d' | '30d'>('7d');

  const handlePeriodChange = (period: '24h' | '7d' | '30d') => {
    setSelectedPeriod(period);
    onPeriodChange?.(period);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                <Skeleton className="h-6 w-32" />
              </CardTitle>
              <CardDescription>
                <Skeleton className="mt-2 h-4 w-48" />
              </CardDescription>
            </div>
            <Skeleton className="h-10 w-64" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data?.data.map((point) => ({
    timestamp: formatTimestamp(point.timestamp, data.interval),
    tokens: point.total_tokens,
    runs: point.input_tokens, // Using input_tokens as proxy for runs count
  })) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Usage Over Time</CardTitle>
            <CardDescription>Token usage and agent runs</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={selectedPeriod === '24h' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange('24h')}
            >
              24h
            </Button>
            <Button
              variant={selectedPeriod === '7d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange('7d')}
            >
              7d
            </Button>
            <Button
              variant={selectedPeriod === '30d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange('30d')}
            >
              30d
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-text-tertiary">
            <p>No data available for the selected period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="timestamp"
                className="text-xs"
                tick={{ fill: 'hsl(var(--text-tertiary))' }}
              />
              <YAxis
                yAxisId="left"
                className="text-xs"
                tick={{ fill: 'hsl(var(--text-tertiary))' }}
                tickFormatter={formatNumber}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                className="text-xs"
                tick={{ fill: 'hsl(var(--text-tertiary))' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--bg-elevated))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                labelStyle={{ color: 'hsl(var(--text-primary))' }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="tokens"
                stroke="hsl(var(--brand-cyan))"
                strokeWidth={2}
                name="Tokens"
                dot={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="runs"
                stroke="hsl(var(--brand-purple))"
                strokeWidth={2}
                name="Runs"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
