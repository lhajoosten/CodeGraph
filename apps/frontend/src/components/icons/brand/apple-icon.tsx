import React from 'react';
import { Icon as IconifyIcon } from '@iconify/react';
import appleIcon from '@iconify-icons/simple-icons/apple';

export const AppleIcon = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={className} {...props}>
      <IconifyIcon icon={appleIcon} />
    </div>
  )
);

AppleIcon.displayName = 'AppleIcon';
