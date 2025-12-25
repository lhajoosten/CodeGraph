import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { labelVariants } from './variants/label-variants.ts';

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

export { Label };
// eslint-disable-next-line react-refresh/only-export-components
export { labelVariants } from './variants/label-variants.ts';
