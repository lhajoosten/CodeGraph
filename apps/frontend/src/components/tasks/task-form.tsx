import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { taskCreateSchema, type TaskCreateFormData } from '@/lib/validators';
import { TASK_PRIORITIES, TASK_PRIORITY_LABELS } from '@/lib/guards';
import { cn } from '@/lib/utils';

interface TaskFormProps {
  onSubmit: (data: TaskCreateFormData) => void;
  isLoading?: boolean;
  error?: Error | null;
  defaultValues?: Partial<TaskCreateFormData>;
  submitLabel?: string;
  className?: string;
}

export function TaskForm({
  onSubmit,
  isLoading = false,
  error = null,
  defaultValues,
  submitLabel = 'Create Task',
  className,
}: TaskFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<TaskCreateFormData>({
    resolver: zodResolver(taskCreateSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      ...defaultValues,
    },
  });

  const priority = useWatch({ control, name: 'priority' });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn('space-y-6', className)}>
      {error && (
        <Alert variant="danger">
          <AlertDescription>{error.message || 'An error occurred'}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title" required>
            Title
          </Label>
          <Input
            id="title"
            type="text"
            placeholder="Enter task title"
            variant={errors.title ? 'error' : 'default'}
            {...register('title')}
          />
          {errors.title && <p className="text-error text-xs">{errors.title.message}</p>}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe the task..."
            variant={errors.description ? 'error' : 'default'}
            {...register('description')}
          />
          {errors.description && <p className="text-error text-xs">{errors.description.message}</p>}
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={priority}
            onValueChange={(value) => setValue('priority', value as TaskCreateFormData['priority'])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              {TASK_PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {TASK_PRIORITY_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" isLoading={isLoading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
