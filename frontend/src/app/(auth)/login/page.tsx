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
      const response = await authApi.login(data)
      
      if (response.success) {
        if (response.requiresTwoFactor) {
          setRequiresTwoFactor(true)
          setTwoFactorMethods(response.twoFactorMethods || [])
          setLoginData(data)
        } else {
          // Store tokens and redirect
          if (response.tokens) {
            localStorage.setItem('accessToken', response.tokens.accessToken)
            localStorage.setItem('refreshToken', response.tokens.refreshToken)
          }
          
          const redirectTo = searchParams.get('redirect') || '/dashboard'
          router.push(redirectTo)
        }
      }
    } catch (err) {
      const authError = handleAuthError(err)
      setError(authError.message)
    } finally {
      setIsLoading(false)
    }
  }

  const onTwoFactorSubmit = async (data: TwoFactorVerifyFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await authApi.verifyTwoFactor(data)
      
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
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Entrar</CardTitle>
        <CardDescription className="text-center">
          Entre com sua conta para acessar a plataforma
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
                className="text-sm text-green-600 hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>

            <LoadingButton
              type="submit"
              className="w-full"
              loading={isLoading}
              loadingText="Entrando..."
            >
              Entrar
            </LoadingButton>
          </form>
        </Form>

        <div className="text-center">
          <Link href="/register" className="text-sm text-green-600 hover:underline">
            Não tem uma conta? Cadastre-se
          </Link>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">Ou continue com</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <OAuthButton provider="google" disabled={isLoading}>
            Google
          </OAuthButton>
          <OAuthButton provider="microsoft" disabled={isLoading}>
            Microsoft
          </OAuthButton>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <OAuthButton provider="facebook" disabled={isLoading}>
            Facebook
          </OAuthButton>
          <OAuthButton provider="apple" disabled={isLoading}>
            Apple
          </OAuthButton>
        </div>
      </CardContent>
    </Card>
  )
}