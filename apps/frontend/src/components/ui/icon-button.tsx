import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { iconButtonVariants } from './variants/icon-button-variants.ts';

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof iconButtonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  icon: React.ReactNode;
  'aria-label': string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    { className, variant, size, asChild = false, isLoading = false, icon, disabled, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    const iconSizes = {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      default: 'h-5 w-5',
      lg: 'h-6 w-6',
    };

    return (
      <Comp
        className={cn(iconButtonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <ArrowPathIcon className={cn('animate-spin', iconSizes[size || 'default'])} />
        ) : (
          <span className={iconSizes[size || 'default']}>{icon}</span>
        )}
      </Comp>
    );
  }
);
IconButton.displayName = 'IconButton';

export { IconButton };
// eslint-disable-next-line react-refresh/only-export-components
export { iconButtonVariants } from './variants/icon-button-variants.ts';
