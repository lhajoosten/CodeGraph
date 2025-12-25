import { cva, type VariantProps } from 'class-variance-authority';

export const avatarVariants = cva(
  `
  relative flex shrink-0 overflow-hidden rounded-full bg-secondary
`,
  {
    variants: {
      size: {
        default: 'h-10 w-10',
        xs: 'h-6 w-6',
        sm: 'h-8 w-8',
        lg: 'h-12 w-12',
        xl: 'h-16 w-16',
        '2xl': 'h-24 w-24',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export type AvatarVariants = VariantProps<typeof avatarVariants>;

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
