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
      // Try to get token from localStorage first (our custom auth)
      if (typeof window !== 'undefined') {
        const accessToken = localStorage.getItem('accessToken')
        if (accessToken) {
          if (!config.headers) {
            config.headers = {}
          }
          config.headers.Authorization = `Bearer ${accessToken}`
          console.log('[API Request] Token adicionado do localStorage:', accessToken.substring(0, 20) + '...')
        } else {
          // Fallback to NextAuth session
          const session = await getSession()
          if (session?.accessToken) {
            if (!config.headers) {
              config.headers = {}
            }
            config.headers.Authorization = `Bearer ${session.accessToken}`
            console.log('[API Request] Token adicionado do NextAuth session')
          } else {
            console.log('[API Request] Nenhum token encontrado')
          }
        }
      }
    } catch (error) {
      console.error('[API Request] Erro ao obter token:', error)
    }
    return config
  },
  (error) => {
    console.error('[API Request] Erro no interceptor de requisição:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('[API Response] Sucesso:', response.config.url, response.status)
    return response
  },
  async (error) => {
    const status = error.response?.status
    const url = error.config?.url
    const message = error.response?.data?.message || error.message
    
    console.error('[API Response] Erro detalhado:', {
      url,
      status,
      message,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
      requestUrl: error.config?.url,
      requestMethod: error.config?.method,
      requestHeaders: error.config?.headers
    })
    
    // Only redirect on 401 (Unauthorized), not on 403 or 500
    if (status === 401) {
      console.error('[API Response] ⚠️ ERRO 401 - Não autorizado. Redirecionando para login...')
      console.error('[API Response] Detalhes completos do erro 401:', {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        responseData: error.response?.data,
        currentPath: typeof window !== 'undefined' ? window.location.pathname : 'N/A'
      })
      
      // Handle unauthorized access - redirect to login
      if (typeof window !== 'undefined') {
        console.log('[API Response] Limpando tokens e redirecionando...')
        // Clear tokens from localStorage
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        console.log('[API Response] Tokens removidos do localStorage')
        
        // Try NextAuth signOut as fallback
        try {
          const { signOut } = await import('next-auth/react')
          console.log('[API Response] Fazendo signOut do NextAuth...')
          await signOut({ callbackUrl: '/login' })
        } catch (signOutError) {
          console.error('[API Response] Erro ao fazer signOut do NextAuth:', signOutError)
          // Fallback to direct redirect
          console.log('[API Response] Redirecionando diretamente para /login')
          window.location.href = '/login'
        }
      }
    } else {
      console.log(`[API Response] Status ${status} - NÃO redirecionando (só redireciona em 401)`)
    }
    
    return Promise.reject(error)
  }
)

export const api = apiClient
export default apiClient