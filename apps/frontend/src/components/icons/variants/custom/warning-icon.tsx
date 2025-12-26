import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Icon, type IconProps } from '../../icon';

/**
 * Warning Icon - ExclamationTriangle with warning color variant
 *
 * @example
 * <WarningIcon size="lg" />
 * <WarningIcon size="md" label="Warning" />
 */
export const WarningIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'icon'>>(
  (props, ref) => <Icon ref={ref} icon={ExclamationTriangleIcon} variant="warning" {...props} />
);

WarningIcon.displayName = 'WarningIcon';
