"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingButton } from '@/components/ui/loading-button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertIcon } from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { resetPasswordSchema, ResetPasswordFormData } from '@/lib/validations'
import { authApi, handleAuthError } from '@/lib/auth-api'
import { Eye, EyeOff, Lock, CheckCircle, XCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)

  const token = searchParams.get('token')

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: token || '',
      password: '',
      confirmPassword: '',
    },
  })

  // Validate token on component mount
  useEffect(() => {
    if (!token) {
      setTokenValid(false)
      setError('Token de recuperação não encontrado')
      return
    }

    // Set token in form
    form.setValue('token', token)
    setTokenValid(true)
  }, [token, form])

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await authApi.resetPassword(data)
      
      if (response.success) {
        setSuccess(true)
        
        // Redirect to login after success
        setTimeout(() => {
          router.push('/login?message=Senha redefinida com sucesso! Faça login com sua nova senha.')
        }, 3000)
      }
    } catch (err) {
      const authError = handleAuthError(err)
      setError(authError.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    let strength = 0
    const checks = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ]
    
    strength = checks.filter(Boolean).length
    
    if (strength < 3) return { level: 'weak', color: 'bg-red-500', text: 'Fraca' }
    if (strength < 4) return { level: 'medium', color: 'bg-yellow-500', text: 'Média' }
    if (strength < 5) return { level: 'good', color: 'bg-blue-500', text: 'Boa' }
    return { level: 'strong', color: 'bg-green-500', text: 'Forte' }
  }

  const password = form.watch('password')
  const passwordStrength = password ? getPasswordStrength(password) : null

  // Show error if token is invalid
  if (tokenValid === false) {
    return (
      <Card>
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Link Inválido</CardTitle>
          <CardDescription>
            O link de recuperação é inválido ou expirou
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertIcon variant="destructive" />
            <AlertDescription>
              {error || 'O link de recuperação de senha é inválido ou expirou. Solicite um novo link.'}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Link
              href="/forgot-password"
              className="block w-full text-center bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
            >
              Solicitar Novo Link
            </Link>
            
            <Link
              href="/login"
              className="block w-full text-center text-green-600 hover:underline"
            >
              Voltar para o login
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show success message
  if (success) {
    return (
      <Card>
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Senha Redefinida</CardTitle>
          <CardDescription>
            Sua senha foi redefinida com sucesso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="success">
            <AlertIcon variant="success" />
            <AlertDescription>
              Sua senha foi redefinida com sucesso! Você será redirecionado para a página de login.
            </AlertDescription>
          </Alert>

          <Link
            href="/login"
            className="block w-full text-center bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
          >
            Ir para Login
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Redefinir Senha</CardTitle>
        <CardDescription className="text-center">
          Digite sua nova senha
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertIcon variant="destructive" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Nova Senha
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          autoComplete="new-password"
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      
                      {passwordStrength && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${passwordStrength.color}`}
                                style={{ width: `${(getPasswordStrength(password).level === 'weak' ? 20 : getPasswordStrength(password).level === 'medium' ? 40 : getPasswordStrength(password).level === 'good' ? 70 : 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">{passwordStrength.text}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    A senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula, número e símbolo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Confirmar Nova Senha
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <LoadingButton
              type="submit"
              className="w-full"
              loading={isLoading}
              loadingText="Redefinindo..."
              disabled={!form.formState.isValid}
            >
              Redefinir Senha
            </LoadingButton>
          </form>
        </Form>

        <div className="text-center">
          <Link href="/login" className="text-sm text-green-600 hover:underline">
            Voltar para o login
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}