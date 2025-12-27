import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHandle2FARouting } from '@/hooks/api/auth/use-handle-two-factor';
import { useAuthStore } from '@/stores/auth-store';
import { addToast } from '@/lib/toast';
import type { LoginResponse } from '@/openapi/types.gen';

// Mock toast
vi.mock('@/lib/toast', () => ({
  addToast: vi.fn(),
}));

describe('useHandle2FARouting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset auth store
    useAuthStore.getState().logout();
  });

  it('should return handler function', () => {
    const { result } = renderHook(() => useHandle2FARouting());

    expect(typeof result.current).toBe('function');
  });

  it('should return no routing when 2FA not required', () => {
    const { result } = renderHook(() => useHandle2FARouting());

    const loginResponse: LoginResponse = {
      user: { id: 1, email: 'test@example.com', first_name: 'John', last_name: 'Doe' },
      email_verified: true,
      requires_two_factor: false,
      two_factor_enabled: false,
    };

    let routingResult;
    act(() => {
      routingResult = result.current(loginResponse);
    });

    expect(routingResult?.shouldRoute).toBe(false);
    expect(routingResult?.destination).toBeNull();
  });

  it('should route to setup when 2FA required but not enabled', () => {
    const { result } = renderHook(() => useHandle2FARouting());

    const loginResponse: LoginResponse = {
      user: { id: 1, email: 'test@example.com', first_name: 'John', last_name: 'Doe' },
      email_verified: true,
      requires_two_factor: true,
      two_factor_enabled: false,
    };

    let routingResult;
    act(() => {
      routingResult = result.current(loginResponse);
    });

    expect(routingResult?.shouldRoute).toBe(true);
    expect(routingResult?.destination).toBe('/setup-2fa');
  });

  it('should route to verification when 2FA enabled', () => {
    const { result } = renderHook(() => useHandle2FARouting());

    const loginResponse: LoginResponse = {
      user: { id: 1, email: 'test@example.com', first_name: 'John', last_name: 'Doe' },
      email_verified: true,
      requires_two_factor: true,
      two_factor_enabled: true,
    };

    let routingResult;
    act(() => {
      routingResult = result.current(loginResponse);
    });

    expect(routingResult?.shouldRoute).toBe(true);
    expect(routingResult?.destination).toBe('/verify-2fa');
  });

  it('should set 2FA status in auth store when setup required', () => {
    const { result } = renderHook(() => useHandle2FARouting());

    const loginResponse: LoginResponse = {
      user: { id: 1, email: 'test@example.com', first_name: 'John', last_name: 'Doe' },
      email_verified: true,
      requires_two_factor: true,
      two_factor_enabled: false,
    };

    act(() => {
      result.current(loginResponse);
    });

    const authState = useAuthStore.getState();
    expect(authState.twoFactorEnabled).toBe(false);
    expect(authState.twoFactorVerified).toBe(false);
    expect(authState.requiresTwoFactorSetup).toBe(true);
  });

  it('should set 2FA status in auth store when verification required', () => {
    const { result } = renderHook(() => useHandle2FARouting());

    const loginResponse: LoginResponse = {
      user: { id: 1, email: 'test@example.com', first_name: 'John', last_name: 'Doe' },
      email_verified: true,
      requires_two_factor: true,
      two_factor_enabled: true,
    };

    act(() => {
      result.current(loginResponse);
    });

    const authState = useAuthStore.getState();
    expect(authState.twoFactorEnabled).toBe(true);
    expect(authState.twoFactorVerified).toBe(false);
    expect(authState.requiresTwoFactorSetup).toBe(false);
  });

  it('should show setup warning toast when 2FA setup required', () => {
    const { result } = renderHook(() => useHandle2FARouting());

    const loginResponse: LoginResponse = {
      user: { id: 1, email: 'test@example.com', first_name: 'John', last_name: 'Doe' },
      email_verified: true,
      requires_two_factor: true,
      two_factor_enabled: false,
    };

    act(() => {
      result.current(loginResponse);
    });

    expect(vi.mocked(addToast)).toHaveBeenCalledWith({
      title: '2FA Setup Required',
      description: 'Please set up two-factor authentication to continue.',
      color: 'warning',
    });
  });

  it('should show verification info toast when 2FA verification required', () => {
    const { result } = renderHook(() => useHandle2FARouting());

    const loginResponse: LoginResponse = {
      user: { id: 1, email: 'test@example.com', first_name: 'John', last_name: 'Doe' },
      email_verified: true,
      requires_two_factor: true,
      two_factor_enabled: true,
    };

    act(() => {
      result.current(loginResponse);
    });

    expect(vi.mocked(addToast)).toHaveBeenCalledWith({
      title: '2FA Verification Required',
      description: 'Please enter your 2FA code to continue.',
      color: 'info',
    });
  });

  it('should handle missing two_factor_enabled field (defaults to false)', () => {
    const { result } = renderHook(() => useHandle2FARouting());

    const loginResponse: LoginResponse = {
      user: { id: 1, email: 'test@example.com', first_name: 'John', last_name: 'Doe' },
      email_verified: true,
      requires_two_factor: true,
      // two_factor_enabled is undefined
    };

    let routingResult;
    act(() => {
      routingResult = result.current(loginResponse);
    });

    // Should treat missing field as false and route to setup
    expect(routingResult?.shouldRoute).toBe(true);
    expect(routingResult?.destination).toBe('/setup-2fa');
  });

  it('should not show toast when 2FA not required', () => {
    const { result } = renderHook(() => useHandle2FARouting());

    vi.clearAllMocks();

    const loginResponse: LoginResponse = {
      user: { id: 1, email: 'test@example.com', first_name: 'John', last_name: 'Doe' },
      email_verified: true,
      requires_two_factor: false,
    };

    act(() => {
      result.current(loginResponse);
    });

    expect(vi.mocked(addToast)).not.toHaveBeenCalled();
  });

  it('should handle multiple calls with different responses', () => {
    const { result } = renderHook(() => useHandle2FARouting());

    const response1: LoginResponse = {
      user: { id: 1, email: 'test@example.com', first_name: 'John', last_name: 'Doe' },
      email_verified: true,
      requires_two_factor: false,
    };

    const response2: LoginResponse = {
      user: { id: 1, email: 'test@example.com', first_name: 'John', last_name: 'Doe' },
      email_verified: true,
      requires_two_factor: true,
      two_factor_enabled: true,
    };

    let routing1, routing2;
    act(() => {
      routing1 = result.current(response1);
      routing2 = result.current(response2);
    });

    expect(routing1?.shouldRoute).toBe(false);
    expect(routing2?.shouldRoute).toBe(true);
    expect(routing2?.destination).toBe('/verify-2fa');
  });

  it('should return consistent structure for no routing case', () => {
    const { result } = renderHook(() => useHandle2FARouting());

    const loginResponse: LoginResponse = {
      user: { id: 1, email: 'test@example.com', first_name: 'John', last_name: 'Doe' },
      email_verified: true,
      requires_two_factor: false,
    };

    let routingResult;
    act(() => {
      routingResult = result.current(loginResponse);
    });

    expect(routingResult).toHaveProperty('shouldRoute');
    expect(routingResult).toHaveProperty('destination');
    expect(typeof routingResult?.shouldRoute).toBe('boolean');
    expect(routingResult?.destination === null || typeof routingResult?.destination === 'string').toBe(true);
  });
});
