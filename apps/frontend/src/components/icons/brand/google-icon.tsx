import React from 'react';
import { Icon as IconifyIcon } from '@iconify/react';
import googleIcon from '@iconify-icons/simple-icons/google';

export const GoogleIcon = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={className} {...props}>
      <IconifyIcon icon={googleIcon} />
    </div>
  )
);

GoogleIcon.displayName = 'GoogleIcon';
