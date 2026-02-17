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
      <Card className="shadow-2xl border border-white/10 backdrop-blur-xl bg-white/[0.07]">
        <CardHeader className="space-y-1 pb-6 pt-8">
          <CardTitle className="text-xl text-center text-white font-bold">Autenticação de Dois Fatores</CardTitle>
          <CardDescription className="text-center text-slate-400">
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
    <Card className="shadow-2xl border border-white/10 backdrop-blur-xl bg-white/[0.07] overflow-hidden">
      <CardHeader className="space-y-1 pb-6 pt-8">
        <CardTitle className="text-xl text-center text-white font-bold tracking-tight">
          Entrar
        </CardTitle>
        <CardDescription className="text-center text-slate-400">
          Use seu email ou continue com uma rede social
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pb-8">
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
                  <FormLabel className="flex items-center gap-2 text-slate-300 font-medium">
                    <Mail className="h-4 w-4 text-slate-400" />
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      autoComplete="email"
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50 h-12 rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-slate-300 font-medium">
                    <Lock className="h-4 w-4 text-slate-400" />
                    Senha
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50 h-12 rounded-xl pr-12"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-slate-400 hover:text-slate-300"
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
                  <FormMessage className="text-red-400" />
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
                        className="border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal text-slate-400">
                        Lembrar de mim
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <Link
                href="/forgot-password"
                className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
              >
                Esqueceu a senha?
              </Link>
            </div>

            <LoadingButton
              type="submit"
              className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/30 transition-all duration-200"
              loading={isLoading}
              loadingText="Entrando..."
            >
              Entrar
            </LoadingButton>
          </form>
        </Form>

        <div className="text-center pt-2">
          <span className="text-sm text-slate-400">Não tem uma conta? </span>
          <Link href="/register" className="text-sm text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
            Cadastre-se
          </Link>
        </div>

        <div className="relative py-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-transparent px-4 text-xs uppercase tracking-wider text-slate-500 font-medium">Ou continue com</span>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <OAuthButton provider="google" disabled={isLoading} variant="light" />
          <OAuthButton provider="apple" disabled={isLoading} variant="dark" />
          <OAuthButton provider="facebook" disabled={isLoading} variant="light" />
        </div>
      </CardContent>
    </Card>
  )
}