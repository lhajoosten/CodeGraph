import { toast as sonnerToast } from 'sonner';
export { sonnerToast };

type ToastOptions = {
  title: string;
  description?: string;
  severity?: 'success' | 'danger' | 'warning' | 'info' | 'default' | 'primary';
  color?: 'success' | 'danger' | 'warning' | 'info' | 'default' | 'primary';
  duration?: number;
};

export const addToast = ({
  title,
  description,
  severity,
  color,
  duration = 5000,
}: ToastOptions) => {
  const type = severity || color || 'info';

  switch (type) {
    case 'success':
      sonnerToast.success(title, { description, duration });
      break;
    case 'danger':
      sonnerToast.error(title, { description, duration });
      break;
    case 'warning':
      sonnerToast.warning(title, { description, duration });
      break;
    case 'info':
    case 'default':
    case 'primary':
    default:
      sonnerToast.info(title, { description, duration });
      break;
  }
};

export const toast = sonnerToast;
