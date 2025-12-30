import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import type { SavingsResponse } from '@/openapi/types.gen';

interface SavingsDisplayProps {
  savings: SavingsResponse;
  isLoading?: boolean;
}

const formatCurrency = (amount: number): string => {
  if (amount === 0) return '$0.00';
  if (amount < 0.01) return `$${amount.toFixed(4)}`;
  return `$${amount.toFixed(2)}`;
};

const formatPercentage = (saved: number, total: number): string => {
  if (total === 0) return '0%';
  const percentage = (saved / total) * 100;
  return `${percentage.toFixed(0)}%`;
};

export function SavingsDisplay({ savings, isLoading = false }: SavingsDisplayProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-32" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-48" />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const savingsItems = [
    {
      label: 'vs Claude Haiku',
      value: savings.vs_claude_haiku,
      total: savings.vs_claude_haiku,
    },
    {
      label: 'vs Claude Sonnet',
      value: savings.vs_claude_sonnet,
      total: savings.vs_claude_sonnet,
    },
    {
      label: 'vs Claude Opus',
      value: savings.vs_claude_opus,
      total: savings.vs_claude_opus,
    },
  ];

  const maxSavings = Math.max(
    savings.vs_claude_haiku,
    savings.vs_claude_sonnet,
    savings.vs_claude_opus
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
          <CardTitle>Cost Savings</CardTitle>
        </div>
        <CardDescription>Compared to cloud-only deployments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {savingsItems.map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{item.label}</span>
              <span className="text-lg font-bold text-green-600">{formatCurrency(item.value)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${(item.value / maxSavings) * 100}%` }}
                />
              </div>
              <span className="text-text-tertiary w-12 text-right text-xs">
                {formatPercentage(item.value, item.total)}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
