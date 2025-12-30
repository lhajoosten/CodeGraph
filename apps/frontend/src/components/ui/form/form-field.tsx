import * as React from 'react';
import { useFormContext, Controller, FieldPath, FieldValues } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { FormFieldContext } from './form';

// Props that can be merged onto children
interface FieldChildProps {
  variant?: string;
  [key: string]: unknown;
}

interface FormFieldProps<T extends FieldValues> {
  name: FieldPath<T>;
  label?: string;
  description?: string;
  required?: boolean;
  children: React.ReactElement<FieldChildProps>;
  className?: string;
}

function FormField<T extends FieldValues>({
  name,
  label,
  description,
  required,
  children,
  className,
}: FormFieldProps<T>) {
  const {
    control,
    formState: { errors },
  } = useFormContext<T>();

  const id = React.useId();
  const fieldError = errors[name];
  const errorMessage = fieldError?.message as string | undefined;

  return (
    <FormFieldContext.Provider value={{ name, id, error: errorMessage }}>
      <div className={cn('space-y-2', className)}>
        {label && (
          <Label htmlFor={id} required={required} variant={errorMessage ? 'error' : 'default'}>
            {label}
          </Label>
        )}

        <Controller
          name={name}
          control={control}
          render={({ field }) =>
            React.cloneElement(children, {
              ...field,
              id,
              'aria-invalid': !!errorMessage,
              'aria-describedby': errorMessage
                ? `${id}-error`
                : description
                  ? `${id}-description`
                  : undefined,
              variant: errorMessage ? 'error' : children.props.variant,
            } as FieldChildProps)
          }
        />

        {description && !errorMessage && (
          <p id={`${id}-description`} className="text-text-tertiary text-xs">
            {description}
          </p>
        )}

        {errorMessage && (
          <p id={`${id}-error`} className="text-danger text-xs" role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    </FormFieldContext.Provider>
  );
}

// Simpler version that doesn't use Controller - for uncontrolled inputs
interface FormFieldSimpleProps {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  children: React.ReactElement<FieldChildProps>;
  className?: string;
}

function FormFieldSimple({
  name,
  label,
  description,
  required,
  children,
  className,
}: FormFieldSimpleProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const id = React.useId();
  const fieldError = errors[name];
  const errorMessage = fieldError?.message as string | undefined;

  return (
    <FormFieldContext.Provider value={{ name, id, error: errorMessage }}>
      <div className={cn('space-y-2', className)}>
        {label && (
          <Label htmlFor={id} required={required} variant={errorMessage ? 'error' : 'default'}>
            {label}
          </Label>
        )}

        {React.cloneElement(children, {
          ...register(name),
          id,
          'aria-invalid': !!errorMessage,
          'aria-describedby': errorMessage
            ? `${id}-error`
            : description
              ? `${id}-description`
              : undefined,
          variant: errorMessage ? 'error' : children.props.variant,
        } as FieldChildProps)}

        {description && !errorMessage && (
          <p id={`${id}-description`} className="text-text-tertiary text-xs">
            {description}
          </p>
        )}

        {errorMessage && (
          <p id={`${id}-error`} className="text-danger text-xs" role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    </FormFieldContext.Provider>
  );
}

export { FormField, FormFieldSimple };
export type { FormFieldProps, FormFieldSimpleProps };
