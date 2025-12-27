import { cva, type VariantProps } from 'class-variance-authority';

export const tableVariants = cva('w-full caption-bottom text-sm text-text-primary-lum', {
  variants: {
    variant: {
      default: `
          border-collapse
          bg-bg-steel
        `,
      glass: `
          border-collapse
          bg-[rgba(30,41,59,0.7)]
          backdrop-blur-md
        `,
      elevated: `
          border-collapse
          bg-bg-steel
          shadow-[0_10px_30px_rgba(0,0,0,0.4)]
        `,
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export type TableVariants = VariantProps<typeof tableVariants>;
