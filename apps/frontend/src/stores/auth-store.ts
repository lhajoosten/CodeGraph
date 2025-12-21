import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserData {
  id: number;
  email: string;
  email_verified: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  emailVerified: boolean;
  user: UserData | null;
  login: (user?: UserData) => void;
  logout: () => void;
  setEmailVerified: (verified: boolean) => void;
}

/**
 * Authentication store for managing auth state.
 *
 * Note: Tokens are stored in HTTP-only cookies for security.
 * This store tracks authentication status and email verification.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      emailVerified: false,
      user: null,
      login: (user) =>
        set({
          isAuthenticated: true,
          emailVerified: user?.email_verified ?? false,
          user: user ?? null,
        }),
      logout: () =>
        set({
          isAuthenticated: false,
          emailVerified: false,
          user: null,
        }),
      setEmailVerified: (verified) => set({ emailVerified: verified }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
