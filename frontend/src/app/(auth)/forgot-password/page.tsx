"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { forgotPasswordSchema, ForgotPasswordFormData } from '@/lib/validations'
import { authApi, handleAuthError } from '@/lib/auth-api'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState('')

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await authApi.forgotPassword(data)
      
      if (response.success) {
        setSuccess(true)
        setEmail(data.email)
      }
    } catch (err) {
      const authError = handleAuthError(err)
      setError(authError.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendEmail = async () => {
    if (!email) return

    setIsLoading(true)
    setError(null)

    try {
      await authApi.forgotPassword({ email })
    } catch (err) {
      const authError = handleAuthError(err)
      setError(authError.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <Card>
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Email Enviado</CardTitle>
          <CardDescription>
            Enviamos um link de recuperação para seu email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="success">
            <AlertIcon variant="success" />
            <AlertDescription>
              Se o email <strong>{email}</strong> estiver cadastrado em nossa plataforma, 
              você receberá um link para redefinir sua senha em alguns minutos.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertIcon variant="destructive" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="text-center text-sm text-gray-600">
              <p>Não recebeu o email?</p>
              <ul className="mt-2 space-y-1">
                <li>• Verifique sua caixa de spam</li>
                <li>• Aguarde alguns minutos</li>
                <li>• Certifique-se de que o email está correto</li>
              </ul>
            </div>

            <LoadingButton
              onClick={handleResendEmail}
              variant="outline"
              className="w-full"
              loading={isLoading}
              loadingText="Reenviando..."
            >
              Reenviar Email
            </LoadingButton>

            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex items-center text-sm text-green-600 hover:underline"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar para o login
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Esqueceu a Senha?</CardTitle>
        <CardDescription className="text-center">
          Digite seu email para receber um link de recuperação
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
                  <FormDescription>
                    Digite o email associado à sua conta
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <LoadingButton
              type="submit"
              className="w-full"
              loading={isLoading}
              loadingText="Enviando..."
            >
              Enviar Link de Recuperação
            </LoadingButton>
          </form>
        </Form>

        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-green-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar para o login
          </Link>
        </div>

        <div className="text-center">
          <Link href="/register" className="text-sm text-gray-600 hover:underline">
            Não tem uma conta? Cadastre-se
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}