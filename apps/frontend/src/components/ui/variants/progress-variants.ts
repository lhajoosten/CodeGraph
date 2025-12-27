import { cva, type VariantProps } from 'class-variance-authority';

export const progressVariants = cva(
  `
  relative w-full overflow-hidden rounded-full bg-bg-elevated-lum
`,
  {
    variants: {
      size: {
        default: 'h-4',
        sm: 'h-2',
        lg: 'h-6',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export const progressIndicatorVariants = cva('h-full w-full flex-1 transition-all', {
  variants: {
    variant: {
      default: 'bg-brand-cyan',
      success: 'bg-success',
      danger: 'bg-error',
      warning: 'bg-warning',
      info: 'bg-brand-teal',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export type ProgressVariants = VariantProps<typeof progressVariants>;
export type ProgressIndicatorVariants = VariantProps<typeof progressIndicatorVariants>;
