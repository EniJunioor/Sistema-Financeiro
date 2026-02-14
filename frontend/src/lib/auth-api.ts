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
    const response = await apiClient.post<any>('/auth/login', {
      email: data.email,
      password: data.password,
    })
    // Transform backend response format to frontend format
    const backendResponse = response.data
    return {
      success: true,
      user: backendResponse.user,
      tokens: {
        accessToken: backendResponse.access_token,
        refreshToken: backendResponse.refresh_token || '',
      },
    }
  },

  // Register new user - backend retorna { access_token, refresh_token, user }
  async register(data: RegisterFormData): Promise<AuthResponse> {
    const response = await apiClient.post<any>('/auth/register', {
      name: data.name,
      email: data.email,
      password: data.password,
    })
    const d = response.data
    return {
      success: true,
      user: d.user,
      tokens: {
        accessToken: d.access_token,
        refreshToken: d.refresh_token || '',
      },
    }
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

  // Setup 2FA - Step 1: get TOTP QR (backend: generate-totp)
  async getTOTPSetup(): Promise<{ qrCodeUrl: string; secret: string }> {
    const response = await apiClient.post<{ secret: string; qrCodeUrl: string }>('/auth/2fa/generate-totp')
    return response.data
  },

  // Setup 2FA - Step 2: enable TOTP com código (backend: enable-totp)
  async enableTOTP(code: string): Promise<{ backupCodes: string[] }> {
    const response = await apiClient.post<{ backupCodes: string[] }>('/auth/2fa/enable-totp', {
      token: code,
      method: 'totp',
    })
    return response.data
  },

  // setupTwoFactor - para TOTP chama getTOTPSetup
  async setupTwoFactor(data: TwoFactorSetupFormData): Promise<TwoFactorSetupResponse> {
    if (data.method === 'totp') {
      const { qrCodeUrl } = await this.getTOTPSetup()
      return { success: true, qrCode: qrCodeUrl }
    }
    throw new Error('Apenas TOTP é suportado no momento.')
  },

  // Verificar 2FA durante LOGIN - reenvia login com twoFactorToken
  async verifyTwoFactorForLogin(
    credentials: { email: string; password: string },
    data: TwoFactorVerifyFormData,
  ): Promise<AuthResponse> {
    const token = data.code || data.backupCode || ''
    const response = await apiClient.post<any>('/auth/login', {
      email: credentials.email,
      password: credentials.password,
      twoFactorToken: token,
    })
    const backendResponse = response.data
    return {
      success: true,
      user: backendResponse.user,
      tokens: {
        accessToken: backendResponse.access_token,
        refreshToken: backendResponse.refresh_token || '',
      },
    }
  },

  // Verificar 2FA durante setup - chama enable-totp
  async verifyTwoFactorForSetup(code: string): Promise<{ success: boolean; backupCodes?: string[] }> {
    const { backupCodes } = await this.enableTOTP(code)
    return { success: true, backupCodes }
  },

  // Alias para login flow
  async verifyTwoFactor(
    data: TwoFactorVerifyFormData,
    loginCredentials?: { email: string; password: string },
  ): Promise<AuthResponse> {
    if (loginCredentials) {
      return this.verifyTwoFactorForLogin(loginCredentials, data)
    }
    throw new Error('Credenciais de login necessárias para verificar 2FA')
  },

  // Disable 2FA - backend exige { password, token }
  async disableTwoFactor(password: string, token: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/2fa/disable', { password, token })
    return { success: true, message: response.data.message || '2FA desabilitado' }
  },

  // Backup codes - obtidos ao habilitar ou regenerar
  async getBackupCodes(): Promise<{ success: boolean; backupCodes: string[] }> {
    return { success: true, backupCodes: [] }
  },

  // Regenerar códigos de backup
  async regenerateBackupCodes(password: string): Promise<{ success: boolean; backupCodes: string[] }> {
    const response = await apiClient.post<{ backupCodes: string[] }>('/auth/2fa/regenerate-backup-codes', {
      password,
    })
    return { success: true, backupCodes: response.data?.backupCodes ?? [] }
  },

  // Logout - envia refreshToken do localStorage para invalidar no backend
  async logout(): Promise<{ success: boolean }> {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null
    const response = await apiClient.post<{ message?: string }>('/auth/logout', {
      refreshToken: refreshToken || '',
    })
    return { success: true }
  },

  // Refresh token
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/refresh', { refreshToken })
    return response.data
  },

  // Get current user profile - backend retorna { message, user }
  async getProfile(): Promise<AuthResponse['user']> {
    const response = await apiClient.get<{ message: string; user: AuthResponse['user'] }>('/profile')
    return response.data.user
  },
}

// OAuth provider URLs - backend usa api/v1/auth/google (sem /oauth no path)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
export const oauthUrls = {
  google: `${API_URL}/api/v1/auth/google`,
  microsoft: `${API_URL}/api/v1/auth/microsoft`,
  facebook: `${API_URL}/api/v1/auth/facebook`,
  apple: `${API_URL}/api/v1/auth/apple`,
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
  // NestJS formats errors as { statusCode, message, error }
  if (error.response?.data?.message) {
    return new AuthError(
      error.response.data.error || 'ERROR',
      error.response.data.message,
      error.response.status
    )
  }
  
  // Alternative format: { error: { code, message } }
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