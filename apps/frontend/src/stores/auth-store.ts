import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserData {
  id: number;
  email: string;
  email_verified: boolean;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  profile_completed?: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  emailVerified: boolean;
  user: UserData | null;
  oauthProvider: string | null; // OAuth provider used for login (github, google, microsoft)
  twoFactorEnabled: boolean; // Does user have 2FA enabled?
  twoFactorVerified: boolean; // Has user completed 2FA this session?
  requiresTwoFactorSetup: boolean; // Must user set up 2FA before proceeding?
  login: (user?: UserData, oauthProvider?: string | null) => void;
  logout: () => void;
  setEmailVerified: (verified: boolean) => void;
  setTwoFactorStatus: (enabled: boolean, verified: boolean, requiresSetup: boolean) => void;
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
      oauthProvider: null,
      twoFactorEnabled: false,
      twoFactorVerified: false,
      requiresTwoFactorSetup: false,
      login: (user, oauthProvider = null) =>
        set({
          isAuthenticated: true,
          emailVerified: user?.email_verified ?? false,
          user: user ?? null,
          oauthProvider: oauthProvider,
        }),
      logout: () =>
        set({
          isAuthenticated: false,
          emailVerified: false,
          user: null,
          oauthProvider: null,
          twoFactorEnabled: false,
          twoFactorVerified: false,
          requiresTwoFactorSetup: false,
        }),
      setEmailVerified: (verified) => set({ emailVerified: verified }),
      setTwoFactorStatus: (enabled, verified, requiresSetup) =>
        set({
          twoFactorEnabled: enabled,
          twoFactorVerified: verified,
          requiresTwoFactorSetup: requiresSetup,
        }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
