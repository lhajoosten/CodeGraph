import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export const formMessageVariants = cva('flex items-start gap-2 text-sm', {
  variants: {
    variant: {
      default: 'text-text-secondary',
      error: 'text-danger',
      success: 'text-success',
      warning: 'text-warning',
      info: 'text-info',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export const messageIcons = {
  default: Info,
  error: AlertCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
};

export type FormMessageVariants = VariantProps<typeof formMessageVariants>;
