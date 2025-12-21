import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  login: (_token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      isAuthenticated: false,
      login: (_token: string) => set({ token: _token, isAuthenticated: true }),
      logout: () => set({ token: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
