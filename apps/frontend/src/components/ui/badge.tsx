import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-text-button',
        secondary: 'border-transparent bg-secondary text-text-secondary',
        success: 'border-transparent bg-success text-white',
        danger: 'border-transparent bg-danger text-white',
        warning: 'border-transparent bg-warning text-text-button',
        info: 'border-transparent bg-info text-white',
        outline: 'border-border text-text-primary bg-transparent',
        ghost: 'border-transparent bg-transparent text-text-secondary',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.5 text-[10px]',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  dot?: boolean;
  dotColor?: string;
}

function Badge({ className, variant, size, dot, dotColor, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn('mr-1.5 h-1.5 w-1.5 rounded-full', dotColor || 'bg-current')}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
