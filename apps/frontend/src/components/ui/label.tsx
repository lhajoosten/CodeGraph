import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const labelVariants = cva(
  `
    text-sm leading-none font-medium
    peer-disabled:cursor-not-allowed peer-disabled:opacity-70
  `,
  {
    variants: {
      variant: {
        default: 'text-text-primary',
        secondary: 'text-text-secondary',
        error: 'text-danger',
        success: 'text-success',
      },
      size: {
        default: 'text-sm',
        sm: 'text-xs',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface LabelProps
  extends
    React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    VariantProps<typeof labelVariants> {
  required?: boolean;
}

const Label = React.forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, LabelProps>(
  ({ className, variant, size, required, children, ...props }, ref) => (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(labelVariants({ variant, size }), className)}
      {...props}
    >
      {children}
      {required && <span className="ml-1 text-danger">*</span>}
    </LabelPrimitive.Root>
  )
);
Label.displayName = LabelPrimitive.Root.displayName;

export { Label, labelVariants };
