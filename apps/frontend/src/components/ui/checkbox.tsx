import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { CheckIcon, MinusIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
    error?: boolean;
  }
>(({ className, error, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'peer h-4 w-4 shrink-0 rounded-sm border',
      'ring-offset-surface-secondary transition-colors',
      `
        focus-visible:ring-2 focus-visible:ring-brand-cyan
        focus-visible:ring-offset-2 focus-visible:outline-none
      `,
      'disabled:cursor-not-allowed disabled:opacity-50',
      `
        data-[state=checked]:border-brand-cyan
        data-[state=checked]:bg-brand-cyan
        data-[state=checked]:text-white
      `,
      `
        data-[state=indeterminate]:border-brand-cyan
        data-[state=indeterminate]:bg-brand-cyan
        data-[state=indeterminate]:text-white
      `,
      error ? 'border-error' : 'border-border-primary',
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn(`
      flex items-center justify-center text-current
    `)}
    >
      {props.checked === 'indeterminate' ? (
        <MinusIcon className="h-3 w-3" />
      ) : (
        <CheckIcon className="h-3 w-3" />
      )}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

// Checkbox with label
interface CheckboxWithLabelProps extends React.ComponentPropsWithoutRef<
  typeof CheckboxPrimitive.Root
> {
  label: string;
  description?: string;
  error?: boolean;
}

const CheckboxWithLabel = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxWithLabelProps
>(({ label, description, className, id, error, ...props }, ref) => {
  const generatedId = React.useId();
  const checkboxId = id || generatedId;

  return (
    <div className={cn('flex items-start space-x-3', className)}>
      <Checkbox ref={ref} id={checkboxId} error={error} {...props} />
      <div className="grid gap-1 leading-none">
        <label
          htmlFor={checkboxId}
          className={cn(
            'cursor-pointer text-sm leading-none font-medium',
            'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
            error ? 'text-error' : 'text-text-primary'
          )}
        >
          {label}
        </label>
        {description && <p className="text-text-muted text-xs">{description}</p>}
      </div>
    </div>
  );
});
CheckboxWithLabel.displayName = 'CheckboxWithLabel';

export { Checkbox, CheckboxWithLabel };
