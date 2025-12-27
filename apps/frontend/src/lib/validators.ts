import { z } from 'zod';

/**
 * Common validation schemas for forms
 */

// Email validation
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address');

// Password validation with strength requirements
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Strong password (includes special characters)
export const strongPasswordSchema = passwordSchema.regex(
  /[^A-Za-z0-9]/,
  'Password must contain at least one special character'
);

// Simple required string
export const requiredString = (fieldName: string) => z.string().min(1, `${fieldName} is required`);

// Optional string that can be empty
export const optionalString = z.string().optional().or(z.literal(''));

// URL validation
export const urlSchema = z.string().url('Please enter a valid URL');

// Phone number (US format)
export const phoneSchema = z
  .string()
  .regex(/^[\d\s\-()]+$/, 'Please enter a valid phone number')
  .min(10, 'Phone number must be at least 10 digits');

// Username validation
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, underscores, and hyphens'
  );

// Name validation
export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must be at most 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

/**
 * Auth-related schemas
 */

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    firstName: requiredString('First name'),
    lastName: requiredString('Last name'),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export const profileCompletionSchema = z.object({
  firstName: nameSchema.optional().or(z.literal('')),
  lastName: nameSchema.optional().or(z.literal('')),
  displayName: z
    .string()
    .max(200, 'Display name must be at most 200 characters')
    .optional()
    .or(z.literal('')),
  avatarUrl: urlSchema.optional().or(z.literal('')),
});

/**
 * Task-related schemas
 */

export const taskSchema = z.object({
  title: requiredString('Title').max(200, 'Title must be at most 200 characters'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z
    .enum([
      'pending',
      'planning',
      'in_progress',
      'testing',
      'reviewing',
      'completed',
      'failed',
      'cancelled',
    ])
    .default('pending'),
});

export const taskCreateSchema = z.object({
  title: requiredString('Title').max(200, 'Title must be at most 200 characters'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
});

export const taskUpdateSchema = taskSchema.partial();

/**
 * Validation helper functions
 */

export function isValidEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

export function isValidPassword(password: string): boolean {
  return passwordSchema.safeParse(password).success;
}

export function isValidUrl(url: string): boolean {
  return urlSchema.safeParse(url).success;
}

export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  return 'strong';
}

export function getPasswordStrengthColor(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'weak':
      return 'bg-danger';
    case 'medium':
      return 'bg-warning';
    case 'strong':
      return 'bg-success';
  }
}

export function getPasswordStrengthLabel(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'weak':
      return 'Weak';
    case 'medium':
      return 'Medium';
    case 'strong':
      return 'Strong';
  }
}

/**
 * Type exports for schema inference
 */
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type ProfileCompletionFormData = z.infer<typeof profileCompletionSchema>;
export type TaskFormData = z.infer<typeof taskSchema>;
export type TaskCreateFormData = z.infer<typeof taskCreateSchema>;
export type TaskUpdateFormData = z.infer<typeof taskUpdateSchema>;
