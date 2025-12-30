import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      `
        bg-secondary text-text-secondary inline-flex h-10 items-center justify-center rounded-md
        p-1
      `,
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      `
        inline-flex items-center justify-center rounded-sm px-3 py-1.5
        whitespace-nowrap
      `,
      'ring-offset-background-2 text-sm font-medium transition-all',
      `
        focus-visible:ring-primary focus-visible:ring-2
        focus-visible:ring-offset-2 focus-visible:outline-none
      `,
      'disabled:pointer-events-none disabled:opacity-50',
      `
        data-[state=active]:bg-background-2
        data-[state=active]:text-text-primary data-[state=active]:shadow-tabs
      `,
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'ring-offset-background-2 mt-2',
      `
        focus-visible:ring-primary focus-visible:ring-2
        focus-visible:ring-offset-2 focus-visible:outline-none
      `,
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
