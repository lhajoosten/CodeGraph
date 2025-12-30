import { cva, type VariantProps } from 'class-variance-authority';

export const tableVariants = cva('text-text-primary-lum w-full caption-bottom text-sm', {
  variants: {
    variant: {
      default: `
          bg-bg-steel
          border-collapse
        `,
      glass: `
          border-collapse
          bg-[rgba(30,41,59,0.7)]
          backdrop-blur-md
        `,
      elevated: `
          bg-bg-steel
          border-collapse
          shadow-[0_10px_30px_rgba(0,0,0,0.4)]
        `,
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export type TableVariants = VariantProps<typeof tableVariants>;
