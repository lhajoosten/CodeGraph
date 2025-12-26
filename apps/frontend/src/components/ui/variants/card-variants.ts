import { cva, type VariantProps } from 'class-variance-authority';

export const cardVariants = cva('rounded-lg bg-background-2 text-text-primary', {
  variants: {
    variant: {
      default: 'border border-border',
      elevated: 'shadow-card',
      ghost: 'bg-transparent',
      primary: 'border border-primary bg-background-primary',
      luminous: `
        border
        border-[rgba(255,255,255,0.1)] bg-bg-steel
        text-text-primary-lum
        shadow-glass
      `,
      luminousGlass: `
        border
        border-[rgba(255,255,255,0.1)] bg-[rgba(30,41,59,0.7)]
        text-text-primary-lum
        backdrop-blur-md
      `,
      luminousElevated: `
        bg-bg-steel
        text-text-primary-lum
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
