/**
 * Test fixtures for authentication-related tests.
 *
 * Provides mock data for users, credentials, and API responses.
 */

import type { LoginFormData, RegisterFormData } from '@/lib/validators';

/**
 * Mock user data
 */
export const mockUser = {
  id: 1,
  email: 'test@example.com',
  email_verified: true,
  first_name: 'John',
  last_name: 'Doe',
};

export const mockUnverifiedUser = {
  id: 2,
  email: 'unverified@example.com',
  email_verified: false,
};

/**
 * Mock login credentials
 */
export const mockLoginCredentials: LoginFormData = {
  email: 'test@example.com',
  password: 'Password123!',
  rememberMe: false,
};

export const mockInvalidCredentials: LoginFormData = {
  email: 'wrong@example.com',
  password: 'WrongPassword123!',
  rememberMe: false,
};

/**
 * Mock registration data
 */
export const mockRegisterData: RegisterFormData = {
  email: 'newuser@example.com',
  password: 'Password123!',
  confirmPassword: 'Password123!',
  firstName: 'John',
  lastName: 'Doe',
  acceptTerms: true,
};

export const mockInvalidRegisterData: RegisterFormData = {
  email: 'invalid-email',
  password: 'weak',
  confirmPassword: 'different',
  firstName: '',
  lastName: '',
  acceptTerms: false,
};

/**
 * Mock API responses
 */
export const mockLoginResponse = {
  user: mockUser,
  email_verified: true,
};

export const mockRegisterResponse = {
  message: 'User registered successfully. Please check your email to verify your account.',
};

export const mockForgotPasswordResponse = {
  message: 'Password reset email sent successfully',
};

export const mockResetPasswordResponse = {
  message: 'Password reset successfully',
};

export const mockEmailVerificationResponse = {
  message: 'Email verified successfully',
};

/**
 * Mock error responses
 */
export const mockLoginError = {
  response: {
    status: 401,
    data: {
      detail: 'Invalid email or password',
    },
  },
  message: 'Invalid email or password',
};

export const mockRegisterError = {
  response: {
    status: 400,
    data: {
      detail: 'Email already registered',
    },
  },
  message: 'Email already registered',
};

export const mockTokenExpiredError = {
  response: {
    status: 400,
    data: {
      detail: 'Token has expired',
    },
  },
  message: 'Token has expired',
};

export const mockNetworkError = {
  message: 'Network error',
  name: 'NetworkError',
};
