import { cva, type VariantProps } from 'class-variance-authority';

export const spinnerVariants = cva('text-primary animate-spin', {
  variants: {
    size: {
      default: 'h-6 w-6',
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      lg: 'h-8 w-8',
      xl: 'h-12 w-12',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

export type SpinnerVariants = VariantProps<typeof spinnerVariants>;
