import apiClient from './api'
import {
  LoginFormData,
  RegisterFormData,
  ForgotPasswordFormData,
  ResetPasswordFormData,
  TwoFactorSetupFormData,
  TwoFactorVerifyFormData,
} from './validations'

export interface AuthResponse {
  success: boolean
  user?: {
    id: string
    email: string
    name: string
    emailVerified: boolean
    twoFactorEnabled: boolean
  }
  tokens?: {
    accessToken: string
    refreshToken: string
  }
  message?: string
  requiresTwoFactor?: boolean
  twoFactorMethods?: string[]
}

export interface TwoFactorSetupResponse {
  success: boolean
  qrCode?: string // For TOTP setup
  backupCodes?: string[]
  message?: string
}

// Authentication API functions
export const authApi = {
  // Login with email and password
  async login(data: LoginFormData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data)
    return response.data
  },

  // Register new user
  async register(data: RegisterFormData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', {
      name: data.name,
      email: data.email,
      password: data.password,
    })
    return response.data
  },

  // Forgot password - send reset email
  async forgotPassword(data: ForgotPasswordFormData): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>('/auth/forgot-password', data)
    return response.data
  },

  // Reset password with token
  async resetPassword(data: ResetPasswordFormData): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>('/auth/reset-password', data)
    return response.data
  },

  // Verify email with token
  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>('/auth/verify-email', { token })
    return response.data
  },

  // Resend verification email
  async resendVerification(email: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>('/auth/resend-verification', { email })
    return response.data
  },

  // Setup 2FA
  async setupTwoFactor(data: TwoFactorSetupFormData): Promise<TwoFactorSetupResponse> {
    const response = await apiClient.post<TwoFactorSetupResponse>('/auth/2fa/setup', data)
    return response.data
  },

  // Verify 2FA during login
  async verifyTwoFactor(data: TwoFactorVerifyFormData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/2fa/verify', data)
    return response.data
  },

  // Disable 2FA
  async disableTwoFactor(password: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>('/auth/2fa/disable', { password })
    return response.data
  },

  // Get 2FA backup codes
  async getBackupCodes(): Promise<{ success: boolean; backupCodes: string[] }> {
    const response = await apiClient.get<{ success: boolean; backupCodes: string[] }>('/auth/2fa/backup-codes')
    return response.data
  },

  // Regenerate 2FA backup codes
  async regenerateBackupCodes(): Promise<{ success: boolean; backupCodes: string[] }> {
    const response = await apiClient.post<{ success: boolean; backupCodes: string[] }>('/auth/2fa/backup-codes/regenerate')
    return response.data
  },

  // Logout
  async logout(): Promise<{ success: boolean }> {
    const response = await apiClient.post<{ success: boolean }>('/auth/logout')
    return response.data
  },

  // Refresh token
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/refresh', { refreshToken })
    return response.data
  },

  // Get current user profile
  async getProfile(): Promise<AuthResponse['user']> {
    const response = await apiClient.get<AuthResponse['user']>('/auth/profile')
    return response.data
  },
}

// OAuth provider URLs - these will redirect to backend OAuth endpoints
export const oauthUrls = {
  google: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/oauth/google`,
  microsoft: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/oauth/microsoft`,
  facebook: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/oauth/facebook`,
  apple: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/oauth/apple`,
}

// Error handling for auth API calls
export class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

// Helper function to handle auth API errors
export function handleAuthError(error: any): AuthError {
  if (error.response?.data?.error) {
    return new AuthError(
      error.response.data.error.code || 'UNKNOWN_ERROR',
      error.response.data.error.message || 'An error occurred',
      error.response.status
    )
  }
  
  return new AuthError(
    'NETWORK_ERROR',
    'Network error occurred. Please try again.',
    error.response?.status
  )
}