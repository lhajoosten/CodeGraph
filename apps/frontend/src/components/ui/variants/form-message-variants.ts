import { cva, type VariantProps } from 'class-variance-authority';
import {
  ExclamationCircleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

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
  default: InformationCircleIcon,
  error: ExclamationCircleIcon,
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
};

export type FormMessageVariants = VariantProps<typeof formMessageVariants>;
