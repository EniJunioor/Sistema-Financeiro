/**
 * Serviço de autenticação
 */

import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { api, apiService } from './api';
import { API_ENDPOINTS, STORAGE_KEYS } from '@/constants/config';
import type { User, AuthTokens } from '@/types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
    const { user, accessToken, refreshToken, expiresIn } = response.data;

    const tokens: AuthTokens = {
      accessToken,
      refreshToken,
      expiresIn,
    };

    await apiService.setTokens(tokens);
    await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

    return { user, tokens };
  }

  async register(data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, data);
    const { user, accessToken, refreshToken, expiresIn } = response.data;

    const tokens: AuthTokens = {
      accessToken,
      refreshToken,
      expiresIn,
    };

    await apiService.setTokens(tokens);
    await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

    return { user, tokens };
  }

  async logout(): Promise<void> {
    try {
      await api.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.BIOMETRIC_ENABLED);
    }
  }

  async getStoredUser(): Promise<User | null> {
    try {
      const userData = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting stored user:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await apiService.getAccessToken();
    return !!token;
  }

  // Biometria
  async isBiometricAvailable(): Promise<boolean> {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  }

  async authenticateWithBiometric(): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autentique-se para acessar',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  }

  async enableBiometric(): Promise<void> {
    await SecureStore.setItemAsync(STORAGE_KEYS.BIOMETRIC_ENABLED, 'true');
  }

  async isBiometricEnabled(): Promise<boolean> {
    const enabled = await SecureStore.getItemAsync(STORAGE_KEYS.BIOMETRIC_ENABLED);
    return enabled === 'true';
  }

  async verify2FA(code: string): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await api.post(API_ENDPOINTS.AUTH.VERIFY_2FA, { code });
    const { user, accessToken, refreshToken, expiresIn } = response.data;

    const tokens: AuthTokens = {
      accessToken,
      refreshToken,
      expiresIn,
    };

    await apiService.setTokens(tokens);
    await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

    return { user, tokens };
  }
}

export const authService = new AuthService();
