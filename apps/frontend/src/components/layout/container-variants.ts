import { cva, type VariantProps } from 'class-variance-authority';

export const containerVariants = cva(
  `
    mx-auto w-full px-4
    sm:px-6
    lg:px-8
  `,
  {
    variants: {
      size: {
        default: 'max-w-7xl',
        sm: 'max-w-3xl',
        md: 'max-w-5xl',
        lg: 'max-w-7xl',
        xl: 'max-w-screen-2xl',
        full: 'max-w-full',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export type ContainerVariants = VariantProps<typeof containerVariants>;
