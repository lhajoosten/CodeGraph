import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { CheckCircle2, Info, XCircle, AlertTriangle } from 'lucide-react';

const alertVariants = cva(
  `
    [&>svg]:text-foreground [&>svg]:absolute [&>svg]:top-4 [&>svg]:left-4
    relative w-full rounded-lg border p-4
    [&>svg+div]:translate-y-[-3px]
    [&>svg~*]:pl-7
  `,
  {
    variants: {
      variant: {
        default: 'border-border bg-background-2 text-text-primary',
        info: `
          border-info bg-info-100 text-info-800
          [&>svg]:text-info
        `,
        success: `
          border-success bg-success-100 text-success-800
          [&>svg]:text-success
        `,
        warning: `
          border-warning bg-warning-100 text-warning-800
          [&>svg]:text-warning
        `,
        danger: `
          border-danger bg-danger-100 text-danger-800
          [&>svg]:text-danger
        `,
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const alertIcons = {
  default: Info,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  icon?: React.ReactNode;
  showIcon?: boolean;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', icon, showIcon = true, children, ...props }, ref) => {
    const IconComponent = alertIcons[variant || 'default'];

    return (
      <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
        {showIcon && (icon || <IconComponent className="h-4 w-4" />)}
        {children}
      </div>
    );
  }
);
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn('mb-1 leading-none font-medium tracking-tight', className)}
      {...props}
    />
  )
);
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn(`
    text-sm
    [&_p]:leading-relaxed
  `, className)} {...props} />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription, alertVariants };
