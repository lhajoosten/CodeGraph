import { cva, type VariantProps } from 'class-variance-authority';

export const textareaVariants = cva(
  [
    'flex w-full rounded-md border bg-bg-elevated-lum px-3 py-2 text-sm',
    'ring-offset-bg-steel transition-colors duration-200',
    'text-text-primary-lum placeholder:text-text-muted-lum',
    `
      focus-visible:ring-2 focus-visible:ring-brand-cyan
      focus-visible:ring-offset-2 focus-visible:outline-none
    `,
    'disabled:cursor-not-allowed disabled:opacity-50',
    'resize-none',
  ],
  {
    variants: {
      variant: {
        default: `
          border-border-default-lum
          focus-visible:border-brand-cyan
          focus-visible:shadow-[0_0_8px_rgba(34,211,238,0.3)]
        `,
        error: `
          border-error
          focus-visible:shadow-[0_0_8px_rgba(239,68,68,0.3)]
          focus-visible:ring-error
        `,
        success: `
          border-success
          focus-visible:shadow-[0_0_8px_rgba(34,197,94,0.3)]
          focus-visible:ring-success
        `,
      },
      textareaSize: {
        default: 'min-h-[80px]',
        sm: 'min-h-[60px] text-xs',
        lg: 'min-h-[120px] text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      textareaSize: 'default',
    },
  }
);

export type TextareaVariants = VariantProps<typeof textareaVariants>;
