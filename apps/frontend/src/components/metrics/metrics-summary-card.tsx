import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

interface MetricsSummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
  isLoading?: boolean;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    isPositive?: boolean;
  };
  variant?: 'teal' | 'blue' | 'amber' | 'green' | 'red' | 'default';
}

const variantStyles = {
  teal: {
    iconBg: 'bg-gradient-to-br from-brand-teal/20 to-brand-cyan/20 border border-brand-teal/30',
    iconColor: 'text-brand-teal',
    glow: 'glow-teal',
  },
  blue: {
    iconBg: 'bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30',
    iconColor: 'text-blue-500',
    glow: 'shadow-blue-500/20',
  },
  amber: {
    iconBg: 'bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30',
    iconColor: 'text-amber-500',
    glow: 'shadow-amber-500/20',
  },
  green: {
    iconBg: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30',
    iconColor: 'text-green-500',
    glow: 'shadow-green-500/20',
  },
  red: {
    iconBg: 'bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-500/30',
    iconColor: 'text-red-500',
    glow: 'shadow-red-500/20',
  },
  default: {
    iconBg: 'bg-surface-secondary border border-border',
    iconColor: 'text-text-secondary',
    glow: '',
  },
};

export function MetricsSummaryCard({
  title,
  value,
  subtitle,
  icon,
  className,
  isLoading = false,
  trend,
  variant = 'default',
}: MetricsSummaryCardProps) {
  const styles = variantStyles[variant];

  if (isLoading) {
    return (
      <Card className={cn('border-accent-top relative overflow-hidden', className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium">
            <Skeleton className="h-4 w-24" />
          </CardTitle>
          <Skeleton className="h-10 w-10 rounded-lg" />
        </CardHeader>
        <CardContent>
          <Skeleton className="mb-2 h-9 w-32" />
          <Skeleton className="h-3 w-24" />
          <div className="mt-3">
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'group border-accent-top interactive relative overflow-hidden',
        'transition-all duration-300 hover:shadow-card-hover',
        styles.glow,
        className
      )}
    >
      {/* Background gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-teal/0 to-brand-cyan/0 opacity-0 transition-opacity duration-300 group-hover:from-brand-teal/5 group-hover:to-brand-cyan/5 group-hover:opacity-100" />

      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-text-secondary">{title}</CardTitle>
        {icon && (
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110',
              styles.iconBg
            )}
          >
            <div className={cn('h-5 w-5', styles.iconColor)}>{icon}</div>
          </div>
        )}
      </CardHeader>

      <CardContent className="relative">
        <div className="flex items-baseline justify-between">
          <div className="text-3xl font-bold tracking-tight text-text-primary">{value}</div>
          {trend && (
            <div
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                trend.isPositive === undefined
                  ? trend.direction === 'up'
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                  : trend.isPositive
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
              )}
            >
              {trend.direction === 'up' ? (
                <ArrowUpIcon className="h-3 w-3" />
              ) : (
                <ArrowDownIcon className="h-3 w-3" />
              )}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>

        {subtitle && <p className="mt-1.5 text-sm text-text-muted">{subtitle}</p>}

        {/* Progress bar placeholder - can be enhanced with actual progress data */}
        <div className="mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary">
            <div
              className={cn(
                'h-full rounded-full bg-gradient-to-r transition-all duration-500',
                variant === 'teal' && 'from-brand-teal to-brand-cyan',
                variant === 'blue' && 'from-blue-500 to-blue-600',
                variant === 'amber' && 'from-amber-500 to-yellow-500',
                variant === 'green' && 'from-green-500 to-emerald-500',
                variant === 'red' && 'from-red-500 to-rose-500',
                variant === 'default' && 'from-text-secondary to-text-muted'
              )}
              style={{ width: '75%' }}
            />
          </div>
        </div>
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
    trend?: {
      value: number;
      direction: 'up' | 'down';
      isPositive?: boolean;
    };
    variant?: 'teal' | 'blue' | 'amber' | 'green' | 'red' | 'default';
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
