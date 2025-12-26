import { cva, type VariantProps } from 'class-variance-authority';

export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'rounded-md text-sm font-medium whitespace-nowrap',
    'ring-offset-background-2 transition-all duration-200',
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
        outline: `
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
          text-text-button-ghost
          hover:bg-secondary
          active:bg-tertiary
        `,
        link: `
          text-primary underline-offset-4
          hover:underline
        `,
        success: `
          bg-success text-white
          hover:bg-success-600
          active:bg-success-700
        `,
        warning: `
          bg-warning text-text-button
          hover:bg-warning-600
          active:bg-warning-700
        `,
        info: `
          bg-info text-white
          hover:bg-info-600
          active:bg-info-700
        `,
        luminous: `
          bg-brand-cyan font-semibold text-white
          shadow-[0_0_12px_rgba(34,211,238,0.4)]
          transition-shadow
          hover:shadow-[0_0_20px_rgba(34,211,238,0.6)]
          active:opacity-90
        `,
        luminousGhost: `
          border border-brand-teal
          bg-transparent text-brand-teal
          transition-shadow
          hover:shadow-[0_0_12px_rgba(45,212,191,0.4)]
          active:opacity-80
        `,
        luminousSecondary: `
          border border-border-steel
          bg-bg-elevated-lum text-text-primary-lum
          shadow-glass
          transition-all
          hover:bg-bg-steel
          active:opacity-90
        `,
        luminousDanger: `
          bg-error text-white
          shadow-[0_0_12px_rgba(239,68,68,0.4)]
          transition-shadow
          hover:shadow-[0_0_20px_rgba(239,68,68,0.6)]
          active:opacity-90
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
