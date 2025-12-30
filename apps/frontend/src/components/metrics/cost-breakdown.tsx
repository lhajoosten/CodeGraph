import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { CostBreakdownResponse } from '@/openapi/types.gen';

interface CostBreakdownProps {
  costs: CostBreakdownResponse;
  isLoading?: boolean;
}

const formatCurrency = (amount: number): string => {
  if (amount === 0) return '$0.00';
  if (amount < 0.01) return `$${amount.toFixed(4)}`;
  return `$${amount.toFixed(2)}`;
};

export function CostBreakdown({ costs, isLoading = false }: CostBreakdownProps) {
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
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const totalCost =
    costs.local_cost + costs.claude_haiku + costs.claude_sonnet + costs.claude_opus;

  const costItems = [
    {
      label: 'Local (vLLM)',
      value: costs.local_cost,
      color: 'text-green-600',
      badge: 'Free',
    },
    {
      label: 'Claude Haiku',
      value: costs.claude_haiku,
      color: 'text-blue-600',
    },
    {
      label: 'Claude Sonnet',
      value: costs.claude_sonnet,
      color: 'text-purple-600',
    },
    {
      label: 'Claude Opus',
      value: costs.claude_opus,
      color: 'text-orange-600',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Breakdown</CardTitle>
        <CardDescription>Costs by model tier</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {costItems.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${item.color.replace('text-', 'bg-')}`} />
              <span className="text-sm font-medium">{item.label}</span>
              {item.badge && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                  {item.badge}
                </span>
              )}
            </div>
            <span className={`font-semibold ${item.color}`}>{formatCurrency(item.value)}</span>
          </div>
        ))}
        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">Total Cost</span>
            <span className="text-lg font-bold">{formatCurrency(totalCost)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
