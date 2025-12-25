import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

const formMessageVariants = cva('flex items-start gap-2 text-sm', {
  variants: {
    variant: {
      default: 'text-text-secondary',
      error: 'text-danger',
      success: 'text-success',
      warning: 'text-warning',
      info: 'text-info',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const messageIcons = {
  default: Info,
  error: AlertCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
};

export interface FormMessageProps
  extends React.HTMLAttributes<HTMLParagraphElement>, VariantProps<typeof formMessageVariants> {
  showIcon?: boolean;
}

const FormMessage = React.forwardRef<HTMLParagraphElement, FormMessageProps>(
  ({ className, variant = 'default', children, showIcon = false, ...props }, ref) => {
    if (!children) return null;

    const IconComponent = messageIcons[variant || 'default'];

    return (
      <p ref={ref} className={cn(formMessageVariants({ variant }), className)} {...props}>
        {showIcon && <IconComponent className="mt-0.5 h-4 w-4 shrink-0" />}
        <span>{children}</span>
      </p>
    );
  }
);
FormMessage.displayName = 'FormMessage';

// Form description component
const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-xs text-text-tertiary', className)} {...props} />
));
FormDescription.displayName = 'FormDescription';

// Form error summary component
interface FormErrorSummaryProps {
  errors: Record<string, { message?: string }>;
  className?: string;
}

function FormErrorSummary({ errors, className }: FormErrorSummaryProps) {
  const errorMessages = Object.entries(errors)
    .filter(([, error]) => error?.message)
    .map(([field, error]) => ({ field, message: error.message! }));

  if (errorMessages.length === 0) return null;

  return (
    <div
      className={cn('rounded-md border border-danger bg-danger-100 p-4', className)}
      role="alert"
      aria-live="polite"
    >
      <div className="mb-2 flex items-center gap-2 font-medium text-danger">
        <AlertCircle className="h-4 w-4" />
        <span>Please fix the following errors:</span>
      </div>
      <ul className="list-inside list-disc space-y-1 text-sm text-danger-800">
        {errorMessages.map(({ field, message }) => (
          <li key={field}>{message}</li>
        ))}
      </ul>
    </div>
  );
}

export { FormMessage, FormDescription, FormErrorSummary, formMessageVariants };
