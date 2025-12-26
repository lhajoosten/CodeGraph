import React from 'react';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { Icon, type IconProps } from '../../icon';

/**
 * Error Icon - XCircle with danger color variant
 *
 * @example
 * <ErrorIcon size="lg" />
 * <ErrorIcon size="md" label="Error occurred" />
 */
export const ErrorIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'icon'>>((props, ref) => (
  <Icon ref={ref} icon={XCircleIcon} variant="danger" {...props} />
));

ErrorIcon.displayName = 'ErrorIcon';
