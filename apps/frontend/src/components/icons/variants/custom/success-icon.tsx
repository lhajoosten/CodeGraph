import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { Icon, type IconProps } from '../../icon';

/**
 * Success Icon - CheckCircle with success color variant
 *
 * @example
 * <SuccessIcon size="lg" />
 * <SuccessIcon size="md" label="Task completed" />
 */
export const SuccessIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'icon'>>(
  (props, ref) => <Icon ref={ref} icon={CheckCircleIcon} variant="success" {...props} />
);

SuccessIcon.displayName = 'SuccessIcon';
