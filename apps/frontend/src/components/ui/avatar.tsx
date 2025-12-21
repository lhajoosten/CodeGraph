import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import * as AvatarPrimitive from '@radix-ui/react-avatar';

const avatarVariants = cva('relative flex shrink-0 overflow-hidden rounded-full bg-secondary', {
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
});

export interface AvatarProps
  extends
    React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {}

const Avatar = React.forwardRef<React.ElementRef<typeof AvatarPrimitive.Root>, AvatarProps>(
  ({ className, size, ...props }, ref) => (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(avatarVariants({ size }), className)}
      {...props}
    />
  )
);
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full object-cover', className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-secondary text-text-secondary font-medium',
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

// Helper function to generate initials
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export interface UserAvatarProps extends AvatarProps {
  src?: string | null;
  name: string;
  alt?: string;
}

function UserAvatar({ src, name, alt, ...props }: UserAvatarProps) {
  return (
    <Avatar {...props}>
      <AvatarImage src={src || undefined} alt={alt || name} />
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
}

export { Avatar, AvatarImage, AvatarFallback, UserAvatar, avatarVariants, getInitials };
