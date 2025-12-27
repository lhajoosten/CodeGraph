import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { Icon, type IconProps } from '../../icon';

/**
 * Loading Icon - ArrowPath with spinning animation
 * Uses Tailwind's animate-spin class for rotation
 *
 * @example
 * <LoadingIcon size="md" />
 * <LoadingIcon size="lg" label="Loading..." />
 */
export const LoadingIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'icon'>>(
  ({ className, ...props }, ref) => (
    <Icon
      ref={ref}
      icon={ArrowPathIcon}
      variant="muted"
      className={cn('animate-spin', className)}
      {...props}
    />
  )
);

LoadingIcon.displayName = 'LoadingIcon';
