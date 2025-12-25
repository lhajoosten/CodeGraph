import { cva, type VariantProps } from 'class-variance-authority';

export const cardVariants = cva('rounded-lg bg-background-2 text-text-primary', {
  variants: {
    variant: {
      default: 'border border-border',
      elevated: 'shadow-card',
      ghost: 'bg-transparent',
      primary: 'border border-primary bg-background-primary',
    },
    padding: {
      default: '',
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'default',
  },
});

export type CardVariants = VariantProps<typeof cardVariants>;
