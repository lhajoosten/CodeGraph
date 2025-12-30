import { cva, type VariantProps } from 'class-variance-authority';

export const badgeVariants = cva(
  'inline-flex items-center rounded-full border font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-brand-cyan text-white',
        secondary: 'bg-bg-elevated-lum text-text-secondary-lum border-transparent',
        success: 'bg-success border-transparent text-white',
        danger: 'bg-error border-transparent text-white',
        warning: 'bg-warning border-transparent text-white',
        info: 'bg-brand-teal border-transparent text-white',
        outline: 'border-border-steel text-text-primary-lum bg-transparent',
        ghost: 'text-text-secondary-lum border-transparent bg-transparent',
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
