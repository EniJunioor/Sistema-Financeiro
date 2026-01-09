"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertIcon } from '@/components/ui/alert'
import { TwoFactorSetup } from '@/components/auth/two-factor-setup'
import { Shield, ArrowLeft, CheckCircle } from 'lucide-react'

export default function Setup2FAPage() {
  const router = useRouter()
  const [isComplete, setIsComplete] = useState(false)

  const handleComplete = () => {
    setIsComplete(true)
    
    // Redirect to dashboard after a delay
    setTimeout(() => {
      router.push('/dashboard?message=Autenticação de dois fatores configurada com sucesso!')
    }, 3000)
  }

  const handleCancel = () => {
    router.push('/dashboard')
  }

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl">2FA Configurado</CardTitle>
              <CardDescription>
                Autenticação de dois fatores ativada com sucesso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="success">
                <AlertIcon variant="success" />
                <AlertDescription>
                  Sua conta agora está protegida com autenticação de dois fatores. 
                  Você será redirecionado para o dashboard.
                </AlertDescription>
              </Alert>

              <Button
                onClick={() => router.push('/dashboard')}
                className="w-full"
              >
                Ir para Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Proteja sua Conta
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Configure a autenticação de dois fatores para maior segurança
          </p>
        </div>

        <TwoFactorSetup
          onComplete={handleComplete}
          onCancel={handleCancel}
        />

        <div className="text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-gray-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Pular por agora
          </Link>
        </div>
      </div>
    </div>
  )
}