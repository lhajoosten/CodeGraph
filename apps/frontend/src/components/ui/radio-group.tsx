import React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { cn } from '@/lib/utils';

interface RadioGroupProps extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

/**
 * RadioGroup Component - Select one option from a group
 * Features:
 * - Single selection
 * - Horizontal or vertical layout
 * - Keyboard navigation (arrow keys)
 * - Luminous cyan styling
 * - Custom labels and descriptions
 */
export const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(({ className, orientation = 'vertical', ...props }, ref) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn('flex gap-3', orientation === 'horizontal' ? 'flex-row' : 'flex-col', className)}
    {...props}
  />
));

RadioGroup.displayName = 'RadioGroup';

interface RadioGroupItemProps extends Omit<
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>,
  'value'
> {
  value: string;
  label?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(({ value, label, description, icon, className, ...props }, ref) => (
  <div className="flex items-start gap-3">
    <div className="relative flex items-center pt-1">
      <RadioGroupPrimitive.Item
        ref={ref}
        value={value}
        className={cn(
          'relative h-5 w-5 rounded-full border-2 border-border-primary',
          'bg-transparent transition-all duration-200',
          'focus-visible:ring-2 focus-visible:ring-brand-cyan/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none',
          'hover:border-brand-cyan/50',
          'data-[state=checked]:border-brand-cyan data-[state=checked]:shadow-[0_0_12px_rgba(34,211,238,0.3)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-brand-cyan" />
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
    </div>

    {(label || description) && (
      <div className="flex-1">
        {label && <label className="text-sm font-medium text-text-primary">{label}</label>}
        {description && <p className="text-xs text-text-secondary">{description}</p>}
      </div>
    )}

    {icon && <span className="text-text-secondary">{icon}</span>}
  </div>
));

RadioGroupItem.displayName = 'RadioGroupItem';

export type { RadioGroupProps, RadioGroupItemProps };
