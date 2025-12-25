import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { progressVariants, progressIndicatorVariants } from './variants/progress-variants.ts';

export interface ProgressProps
  extends
    React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants>,
    VariantProps<typeof progressIndicatorVariants> {
  showValue?: boolean;
}

const Progress = React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(
  ({ className, value, size, variant, showValue, ...props }, ref) => (
    <div className="relative">
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(progressVariants({ size }), className)}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(progressIndicatorVariants({ variant }))}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      </ProgressPrimitive.Root>
      {showValue && (
        <span
          className={`
            absolute top-0 right-0 -translate-y-full pb-1 text-xs
            text-text-secondary
          `}
        >
          {value}%
        </span>
      )}
    </div>
  )
);
Progress.displayName = ProgressPrimitive.Root.displayName;

// Circular progress indicator
interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info';
  showValue?: boolean;
  className?: string;
}

function CircularProgress({
  value,
  size = 48,
  strokeWidth = 4,
  variant = 'default',
  showValue = false,
  className,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const colorClasses = {
    default: 'stroke-primary',
    success: 'stroke-success',
    danger: 'stroke-danger',
    warning: 'stroke-warning',
    info: 'stroke-info',
  };

  return (
    <div className={cn('relative inline-flex', className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          className="stroke-secondary"
          strokeWidth={strokeWidth}
          fill="none"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={cn('transition-all duration-300', colorClasses[variant])}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      {showValue && (
        <span
          className={`
            absolute inset-0 flex items-center justify-center text-xs
            font-medium
          `}
        >
          {Math.round(value)}%
        </span>
      )}
    </div>
  );
}

export { Progress, CircularProgress };
// eslint-disable-next-line react-refresh/only-export-components
export { progressVariants, progressIndicatorVariants } from './variants/progress-variants.ts';
