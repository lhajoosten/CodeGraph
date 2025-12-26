import React from 'react';
import { Input } from '@/components/ui/input';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ComponentType<{ className?: string }>;
  helperText?: string;
}

/**
 * Auth Input - Wrapped Input component with label, icon, and error handling
 * - Uses luminous variant with cyan focus glow
 * - Optional left icon (Mail, Lock, User, etc.)
 * - Automatic error styling
 * - Helper text for guidance
 */
export const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, icon: Icon, helperText, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-text-secondary-lum">{label}</label>
        )}

        <div className="relative">
          {Icon && (
            <div className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-muted-lum">
              <Icon className="h-[18px] w-[18px]" />
            </div>
          )}

          <Input
            ref={ref}
            variant={error ? 'luminousError' : 'luminous'}
            className={`${Icon ? 'pl-10' : ''} ${className || ''}`}
            {...props}
          />
        </div>

        {error && <p className="text-xs font-medium text-error">{error}</p>}

        {!error && helperText && <p className="text-xs text-text-muted-lum">{helperText}</p>}
      </div>
    );
  }
);

AuthInput.displayName = 'AuthInput';
