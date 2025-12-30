import { cva, type VariantProps } from 'class-variance-authority';

export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'rounded-md text-sm font-medium whitespace-nowrap',
    'ring-offset-bg-steel transition-all duration-200',
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
          bg-brand-cyan font-semibold text-white
          shadow-[0_0_12px_rgba(34,211,238,0.4)]
          transition-shadow
          hover:shadow-[0_0_20px_rgba(34,211,238,0.6)]
          active:opacity-90
        `,
        destructive: `
          bg-error text-white
          shadow-[0_0_12px_rgba(239,68,68,0.4)]
          transition-shadow
          hover:shadow-[0_0_20px_rgba(239,68,68,0.6)]
          active:opacity-90
        `,
        outline: `
          border-border-steel text-text-primary-lum border bg-transparent
          hover:bg-bg-elevated-lum
          active:bg-bg-steel
        `,
        secondary: `
          border-border-steel bg-bg-elevated-lum
          text-text-primary-lum border
          shadow-glass
          transition-all
          hover:bg-bg-steel
          active:opacity-90
        `,
        ghost: `
          border border-brand-teal
          bg-transparent text-brand-teal
          transition-shadow
          hover:shadow-[0_0_12px_rgba(45,212,191,0.4)]
          active:opacity-80
        `,
        link: `
          text-brand-cyan underline-offset-4
          hover:underline
        `,
        success: `
          bg-success text-white
          hover:opacity-90
          active:opacity-80
        `,
        warning: `
          bg-warning text-white
          hover:opacity-90
          active:opacity-80
        `,
        info: `
          bg-brand-cyan text-white
          hover:opacity-90
          active:opacity-80
        `,
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-md px-8 text-base',
        xl: 'h-12 rounded-lg px-10 text-base',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-12 w-12',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
