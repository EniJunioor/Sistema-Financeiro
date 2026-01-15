/**
 * Store de autenticação usando Zustand
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/services/auth.service';
import type { User, AuthTokens } from '@/types';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  biometricEnabled: boolean;
  
  // Actions
  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  enableBiometric: () => Promise<void>;
  disableBiometric: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      biometricEnabled: false,

      setUser: (user) => set({ user, isAuthenticated: true }),
      
      setTokens: (tokens) => set({ tokens }),

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { user, tokens } = await authService.login({ email, password });
          set({ user, tokens, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true });
        try {
          const { user, tokens } = await authService.register({ name, email, password });
          set({ user, tokens, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
          set({ 
            user: null, 
            tokens: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const isAuth = await authService.isAuthenticated();
          if (isAuth) {
            const user = await authService.getStoredUser();
            const biometricEnabled = await authService.isBiometricEnabled();
            set({ 
              user, 
              isAuthenticated: true, 
              biometricEnabled,
              isLoading: false 
            });
          } else {
            set({ 
              user: null, 
              tokens: null, 
              isAuthenticated: false, 
              isLoading: false 
            });
          }
        } catch (error) {
          set({ isLoading: false });
        }
      },

      enableBiometric: async () => {
        await authService.enableBiometric();
        set({ biometricEnabled: true });
      },

      disableBiometric: () => {
        set({ biometricEnabled: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
        biometricEnabled: state.biometricEnabled,
      }),
    }
  )
);
