import { cva, type VariantProps } from 'class-variance-authority';

export const iconVariants = cva(['inline-block'], {
  variants: {
    size: {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
      xl: 'h-8 w-8',
      '2xl': 'h-12 w-12',
    },
    variant: {
      default: 'text-gray-900 dark:text-gray-100',
      primary: 'text-blue-600 dark:text-blue-400',
      success: 'text-green-600 dark:text-green-400',
      warning: 'text-yellow-600 dark:text-yellow-400',
      danger: 'text-red-600 dark:text-red-400',
      muted: 'text-gray-500 dark:text-gray-400',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
});

export type IconVariants = VariantProps<typeof iconVariants>;
