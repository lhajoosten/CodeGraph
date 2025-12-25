import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const textareaVariants = cva(
  [
    'flex w-full rounded-md border bg-background-2 px-3 py-2 text-sm',
    'ring-offset-background-2 transition-colors duration-200',
    'placeholder:text-text-tertiary',
    `
      focus-visible:ring-2 focus-visible:ring-primary
      focus-visible:ring-offset-2 focus-visible:outline-none
    `,
    'disabled:cursor-not-allowed disabled:opacity-50',
    'resize-none',
  ],
  {
    variants: {
      variant: {
        default: `
          border-border
          focus-visible:border-primary
        `,
        error: `
          border-danger
          focus-visible:ring-danger
        `,
        success: `
          border-success
          focus-visible:ring-success
        `,
      },
      textareaSize: {
        default: 'min-h-[80px]',
        sm: 'min-h-[60px] text-xs',
        lg: 'min-h-[120px] text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      textareaSize: 'default',
    },
  }
);

export interface TextareaProps
  extends
    Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    VariantProps<typeof textareaVariants> {
  resize?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, textareaSize, resize = false, ...props }, ref) => {
    return (
      <textarea
        className={cn(textareaVariants({ variant, textareaSize }), resize && `
          resize-y
        `, className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea, textareaVariants };
