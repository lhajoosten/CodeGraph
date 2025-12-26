import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { spinnerVariants } from './variants/spinner-variants.ts';

export interface SpinnerProps
  extends React.HTMLAttributes<SVGSVGElement>, VariantProps<typeof spinnerVariants> {}

function Spinner({ className, size, ...props }: SpinnerProps) {
  return (
    <ArrowPathIcon
      className={cn(spinnerVariants({ size }), 'animate-spin', className)}
      {...props}
    />
  );
}

export interface LoadingProps extends SpinnerProps {
  text?: string;
  fullScreen?: boolean;
}

function Loading({ text, fullScreen, className, ...props }: LoadingProps) {
  const content = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Spinner {...props} />
      {text && <p className="text-sm text-text-secondary">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className={`
          fixed inset-0 z-50 flex items-center justify-center bg-background/80
          backdrop-blur-sm
        `}
      >
        {content}
      </div>
    );
  }

  return content;
}

export { Spinner, Loading };
// eslint-disable-next-line react-refresh/only-export-components
export { spinnerVariants } from './variants/spinner-variants.ts';
