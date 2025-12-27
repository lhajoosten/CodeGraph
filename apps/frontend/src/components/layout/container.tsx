import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { containerVariants } from './container-variants';

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof containerVariants> {}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, ...props }, ref) => (
    <div ref={ref} className={cn(containerVariants({ size }), className)} {...props} />
  )
);
Container.displayName = 'Container';

export { Container };
// eslint-disable-next-line react-refresh/only-export-components
export { containerVariants } from './container-variants';
