"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingButton } from '@/components/ui/loading-button'
import { Alert, AlertDescription, AlertIcon } from '@/components/ui/alert'
import { authApi, handleAuthError } from '@/lib/auth-api'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isResending, setIsResending] = useState(false)

  const token = searchParams.get('token')
  const email = searchParams.get('email')

  useEffect(() => {
    if (!token) {
      setError('Token de verificação não encontrado')
      setIsLoading(false)
      return
    }

    verifyEmail(token)
  }, [token])

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await authApi.verifyEmail(verificationToken)
      
      if (response.success) {
        setSuccess(true)
        
        // Redirect to login after success
        setTimeout(() => {
          router.push('/login?message=Email verificado com sucesso! Você já pode fazer login.')
        }, 3000)
      }
    } catch (err) {
      const authError = handleAuthError(err)
      setError(authError.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!email) {
      setError('Email não encontrado. Tente fazer login novamente.')
      return
    }

    setIsResending(true)
    setError(null)

    try {
      const response = await authApi.resendVerification(email)
      
      if (response.success) {
        setError(null)
        // Show success message
        alert('Email de verificação reenviado com sucesso!')
      }
    } catch (err) {
      const authError = handleAuthError(err)
      setError(authError.message)
    } finally {
      setIsResending(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
          </div>
          <CardTitle className="text-2xl">Verificando Email</CardTitle>
          <CardDescription>
            Aguarde enquanto verificamos seu email...
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Success state
  if (success) {
    return (
      <Card>
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Email Verificado</CardTitle>
          <CardDescription>
            Seu email foi verificado com sucesso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="success">
            <AlertIcon variant="success" />
            <AlertDescription>
              Parabéns! Seu email foi verificado com sucesso. Você já pode fazer login na plataforma.
            </AlertDescription>
          </Alert>

          <Link
            href="/login"
            className="block w-full text-center bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
          >
            Fazer Login
          </Link>
        </CardContent>
      </Card>
    )
  }

  // Error state
  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <XCircle className="h-6 w-6 text-red-600" />
        </div>
        <CardTitle className="text-2xl">Erro na Verificação</CardTitle>
        <CardDescription>
          Não foi possível verificar seu email
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertIcon variant="destructive" />
          <AlertDescription>
            {error || 'O link de verificação é inválido ou expirou.'}
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="text-center text-sm text-gray-600">
            <p>O que você pode fazer:</p>
            <ul className="mt-2 space-y-1">
              <li>• Verifique se o link está completo</li>
              <li>• Tente abrir o link em uma nova aba</li>
              <li>• Solicite um novo email de verificação</li>
            </ul>
          </div>

          {email && (
            <LoadingButton
              onClick={handleResendVerification}
              variant="outline"
              className="w-full"
              loading={isResending}
              loadingText="Reenviando..."
            >
              <Mail className="h-4 w-4 mr-2" />
              Reenviar Email de Verificação
            </LoadingButton>
          )}

          <div className="space-y-2">
            <Link
              href="/register"
              className="block w-full text-center bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
            >
              Criar Nova Conta
            </Link>
            
            <Link
              href="/login"
              className="block w-full text-center text-green-600 hover:underline"
            >
              Voltar para o Login
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}