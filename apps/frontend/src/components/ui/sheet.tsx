import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

type SheetSide = 'top' | 'right' | 'bottom' | 'left';

interface SheetContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextType | undefined>(undefined);

interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  const [internalOpen, setInternalOpen] = React.useState(open ?? false);
  const isControlled = open !== undefined;
  const value = isControlled ? open : internalOpen;

  return (
    <SheetContext.Provider
      value={{
        open: value,
        setOpen: isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen,
      }}
    >
      <Dialog.Root open={value} onOpenChange={isControlled ? onOpenChange : setInternalOpen}>
        {children}
      </Dialog.Root>
    </SheetContext.Provider>
  );
}

interface SheetTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const SheetTrigger = React.forwardRef<HTMLButtonElement, SheetTriggerProps>(
  ({ asChild, ...props }, ref) => {
    return <Dialog.Trigger {...props} ref={ref} asChild={asChild} />;
  }
);

SheetTrigger.displayName = 'SheetTrigger';

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: SheetSide;
  onClose?: () => void;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
}

const sideVariants: Record<SheetSide, string> = {
  top: 'top-0 left-0 right-0 data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top',
  right:
    'right-0 top-0 bottom-0 data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right',
  bottom:
    'bottom-0 left-0 right-0 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
  left: 'left-0 top-0 bottom-0 data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left',
} as const;

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof Dialog.Content>,
  SheetContentProps & React.ComponentPropsWithoutRef<typeof Dialog.Content>
>(
  (
    {
      side = 'right',
      onClose,
      showCloseButton = true,
      closeOnOverlayClick = true,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const context = React.useContext(SheetContext);
    if (!context) {
      throw new Error('SheetContent must be used within a Sheet');
    }

    const isHorizontal = side === 'left' || side === 'right';

    return (
      <Dialog.Portal>
        {/* Overlay with blur */}
        <Dialog.Overlay
          onClick={() => {
            if (closeOnOverlayClick) {
              context.setOpen(false);
            }
          }}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
        />

        {/* Sheet content */}
        <Dialog.Content
          ref={ref}
          {...props}
          className={cn(
            'fixed z-50 flex flex-col',
            'border-border-primary bg-background border shadow-[0_10px_40px_rgba(0,0,0,0.3)]',
            'transition-all duration-300 ease-in-out',
            sideVariants[side as SheetSide],
            isHorizontal ? 'h-full w-full max-w-sm' : 'h-auto max-h-[90vh]',
            className
          )}
        >
          {showCloseButton && (
            <button
              onClick={() => {
                context.setOpen(false);
                onClose?.();
              }}
              className="text-text-secondary absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-surface hover:text-text-primary"
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}

          <div className="flex-1 overflow-y-auto">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    );
  }
);

SheetContent.displayName = 'SheetContent';

type SheetHeaderProps = React.HTMLAttributes<HTMLDivElement>;

export const SheetHeader = React.forwardRef<HTMLDivElement, SheetHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('border-border-primary flex flex-col gap-2 border-b px-6 py-4', className)}
      {...props}
    />
  )
);

SheetHeader.displayName = 'SheetHeader';

type SheetTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

export const SheetTitle = React.forwardRef<HTMLHeadingElement, SheetTitleProps>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn('text-text-primary text-lg font-semibold', className)}
      {...props}
    />
  )
);

SheetTitle.displayName = 'SheetTitle';

type SheetDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

export const SheetDescription = React.forwardRef<HTMLParagraphElement, SheetDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-text-secondary text-sm', className)} {...props} />
  )
);

SheetDescription.displayName = 'SheetDescription';

type SheetBodyProps = React.HTMLAttributes<HTMLDivElement>;

export const SheetBody = React.forwardRef<HTMLDivElement, SheetBodyProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex-1 overflow-y-auto px-6 py-4', className)} {...props} />
  )
);

SheetBody.displayName = 'SheetBody';

type SheetFooterProps = React.HTMLAttributes<HTMLDivElement>;

export const SheetFooter = React.forwardRef<HTMLDivElement, SheetFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('border-border-primary flex flex-row gap-3 border-t px-6 py-4', className)}
      {...props}
    />
  )
);

SheetFooter.displayName = 'SheetFooter';
