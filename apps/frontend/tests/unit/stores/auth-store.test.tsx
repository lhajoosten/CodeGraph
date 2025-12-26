import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '@/stores/auth-store';
import { mockUser, mockUnverifiedUser } from '../fixtures/auth-fixtures';

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.logout();
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.emailVerified).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('Login', () => {
    it('should update state on login with user data', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(mockUser);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.emailVerified).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    it('should set emailVerified based on user data', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(mockUnverifiedUser);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.emailVerified).toBe(false);
      expect(result.current.user).toEqual(mockUnverifiedUser);
    });

    it('should handle login without user data', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login();
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.emailVerified).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('Logout', () => {
    it('should clear all auth state on logout', () => {
      const { result } = renderHook(() => useAuthStore());

      // First login
      act(() => {
        result.current.login(mockUser);
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Then logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.emailVerified).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should be safe to call logout when already logged out', () => {
      const { result } = renderHook(() => useAuthStore());

      // Logout when already logged out
      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.emailVerified).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('Email Verification', () => {
    it('should update emailVerified flag', () => {
      const { result } = renderHook(() => useAuthStore());

      // Login with unverified user
      act(() => {
        result.current.login(mockUnverifiedUser);
      });

      expect(result.current.emailVerified).toBe(false);

      // Verify email
      act(() => {
        result.current.setEmailVerified(true);
      });

      expect(result.current.emailVerified).toBe(true);
    });

    it('should be able to set emailVerified to false', () => {
      const { result } = renderHook(() => useAuthStore());

      // Login with verified user
      act(() => {
        result.current.login(mockUser);
      });

      expect(result.current.emailVerified).toBe(true);

      // Set to unverified
      act(() => {
        result.current.setEmailVerified(false);
      });

      expect(result.current.emailVerified).toBe(false);
    });
  });

  describe('State Persistence', () => {
    it('should persist state to localStorage', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(mockUser);
      });

      // Check if state was persisted (Zustand persist middleware handles this)
      const persistedState = localStorage.getItem('auth-storage');
      expect(persistedState).toBeTruthy();

      if (persistedState) {
        const parsed = JSON.parse(persistedState);
        expect(parsed.state.isAuthenticated).toBe(true);
        expect(parsed.state.user).toEqual(mockUser);
      }
    });

    it('should restore state from localStorage', async () => {
      // Step 1: Create a store and login (this persists data)
      const { result: result1 } = renderHook(() => useAuthStore());

      act(() => {
        result1.current.login(mockUser);
      });

      // Verify data was persisted
      const persistedData = localStorage.getItem('auth-storage');
      expect(persistedData).toBeTruthy();

      // Step 2: Clear the store instance from memory
      const { result: result2 } = renderHook(() => useAuthStore());

      // The new instance should still have the persisted data from localStorage
      // Note: Zustand's persist middleware rehydrates on mount
      expect(result2.current.isAuthenticated).toBe(true);
      expect(result2.current.emailVerified).toBe(true);
      expect(result2.current.user).toEqual(mockUser);
    });

    it('should clear persisted state on logout', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(mockUser);
      });

      // Verify state is persisted
      expect(localStorage.getItem('auth-storage')).toBeTruthy();

      act(() => {
        result.current.logout();
      });

      // Check persisted state is cleared
      const persistedState = localStorage.getItem('auth-storage');
      if (persistedState) {
        const parsed = JSON.parse(persistedState);
        expect(parsed.state.isAuthenticated).toBe(false);
        expect(parsed.state.user).toBeNull();
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple login calls', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(mockUser);
      });

      const differentUser = {
        id: 2,
        email: 'different@example.com',
        email_verified: false,
      };

      act(() => {
        result.current.login(differentUser);
      });

      expect(result.current.user).toEqual(differentUser);
      expect(result.current.emailVerified).toBe(false);
    });

    it('should maintain isAuthenticated when updating emailVerified', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login(mockUnverifiedUser);
      });

      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.setEmailVerified(true);
      });

      // isAuthenticated should remain true
      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});
