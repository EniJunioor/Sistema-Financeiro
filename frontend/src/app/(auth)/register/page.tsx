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
  FormDescription,
} from '@/components/ui/form'
import { OAuthButton } from '@/components/auth/oauth-button'
import { registerSchema, RegisterFormData } from '@/lib/validations'
import { authApi, handleAuthError } from '@/lib/auth-api'
import { Eye, EyeOff, User, Mail, Lock, Shield } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
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

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await authApi.register(data)
      
      if (response.success) {
        setSuccess('Conta criada com sucesso! Verifique seu email para ativar sua conta.')
        
        // Optionally redirect to login after a delay
        setTimeout(() => {
          router.push('/login?message=Conta criada com sucesso! Verifique seu email.')
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

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Criar Conta</CardTitle>
        <CardDescription className="text-center">
          Crie sua conta para começar a usar a plataforma
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nome Completo
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Seu nome completo"
                      autoComplete="name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          autoComplete="new-password"
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
                    Confirmar Senha
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
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

            <FormField
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm">
                      Aceito os{' '}
                      <Link href="/terms" className="text-green-600 hover:underline">
                        termos de uso
                      </Link>{' '}
                      e{' '}
                      <Link href="/privacy" className="text-green-600 hover:underline">
                        política de privacidade
                      </Link>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <LoadingButton
              type="submit"
              className="w-full"
              loading={isLoading}
              loadingText="Criando conta..."
              disabled={!form.formState.isValid}
            >
              <Shield className="h-4 w-4 mr-2" />
              Criar Conta
            </LoadingButton>
          </form>
        </Form>

        <div className="text-center">
          <Link href="/login" className="text-sm text-green-600 hover:underline">
            Já tem uma conta? Entre aqui
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