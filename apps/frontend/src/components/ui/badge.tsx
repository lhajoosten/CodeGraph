import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { badgeVariants } from './variants/badge-variants.ts';

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
          className={cn(
            'mr-1.5 h-1.5 w-1.5 rounded-full',
            dotColor ||
              `
            bg-current
          `
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}

export { Badge };
// eslint-disable-next-line react-refresh/only-export-components
export { badgeVariants } from './variants/badge-variants.ts';
