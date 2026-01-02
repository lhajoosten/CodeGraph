import { cva, type VariantProps } from 'class-variance-authority';

export const inputVariants = cva(
  [
    // Base styling with glass effect
    'flex w-full rounded-lg border px-3 py-2 text-sm',
    'bg-surface/80 backdrop-blur-sm',
    'ring-offset-surface transition-all duration-200',
    // File inputs
    'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-brand-cyan',
    // Text colors
    'text-text-primary placeholder:text-text-muted',
    // Focus styling with glow
    'focus-visible:ring-2 focus-visible:ring-brand-cyan/30 focus-visible:ring-offset-1 focus-visible:outline-none',
    // Disabled state
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-secondary',
  ],
  {
    variants: {
      variant: {
        default: [
          'border-border-primary/50',
          'hover:border-border-primary/80 hover:bg-surface',
          'focus-visible:border-brand-cyan/50',
          'focus-visible:shadow-[0_0_12px_rgba(34,211,238,0.25)]',
        ],
        error: [
          'border-danger/70',
          'hover:border-danger',
          'focus-visible:border-danger',
          'focus-visible:shadow-[0_0_12px_rgba(239,68,68,0.25)]',
          'focus-visible:ring-danger/30',
        ],
        success: [
          'border-success/70',
          'hover:border-success',
          'focus-visible:border-success',
          'focus-visible:shadow-[0_0_12px_rgba(34,197,94,0.25)]',
          'focus-visible:ring-success/30',
        ],
      },
      inputSize: {
        default: 'h-10',
        sm: 'h-9 px-2.5 text-xs',
        lg: 'h-12 px-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'default',
    },
  }
);

export type InputVariants = VariantProps<typeof inputVariants>;
