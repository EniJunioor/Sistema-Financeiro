"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingButton } from '@/components/ui/loading-button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertIcon } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { OAuthButton } from '@/components/auth/oauth-button'
import { TwoFactorVerification } from '@/components/auth/two-factor-verification'
import { loginSchema, LoginFormData, twoFactorVerifySchema, TwoFactorVerifyFormData } from '@/lib/validations'
import { authApi, handleAuthError } from '@/lib/auth-api'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false)
  const [twoFactorMethods, setTwoFactorMethods] = useState<string[]>([])
  const [loginData, setLoginData] = useState<LoginFormData | null>(null)

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  const twoFactorForm = useForm<TwoFactorVerifyFormData>({
    resolver: zodResolver(twoFactorVerifySchema),
    defaultValues: {
      code: '',
    },
  })

  // Handle OAuth callback messages
  useEffect(() => {
    const message = searchParams.get('message')
    const error = searchParams.get('error')
    
    if (message) {
      setSuccess(message)
    }
    if (error) {
      setError(error)
    }
  }, [searchParams])

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      console.log('[Login] Iniciando login com email:', data.email)
      const response = await authApi.login(data)
      console.log('[Login] Resposta do login:', response)
      
      if (response.success) {
        if (response.requiresTwoFactor) {
          console.log('[Login] Requer autenticação de dois fatores')
          setRequiresTwoFactor(true)
          setTwoFactorMethods(response.twoFactorMethods || [])
          setLoginData(data)
        } else {
          // Store tokens
          if (response.tokens) {
            console.log('[Login] Salvando tokens no localStorage')
            localStorage.setItem('accessToken', response.tokens.accessToken)
            localStorage.setItem('refreshToken', response.tokens.refreshToken)
            console.log('[Login] Tokens salvos com sucesso')
            console.log('[Login] AccessToken (primeiros 20 chars):', response.tokens.accessToken.substring(0, 20))
          } else {
            console.warn('[Login] Nenhum token na resposta')
          }
          
          // Show success message before redirecting
          setSuccess('Login realizado com sucesso! Redirecionando...')
          
          // Redirect after a short delay to show success message
          const redirectTo = searchParams.get('redirect') || '/dashboard'
          console.log('[Login] Redirecionando para:', redirectTo)
          setTimeout(() => {
            console.log('[Login] Executando redirecionamento para:', redirectTo)
            router.push(redirectTo)
          }, 1500)
        }
      } else {
        console.warn('[Login] Login não foi bem-sucedido:', response)
      }
    } catch (err) {
      console.error('[Login] Erro no login:', err)
      const authError = handleAuthError(err)
      const msg = authError.message?.toLowerCase() || ''
      if (authError.statusCode === 401 && (msg.includes('dois fatores') || msg.includes('2fa'))) {
        setRequiresTwoFactor(true)
        setTwoFactorMethods(['totp'])
        setLoginData(data)
        setError(null)
      } else {
        setError(authError.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const onTwoFactorSubmit = async (data: TwoFactorVerifyFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      if (!loginData) {
        setError('Erro: dados de login não encontrados')
        return
      }
      const response = await authApi.verifyTwoFactorForLogin(loginData, data)
      
      if (response.success) {
        // Store tokens and redirect
        if (response.tokens) {
          localStorage.setItem('accessToken', response.tokens.accessToken)
          localStorage.setItem('refreshToken', response.tokens.refreshToken)
        }
        
        const redirectTo = searchParams.get('redirect') || '/dashboard'
        router.push(redirectTo)
      }
    } catch (err) {
      const authError = handleAuthError(err)
      setError(authError.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    setRequiresTwoFactor(false)
    setTwoFactorMethods([])
    setLoginData(null)
    twoFactorForm.reset()
  }

  if (requiresTwoFactor) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Autenticação de Dois Fatores</CardTitle>
          <CardDescription className="text-center">
            Digite o código de verificação para completar o login
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TwoFactorVerification
            methods={twoFactorMethods}
            onSubmit={onTwoFactorSubmit}
            onBack={handleBackToLogin}
            isLoading={isLoading}
            error={error}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-2xl text-center bg-gradient-to-r from-blue-700 to-emerald-600 bg-clip-text text-transparent font-bold">
          Entrar
        </CardTitle>
        <CardDescription className="text-center text-gray-600">
          Entre com sua conta para acessar a plataforma
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && (
          <Alert variant="destructive">
            <AlertIcon variant="destructive" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="success">
            <AlertIcon variant="success" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Senha
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between">
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal">
                        Lembrar de mim
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors font-medium"
              >
                Esqueceu a senha?
              </Link>
            </div>

            <LoadingButton
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
              loading={isLoading}
              loadingText="Entrando..."
            >
              Entrar
            </LoadingButton>
          </form>
        </Form>

        <div className="text-center pt-2">
          <Link href="/register" className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline transition-colors font-medium">
            Não tem uma conta? Cadastre-se
          </Link>
        </div>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-gray-500 font-medium">Ou continue com</span>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <OAuthButton provider="google" disabled={isLoading} />
          <OAuthButton provider="facebook" disabled={isLoading} />
          <OAuthButton provider="apple" disabled={isLoading} />
        </div>
      </CardContent>
    </Card>
  )
}