import { cva, type VariantProps } from 'class-variance-authority';

export const badgeVariants = cva(
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
        outline: 'border-border bg-transparent text-text-primary',
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

export type BadgeVariants = VariantProps<typeof badgeVariants>;
