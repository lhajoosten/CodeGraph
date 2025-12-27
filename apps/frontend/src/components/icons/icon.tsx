import React from 'react';
import { cn } from '@/lib/utils';
import { iconVariants, type IconVariants } from './variants/icon-variants';

export interface IconProps extends React.SVGAttributes<SVGElement>, IconVariants {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  /**
   * Semantic label for accessibility
   * Used when the icon is the only indicator of its purpose
   */
  label?: string;
}

/**
 * Icon Component - Renders Heroicons with size and color variants
 *
 * @example
 * // With Heroicons
 * import { CheckCircleIcon } from '@heroicons/react/24/outline';
 * <Icon icon={CheckCircleIcon} size="lg" variant="success" />
 *
 * // With custom className
 * <Icon icon={CheckCircleIcon} size="md" className="text-blue-500" />
 */
const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ icon: IconComponent, size, variant, className, label, ...props }, ref) => {
    const baseClasses = iconVariants({ size, variant });

    return (
      <IconComponent
        ref={ref}
        className={cn(baseClasses, className)}
        aria-label={label}
        {...props}
      />
    );
  }
);

Icon.displayName = 'Icon';

export { Icon };
