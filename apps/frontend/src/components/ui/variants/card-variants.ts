import { cva, type VariantProps } from 'class-variance-authority';

export const cardVariants = cva('bg-bg-steel text-text-primary-lum rounded-lg', {
  variants: {
    variant: {
      default: `
        border-border-steel shadow-glass
        border
      `,
      elevated: `
        shadow-[0_10px_30px_rgba(0,0,0,0.4)]
      `,
      ghost: 'border-0 bg-transparent',
      primary: `
        border-border-steel bg-bg-elevated-lum
        shadow-glass
        border
      `,
      glass: `
        border-border-steel border
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
