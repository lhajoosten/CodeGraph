import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { formMessageVariants, messageIcons } from '../variants/form-message-variants.ts';

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
  <p ref={ref} className={cn('text-text-tertiary text-xs', className)} {...props} />
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
      className={cn('border-danger bg-danger-100 rounded-md border p-4', className)}
      role="alert"
      aria-live="polite"
    >
      <div className="text-danger mb-2 flex items-center gap-2 font-medium">
        <ExclamationCircleIcon className="h-4 w-4" />
        <span>Please fix the following errors:</span>
      </div>
      <ul className="text-danger-800 list-inside list-disc space-y-1 text-sm">
        {errorMessages.map(({ field, message }) => (
          <li key={field}>{message}</li>
        ))}
      </ul>
    </div>
  );
}

export { FormMessage, FormDescription, FormErrorSummary };
// eslint-disable-next-line react-refresh/only-export-components
export { formMessageVariants } from '../variants/form-message-variants.ts';
