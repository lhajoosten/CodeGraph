import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { textareaVariants } from './variants/textarea-variants.ts';

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
        className={cn(
          textareaVariants({ variant, textareaSize }),
          resize &&
            `
          resize-y
        `,
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
// eslint-disable-next-line react-refresh/only-export-components
export { textareaVariants } from './variants/textarea-variants.ts';
