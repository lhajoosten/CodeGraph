import { cva, type VariantProps } from 'class-variance-authority';

export const iconButtonVariants = cva(
  [
    'inline-flex items-center justify-center',
    'rounded-md transition-all duration-200',
    'ring-offset-bg-steel',
    `
      focus-visible:ring-2 focus-visible:ring-brand-cyan
      focus-visible:ring-offset-2 focus-visible:outline-none
    `,
    'disabled:pointer-events-none disabled:opacity-50',
    'cursor-pointer',
  ],
  {
    variants: {
      variant: {
        default: `
          bg-brand-cyan text-white
          hover:shadow-[0_0_16px_rgba(34,211,238,0.5)]
          active:opacity-90
        `,
        destructive: `
          bg-error text-white
          hover:shadow-[0_0_16px_rgba(239,68,68,0.5)]
          active:opacity-90
        `,
        outline: `
          border border-border-steel bg-transparent text-text-primary-lum
          hover:bg-bg-elevated-lum
          active:bg-bg-steel
        `,
        secondary: `
          bg-bg-elevated-lum text-text-primary-lum
          hover:bg-bg-steel
          active:opacity-90
        `,
        ghost: `
          text-text-secondary-lum
          hover:bg-bg-elevated-lum hover:text-text-primary-lum
          active:opacity-80
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

export type IconButtonVariants = VariantProps<typeof iconButtonVariants>;
