import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Mode } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  mode: Mode;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      mode: 'personal',
      isAuthenticated: false,
      // mode is always taken from the account that logged in — personal and
      // business are separate accounts, never a switch on one account.
      login: (user, token) => set({ user, token, isAuthenticated: true, mode: user.mode }),
      logout: () => {
        localStorage.removeItem('fintrack-auth');
        set({ user: null, token: null, isAuthenticated: false, mode: 'personal' });
      },
      updateUser: (partial) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...partial } });
      },
    }),
    { name: 'fintrack-auth' }
  )
);
