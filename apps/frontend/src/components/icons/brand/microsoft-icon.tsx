import React from 'react';
import { Icon as IconifyIcon } from '@iconify/react';
import microsoftIcon from '@iconify-icons/simple-icons/microsoft';

export const MicrosoftIcon = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={className} {...props}>
      <IconifyIcon icon={microsoftIcon} />
    </div>
  )
);

MicrosoftIcon.displayName = 'MicrosoftIcon';
