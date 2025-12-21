import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLogin, useToggle } from '@/hooks';
import { loginSchema, type LoginFormData } from '@/lib/validators';
import { addToast } from '@/lib/toast';
import { cn } from '@/lib/utils';

interface LoginFormProps {
  className?: string;
  onSuccess?: () => void;
}

export function LoginForm({ className, onSuccess }: LoginFormProps) {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { redirect?: string };
  const loginMutation = useLogin();
  const showPassword = useToggle(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    loginMutation.mutate(
      { body: { email: data.email, password: data.password } },
      {
        onSuccess: () => {
          addToast({
            title: 'Welcome back!',
            description: 'You have successfully logged in.',
            color: 'success',
          });
          if (onSuccess) {
            onSuccess();
          } else {
            const redirectTo = search?.redirect || '/';
            navigate({ to: redirectTo });
          }
        },
        onError: (error: Error) => {
          addToast({
            title: 'Login failed',
            description: error.message || 'Please check your credentials and try again.',
            color: 'danger',
          });
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn('space-y-6', className)}>
      {loginMutation.error && (
        <Alert variant="danger">
          <AlertDescription>
            {loginMutation.error.message || 'Invalid email or password'}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {/* Email field */}
        <div className="space-y-2">
          <Label htmlFor="email" required>
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            leftIcon={<Mail className="h-4 w-4" />}
            variant={errors.email ? 'error' : 'default'}
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
        </div>

        {/* Password field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" required>
              Password
            </Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type={showPassword.isOpen ? 'text' : 'password'}
            placeholder="Enter your password"
            autoComplete="current-password"
            leftIcon={<Lock className="h-4 w-4" />}
            rightIcon={
              <button
                type="button"
                onClick={showPassword.toggle}
                className="text-text-tertiary hover:text-text-primary"
                tabIndex={-1}
              >
                {showPassword.isOpen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            variant={errors.password ? 'error' : 'default'}
            {...register('password')}
          />
          {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
        </div>

        {/* Remember me */}
        <div className="flex items-center space-x-2">
          <Checkbox id="rememberMe" {...register('rememberMe')} />
          <label htmlFor="rememberMe" className="text-sm text-text-secondary cursor-pointer">
            Remember me
          </label>
        </div>
      </div>

      <Button type="submit" fullWidth isLoading={isSubmitting || loginMutation.isPending}>
        Sign In
      </Button>

      <p className="text-center text-sm text-text-secondary">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary hover:underline font-medium">
          Sign up
        </Link>
      </p>
    </form>
  );
}
