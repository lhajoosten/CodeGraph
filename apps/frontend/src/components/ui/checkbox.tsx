import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';
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
      'ring-offset-background-2 transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'data-[state=checked]:bg-primary data-[state=checked]:text-text-button data-[state=checked]:border-primary',
      'data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-text-button data-[state=indeterminate]:border-primary',
      error ? 'border-danger' : 'border-border',
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn('flex items-center justify-center text-current')}>
      {props.checked === 'indeterminate' ? (
        <Minus className="h-3 w-3" />
      ) : (
        <Check className="h-3 w-3" />
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
            'text-sm font-medium leading-none cursor-pointer',
            'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
            error ? 'text-danger' : 'text-text-primary'
          )}
        >
          {label}
        </label>
        {description && <p className="text-xs text-text-tertiary">{description}</p>}
      </div>
    </div>
  );
});
CheckboxWithLabel.displayName = 'CheckboxWithLabel';

export { Checkbox, CheckboxWithLabel };
