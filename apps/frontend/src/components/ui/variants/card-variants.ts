import { cva, type VariantProps } from 'class-variance-authority';

export const cardVariants = cva('rounded-lg bg-bg-steel text-text-primary-lum', {
  variants: {
    variant: {
      default: `
        border border-border-steel
        shadow-glass
      `,
      elevated: `
        shadow-[0_10px_30px_rgba(0,0,0,0.4)]
      `,
      ghost: 'border-0 bg-transparent',
      primary: `
        border border-border-steel
        bg-bg-elevated-lum
        shadow-glass
      `,
      glass: `
        border border-border-steel
        bg-[rgba(30,41,59,0.7)]
        backdrop-blur-md
      `,
      glassElevated: `
        bg-bg-steel
        shadow-[0_10px_30px_rgba(0,0,0,0.4)]
      `,
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
