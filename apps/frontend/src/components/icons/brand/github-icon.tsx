import React from 'react';
import { Icon as IconifyIcon } from '@iconify/react';
import githubIcon from '@iconify-icons/simple-icons/github';

export const GithubIcon = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={className} {...props}>
      <IconifyIcon icon={githubIcon} />
    </div>
  )
);

GithubIcon.displayName = 'GithubIcon';
