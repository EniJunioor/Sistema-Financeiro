import axios from 'axios'
import { getSession } from 'next-auth/react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config: any) => {
    try {
      const session = await getSession()
      if (session?.accessToken) {
        if (!config.headers) {
          config.headers = {}
        }
        config.headers.Authorization = `Bearer ${session.accessToken}`
      }
    } catch (error) {
      console.warn('Failed to get session for API request:', error)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access - redirect to login
      if (typeof window !== 'undefined') {
        const { signOut } = await import('next-auth/react')
        await signOut({ callbackUrl: '/login' })
      }
    }
    return Promise.reject(error)
  }
)

export const api = apiClient
export default apiClient