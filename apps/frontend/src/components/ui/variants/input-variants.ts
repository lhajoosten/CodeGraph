import { cva, type VariantProps } from 'class-variance-authority';

export const inputVariants = cva(
  [
    'flex w-full rounded-md border bg-background-2 px-3 py-2 text-sm',
    'ring-offset-background-2 transition-colors duration-200',
    'file:border-0 file:bg-transparent file:text-sm file:font-medium',
    'placeholder:text-text-tertiary',
    `
      focus-visible:ring-2 focus-visible:ring-primary
      focus-visible:ring-offset-2 focus-visible:outline-none
    `,
    'disabled:cursor-not-allowed disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        default: `
          border-border
          focus-visible:border-primary
        `,
        error: `
          border-danger
          focus-visible:ring-danger
        `,
        success: `
          border-success
          focus-visible:ring-success
        `,
        luminous: `
          border
          border-border-default-lum
          bg-[rgba(15,23,42,0.5)] text-text-primary-lum
          backdrop-blur-sm
          transition-all
          placeholder:text-text-muted-lum
          focus-visible:border-brand-cyan
          focus-visible:shadow-[0_0_8px_rgba(34,211,238,0.3)]
        `,
        luminousError: `
          border
          border-error
          bg-[rgba(15,23,42,0.5)] text-text-primary-lum
          backdrop-blur-sm
          transition-all
          placeholder:text-text-muted-lum
          focus-visible:shadow-[0_0_8px_rgba(239,68,68,0.3)]
        `,
        luminousSuccess: `
          border
          border-success
          bg-[rgba(15,23,42,0.5)] text-text-primary-lum
          backdrop-blur-sm
          transition-all
          placeholder:text-text-muted-lum
          focus-visible:shadow-[0_0_8px_rgba(34,197,94,0.3)]
        `,
      },
      inputSize: {
        default: 'h-10',
        sm: 'h-9 px-2 text-xs',
        lg: 'h-11 px-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'default',
    },
  }
);

export type InputVariants = VariantProps<typeof inputVariants>;
