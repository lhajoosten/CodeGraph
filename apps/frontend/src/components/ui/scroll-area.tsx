import React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { cn } from '@/lib/utils';

interface ScrollAreaProps extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
  hideScrollbar?: boolean;
  orientation?: 'vertical' | 'horizontal' | 'both';
  className?: string;
  children?: React.ReactNode;
}

/**
 * ScrollArea Component - Custom scrollable container
 * Features:
 * - Custom Luminous-styled scrollbars
 * - Smooth scrolling
 * - Vertical and horizontal scrolling support
 * - Option to hide scrollbar while maintaining functionality
 * - Cyan accent colors
 */
export const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  ScrollAreaProps
>(({ className, hideScrollbar = false, orientation = 'vertical', ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn('relative overflow-hidden', className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {props.children}
    </ScrollAreaPrimitive.Viewport>

    {!hideScrollbar && (
      <>
        {(orientation === 'vertical' || orientation === 'both') && (
          <ScrollBar orientation="vertical" />
        )}
        {(orientation === 'horizontal' || orientation === 'both') && (
          <ScrollBar orientation="horizontal" />
        )}
      </>
    )}

    <ScrollAreaPrimitive.Corner className="bg-surface" />
  </ScrollAreaPrimitive.Root>
));

ScrollArea.displayName = 'ScrollArea';

interface ScrollBarProps extends Omit<
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  'orientation'
> {
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  ScrollBarProps
>(({ className, orientation = 'vertical', ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      'flex touch-none transition-colors select-none',
      orientation === 'vertical' && 'w-2.5 border-l border-l-transparent p-[1px]',
      orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent p-[1px]',
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb
      className={cn(
        'relative flex-1 rounded-full transition-colors duration-200',
        'bg-border-primary hover:bg-text-secondary',
        'data-[state=hidden]:hidden'
      )}
    />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));

ScrollBar.displayName = 'ScrollBar';

export type { ScrollAreaProps, ScrollBarProps };
