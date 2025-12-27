import { cva, type VariantProps } from 'class-variance-authority';

export const labelVariants = cva(
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

export type LabelVariants = VariantProps<typeof labelVariants>;
