import React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

type AccordionProps = Omit<
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>,
  'type'
> & {
  type: 'single' | 'multiple';
  className?: string;
};

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
>(({ className, type, ...props }, ref) => (
  <AccordionPrimitive.Root
    ref={ref}
    type={type}
    className={cn('space-y-2', className)}
    {...props}
  />
));

Accordion.displayName = 'Accordion';

type AccordionItemProps = React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>;

export const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  AccordionItemProps
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn(
      'rounded-lg border border-border-steel transition-all duration-200',
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
      'text-text-primary-lum transition-colors',
      'hover:bg-bg-elevated-lum/50 hover:text-brand-cyan',
      'data-[state=open]:text-brand-cyan',
      'focus-visible:ring-2 focus-visible:ring-brand-cyan/50 focus-visible:outline-none',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  >
    <span className="flex items-center gap-3">
      {icon && <span className="text-text-secondary-lum">{icon}</span>}
      {children}
    </span>
    <ChevronDownIcon
      className={cn(
        'h-5 w-5 shrink-0 transition-transform duration-300',
        'text-text-secondary-lum group-hover:text-brand-cyan',
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
    <div className={cn('px-4 py-3 text-text-secondary-lum', className)}>{props.children}</div>
  </AccordionPrimitive.Content>
));

AccordionContent.displayName = 'AccordionContent';

export type { AccordionProps, AccordionItemProps, AccordionTriggerProps, AccordionContentProps };
