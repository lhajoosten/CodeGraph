import { createContext, useContext, ReactNode } from 'react';
import {
  useForm,
  FormProvider,
  UseFormReturn,
  FieldValues,
  SubmitHandler,
  DefaultValues,
  UseFormProps,
  Resolver,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodType } from 'zod';
import { cn } from '@/lib/utils';

interface FormProps<T extends FieldValues> {
  schema: ZodType<T>;
  defaultValues?: DefaultValues<T>;
  onSubmit: SubmitHandler<T>;
  children: ReactNode | ((form: UseFormReturn<T>) => ReactNode);
  className?: string;
  formOptions?: Omit<UseFormProps<T>, 'resolver' | 'defaultValues'>;
}

function Form<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
  className,
  formOptions,
}: FormProps<T>) {
  // Cast schema to any to bypass strict zod type checking, then cast resolver result
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resolver = zodResolver(schema as any) as Resolver<T>;

  const form = useForm<T>({
    resolver,
    defaultValues,
    ...formOptions,
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={cn('space-y-4', className)}>
        {typeof children === 'function' ? children(form) : children}
      </form>
    </FormProvider>
  );
}

// Context for form field
interface FormFieldContextValue {
  name: string;
  id: string;
  error?: string;
}

const FormFieldContext = createContext<FormFieldContextValue | null>(null);

function useFormFieldContext() {
  const context = useContext(FormFieldContext);
  if (!context) {
    throw new Error('useFormFieldContext must be used within a FormField');
  }
  return context;
}

export { Form, FormFieldContext, useFormFieldContext };
export type { FormProps };
