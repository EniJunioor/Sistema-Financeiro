import { apiClient } from './api';

export interface UserPreferences {
  language: string;
  currency: string;
  theme: string;
  timezone: string;
  dateFormat: string;
  notifications: Record<string, boolean>;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
  emailVerified?: string | null;
  twoFactorEnabled: boolean;
  smsPhone?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  bio?: string | null;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileData {
  name?: string;
  avatar?: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  bio?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface ActiveSession {
  id: string;
  deviceInfo?: string | null;
  ipAddress?: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface SecurityEvent {
  id: string;
  ipAddress: string;
  userAgent?: string | null;
  success: boolean;
  failureReason?: string | null;
  createdAt: string;
}

export class ProfileAPI {
  static async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<{ user: UserProfile }>('/profile');
    return response.data.user;
  }

  static async updateProfile(data: UpdateProfileData): Promise<UserProfile> {
    const response = await apiClient.patch<{ user: UserProfile }>('/profile', data);
    return response.data.user;
  }

  static async getPreferences(): Promise<UserPreferences> {
    const response = await apiClient.get<UserPreferences>('/profile/preferences');
    return response.data;
  }

  static async updatePreferences(data: Partial<UserPreferences>): Promise<UserPreferences> {
    const response = await apiClient.patch<UserPreferences>('/profile/preferences', data);
    return response.data;
  }

  static async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/profile/change-password', data);
    return response.data;
  }

  static async getSessions(): Promise<ActiveSession[]> {
    const response = await apiClient.get<ActiveSession[]>('/profile/sessions');
    return response.data;
  }

  static async revokeSession(sessionId: string): Promise<void> {
    await apiClient.delete(`/profile/sessions/${sessionId}`);
  }

  static async revokeAllSessions(): Promise<void> {
    await apiClient.delete('/profile/sessions');
  }

  static async getSecurityEvents(): Promise<SecurityEvent[]> {
    const response = await apiClient.get<SecurityEvent[]>('/profile/security-events');
    return response.data;
  }
}

export default ProfileAPI;
