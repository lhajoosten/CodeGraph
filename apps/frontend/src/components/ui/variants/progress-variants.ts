import { cva, type VariantProps } from 'class-variance-authority';

export const progressVariants = cva(
  `
  relative w-full overflow-hidden rounded-full bg-secondary
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
      default: 'bg-primary',
      success: 'bg-success',
      danger: 'bg-danger',
      warning: 'bg-warning',
      info: 'bg-info',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export type ProgressVariants = VariantProps<typeof progressVariants>;
export type ProgressIndicatorVariants = VariantProps<typeof progressIndicatorVariants>;
