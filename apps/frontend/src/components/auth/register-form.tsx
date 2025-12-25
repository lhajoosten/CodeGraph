import { Link, useNavigate } from '@tanstack/react-router';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useRegister, useToggle } from '@/hooks';
import {
  registerSchema,
  type RegisterFormData,
  getPasswordStrength,
  getPasswordStrengthColor,
  getPasswordStrengthLabel,
} from '@/lib/validators';
import { addToast } from '@/lib/toast';
import { cn } from '@/lib/utils';

interface RegisterFormProps {
  className?: string;
  onSuccess?: () => void;
}

export function RegisterForm({ className, onSuccess }: RegisterFormProps) {
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const showPassword = useToggle(false);
  const showConfirmPassword = useToggle(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      acceptTerms: false,
    },
  });

  const password = useWatch({ control, name: 'password' });
  const passwordStrength = password ? getPasswordStrength(password) : null;
  const strengthPercent =
    passwordStrength === 'weak' ? 33 : passwordStrength === 'medium' ? 66 : 100;

  const onSubmit = async (data: RegisterFormData) => {
    registerMutation.mutate(
      {
        body: {
          email: data.email,
          password: data.password,
        },
      },
      {
        onSuccess: () => {
          addToast({
            title: 'Account created!',
            description: 'Please check your email to verify your account.',
            color: 'success',
          });
          if (onSuccess) {
            onSuccess();
          } else {
            navigate({ to: '/verify-email-pending', search: { email: data.email } });
          }
        },
        onError: (error: Error) => {
          addToast({
            title: 'Registration failed',
            description: error.message || 'Please try again.',
            color: 'danger',
          });
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn('space-y-6', className)}>
      {registerMutation.error && (
        <Alert variant="danger">
          <AlertDescription>
            {registerMutation.error.message || 'Registration failed. Please try again.'}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {/* Name fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" required>
              First Name
            </Label>
            <Input
              id="firstName"
              type="text"
              placeholder="John"
              autoComplete="given-name"
              leftIcon={<User className="h-4 w-4" />}
              variant={errors.firstName ? 'error' : 'default'}
              {...register('firstName')}
            />
            {errors.firstName && <p className="text-xs text-danger">{errors.firstName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" required>
              Last Name
            </Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Doe"
              autoComplete="family-name"
              variant={errors.lastName ? 'error' : 'default'}
              {...register('lastName')}
            />
            {errors.lastName && <p className="text-xs text-danger">{errors.lastName.message}</p>}
          </div>
        </div>

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
          <Label htmlFor="password" required>
            Password
          </Label>
          <Input
            id="password"
            type={showPassword.isOpen ? 'text' : 'password'}
            placeholder="Create a strong password"
            autoComplete="new-password"
            leftIcon={<Lock className="h-4 w-4" />}
            rightIcon={
              <button
                type="button"
                onClick={showPassword.toggle}
                className={`
                  text-text-tertiary
                  hover:text-text-primary
                `}
                tabIndex={-1}
              >
                {showPassword.isOpen ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className={`h-4 w-4`} />
                )}
              </button>
            }
            variant={errors.password ? 'error' : 'default'}
            {...register('password')}
          />
          {password && (
            <div className="space-y-1">
              <Progress
                value={strengthPercent}
                size="sm"
                className="h-1"
                variant={
                  passwordStrength === 'weak'
                    ? 'danger'
                    : passwordStrength === 'medium'
                      ? 'warning'
                      : 'success'
                }
              />
              <p
                className={cn(
                  'text-xs',
                  getPasswordStrengthColor(passwordStrength!).replace('bg-', 'text-')
                )}
              >
                Password strength: {getPasswordStrengthLabel(passwordStrength!)}
              </p>
            </div>
          )}
          {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
        </div>

        {/* Confirm password field */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" required>
            Confirm Password
          </Label>
          <Input
            id="confirmPassword"
            type={showConfirmPassword.isOpen ? 'text' : 'password'}
            placeholder="Confirm your password"
            autoComplete="new-password"
            leftIcon={<Lock className="h-4 w-4" />}
            rightIcon={
              <button
                type="button"
                onClick={showConfirmPassword.toggle}
                className={`
                  text-text-tertiary
                  hover:text-text-primary
                `}
                tabIndex={-1}
              >
                {showConfirmPassword.isOpen ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            }
            variant={errors.confirmPassword ? 'error' : 'default'}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-danger">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Terms acceptance */}
        <div className="space-y-2">
          <div className="flex items-start space-x-2">
            <Checkbox id="acceptTerms" error={!!errors.acceptTerms} {...register('acceptTerms')} />
            <label
              htmlFor="acceptTerms"
              className={cn(
                'cursor-pointer text-sm leading-tight',
                errors.acceptTerms ? 'text-danger' : 'text-text-secondary'
              )}
            >
              I agree to the{' '}
              <a
                href="/terms"
                className={`
                  text-primary
                  hover:underline
                `}
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a
                href="/privacy"
                className={`
                  text-primary
                  hover:underline
                `}
              >
                Privacy Policy
              </a>
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="text-xs text-danger">{errors.acceptTerms.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" fullWidth isLoading={isSubmitting || registerMutation.isPending}>
        Create Account
      </Button>

      <p className="text-center text-sm text-text-secondary">
        Already have an account?{' '}
        <Link
          to="/login"
          search={{ redirect: '/' }}
          className={`
            font-medium text-primary
            hover:underline
          `}
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
