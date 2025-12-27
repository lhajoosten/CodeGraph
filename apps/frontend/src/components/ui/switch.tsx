import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    className={cn(
      `
        peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center
        rounded-full border-2 border-transparent
      `,
      'transition-colors duration-200',
      `
        focus-visible:ring-2 focus-visible:ring-primary
        focus-visible:ring-offset-2 focus-visible:ring-offset-background-2
        focus-visible:outline-none
      `,
      'disabled:cursor-not-allowed disabled:opacity-50',
      `
        data-[state=checked]:bg-primary
        data-[state=unchecked]:bg-secondary
      `,
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        `
          pointer-events-none block h-5 w-5 rounded-full bg-background-2
          shadow-lg ring-0
        `,
        'transition-transform duration-200',
        `
          data-[state=checked]:translate-x-5
          data-[state=unchecked]:translate-x-0
        `
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;

// Switch with label
interface SwitchWithLabelProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  label: string;
  description?: string;
}

const SwitchWithLabel = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchWithLabelProps
>(({ label, description, className, id, ...props }, ref) => {
  const generatedId = React.useId();
  const switchId = id || generatedId;

  return (
    <div className={cn('flex items-center justify-between space-x-4', className)}>
      <div className="space-y-0.5">
        <label
          htmlFor={switchId}
          className={`
            cursor-pointer text-sm leading-none font-medium text-text-primary
            peer-disabled:cursor-not-allowed peer-disabled:opacity-70
          `}
        >
          {label}
        </label>
        {description && <p className="text-xs text-text-tertiary">{description}</p>}
      </div>
      <Switch ref={ref} id={switchId} {...props} />
    </div>
  );
});
SwitchWithLabel.displayName = 'SwitchWithLabel';

export { Switch, SwitchWithLabel };
