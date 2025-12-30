import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface MetricsSummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
  isLoading?: boolean;
}

export function MetricsSummaryCard({
  title,
  value,
  subtitle,
  icon,
  className,
  isLoading = false,
}: MetricsSummaryCardProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <Skeleton className="h-4 w-24" />
          </CardTitle>
          {icon && <Skeleton className="h-4 w-4 rounded" />}
        </CardHeader>
        <CardContent>
          <Skeleton className="mb-1 h-8 w-32" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-text-secondary">{title}</CardTitle>
        {icon && <div className="text-text-tertiary">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="mt-1 text-xs text-text-tertiary">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

interface MetricsSummaryGridProps {
  metrics: Array<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: React.ReactNode;
  }>;
  isLoading?: boolean;
  className?: string;
}

export function MetricsSummaryGrid({
  metrics,
  isLoading = false,
  className,
}: MetricsSummaryGridProps) {
  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
      {metrics.map((metric, index) => (
        <MetricsSummaryCard key={index} {...metric} isLoading={isLoading} />
      ))}
    </div>
  );
}
