import React from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { Icon, type IconProps } from '../../icon';

/**
 * Info Icon - InformationCircle with primary color variant
 *
 * @example
 * <InfoIcon size="lg" />
 * <InfoIcon size="md" label="Information" />
 */
export const InfoIcon = React.forwardRef<SVGSVGElement, Omit<IconProps, 'icon'>>((props, ref) => (
  <Icon ref={ref} icon={InformationCircleIcon} variant="primary" {...props} />
));

InfoIcon.displayName = 'InfoIcon';
