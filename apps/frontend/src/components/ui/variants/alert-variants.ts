import { cva, type VariantProps } from 'class-variance-authority';
import {
  CheckCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export const alertVariants = cva(
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

export const alertIcons = {
  default: InformationCircleIcon,
  info: InformationCircleIcon,
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  danger: XCircleIcon,
};

export type AlertVariants = VariantProps<typeof alertVariants>;
