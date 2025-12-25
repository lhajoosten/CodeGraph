import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const iconButtonVariants = cva(
  [
    'inline-flex items-center justify-center',
    'rounded-md transition-all duration-200',
    'ring-offset-background-2',
    `
      focus-visible:ring-2 focus-visible:ring-primary
      focus-visible:ring-offset-2 focus-visible:outline-none
    `,
    'disabled:pointer-events-none disabled:opacity-50',
    'cursor-pointer',
  ],
  {
    variants: {
      variant: {
        default: `
          bg-primary text-text-button
          hover:bg-primary-600
          active:bg-primary-700
        `,
        destructive: `
          bg-danger text-white
          hover:bg-danger-600
          active:bg-danger-700
        `,
        outline:
          `
            border border-border bg-transparent text-text-primary
            hover:bg-secondary
            active:bg-tertiary
          `,
        secondary: `
          bg-secondary text-text-primary
          hover:bg-tertiary
          active:bg-gray-300
        `,
        ghost: `
          text-text-secondary
          hover:bg-secondary hover:text-text-primary
          active:bg-tertiary
        `,
      },
      size: {
        default: 'h-10 w-10',
        sm: 'h-8 w-8',
        lg: 'h-12 w-12',
        xs: 'h-6 w-6',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'default',
    },
  }
);

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
          <Loader2 className={cn('animate-spin', iconSizes[size || 'default'])} />
        ) : (
          <span className={iconSizes[size || 'default']}>{icon}</span>
        )}
      </Comp>
    );
  }
);
IconButton.displayName = 'IconButton';

export { IconButton, iconButtonVariants };
