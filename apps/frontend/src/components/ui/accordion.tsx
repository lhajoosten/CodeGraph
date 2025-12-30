import React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

type AccordionSingleProps = {
  type: 'single';
  collapsible?: boolean;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children?: React.ReactNode;
};

type AccordionMultipleProps = {
  type: 'multiple';
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  className?: string;
  children?: React.ReactNode;
};

type AccordionProps = AccordionSingleProps | AccordionMultipleProps;

/**
 * Accordion Component - Collapsible sections
 * Features:
 * - Single or multiple items open at once
 * - Animated expand/collapse
 * - Keyboard navigation (arrow keys, Enter/Space)
 * - Custom icons/indicators
 * - Luminous borders and subtle glow on active items
 */
export const Accordion = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Root>,
  AccordionProps
>(({ className, ...props }, ref) => {
  if (props.type === 'single') {
    return (
      <AccordionPrimitive.Root
        ref={ref}
        type="single"
        collapsible={props.collapsible}
        value={props.value}
        defaultValue={props.defaultValue}
        onValueChange={props.onValueChange}
        className={cn('space-y-2', className)}
      >
        {props.children}
      </AccordionPrimitive.Root>
    );
  }

  return (
    <AccordionPrimitive.Root
      ref={ref}
      type="multiple"
      value={props.value}
      defaultValue={props.defaultValue}
      onValueChange={props.onValueChange}
      className={cn('space-y-2', className)}
    >
      {props.children}
    </AccordionPrimitive.Root>
  );
});

Accordion.displayName = 'Accordion';

type AccordionItemProps = React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>;

export const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  AccordionItemProps
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn(
      'border-border-primary rounded-lg border transition-all duration-200',
      'data-[state=open]:border-brand-cyan/50 data-[state=open]:shadow-[0_0_12px_rgba(34,211,238,0.2)]',
      className
    )}
    {...props}
  />
));

AccordionItem.displayName = 'AccordionItem';

interface AccordionTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
}

export const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  AccordionTriggerProps
>(({ className, icon, children, ...props }, ref) => (
  <AccordionPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex flex-1 items-center justify-between px-4 py-3 font-semibold',
      'text-text-primary transition-colors',
      'hover:bg-surface/50 hover:text-brand-cyan',
      'data-[state=open]:text-brand-cyan',
      'focus-visible:ring-2 focus-visible:ring-brand-cyan/50 focus-visible:outline-none',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  >
    <span className="flex items-center gap-3">
      {icon && <span className="text-text-secondary">{icon}</span>}
      {children}
    </span>
    <ChevronDownIcon
      className={cn(
        'h-5 w-5 shrink-0 transition-transform duration-300',
        'text-text-secondary group-hover:text-brand-cyan',
        'data-[state=open]:rotate-180'
      )}
    />
  </AccordionPrimitive.Trigger>
));

AccordionTrigger.displayName = 'AccordionTrigger';

type AccordionContentProps = React.HTMLAttributes<HTMLDivElement>;

export const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  AccordionContentProps
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn(
      'overflow-hidden',
      'data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-in-from-top-2',
      'data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-top-2',
      'transition-all duration-300'
    )}
    {...props}
  >
    <div className={cn('text-text-secondary px-4 py-3', className)}>{props.children}</div>
  </AccordionPrimitive.Content>
));

AccordionContent.displayName = 'AccordionContent';

export type { AccordionProps, AccordionItemProps, AccordionTriggerProps, AccordionContentProps };
