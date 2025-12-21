import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const spinnerVariants = cva('animate-spin text-primary', {
  variants: {
    size: {
      default: 'h-6 w-6',
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      lg: 'h-8 w-8',
      xl: 'h-12 w-12',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

export interface SpinnerProps
  extends React.HTMLAttributes<SVGSVGElement>, VariantProps<typeof spinnerVariants> {}

function Spinner({ className, size, ...props }: SpinnerProps) {
  return <Loader2 className={cn(spinnerVariants({ size }), className)} {...props} />;
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}

export { Spinner, Loading, spinnerVariants };
