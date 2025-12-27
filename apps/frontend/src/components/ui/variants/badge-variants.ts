import { cva, type VariantProps } from 'class-variance-authority';

export const badgeVariants = cva(
  'inline-flex items-center rounded-full border font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-brand-cyan text-white',
        secondary: 'border-transparent bg-bg-elevated-lum text-text-secondary-lum',
        success: 'border-transparent bg-success text-white',
        danger: 'border-transparent bg-error text-white',
        warning: 'border-transparent bg-warning text-white',
        info: 'border-transparent bg-brand-teal text-white',
        outline: 'border-border-steel bg-transparent text-text-primary-lum',
        ghost: 'border-transparent bg-transparent text-text-secondary-lum',
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
