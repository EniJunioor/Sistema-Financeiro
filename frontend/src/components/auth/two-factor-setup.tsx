"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { Alert, AlertDescription, AlertIcon } from "@/components/ui/alert"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { twoFactorSetupSchema, TwoFactorSetupFormData } from "@/lib/validations"
import { authApi, handleAuthError } from "@/lib/auth-api"
import { Smartphone, Mail, Shield, Copy, Check } from "lucide-react"

interface TwoFactorSetupProps {
  onComplete: () => void
  onCancel: () => void
}

export function TwoFactorSetup({ onComplete, onCancel }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'method' | 'verify' | 'backup'>('method')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [copiedCodes, setCopiedCodes] = useState(false)

  const form = useForm<TwoFactorSetupFormData>({
    resolver: zodResolver(twoFactorSetupSchema),
    defaultValues: {
      method: 'totp',
    },
  })

  const selectedMethod = form.watch('method')

  const onSubmit = async (data: TwoFactorSetupFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await authApi.setupTwoFactor(data)
      
      if (response.success) {
        if (data.method === 'totp' && response.qrCode) {
          setQrCode(response.qrCode)
        }
        if (response.backupCodes) {
          setBackupCodes(response.backupCodes)
        }
        setStep('verify')
      }
    } catch (err) {
      const authError = handleAuthError(err)
      setError(authError.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerificationComplete = () => {
    if (backupCodes.length > 0) {
      setStep('backup')
    } else {
      onComplete()
    }
  }

  const handleBackupCodesAcknowledged = () => {
    onComplete()
  }

  const copyBackupCodes = async () => {
    try {
      await navigator.clipboard.writeText(backupCodes.join('\n'))
      setCopiedCodes(true)
      setTimeout(() => setCopiedCodes(false), 2000)
    } catch (err) {
      console.error('Failed to copy backup codes:', err)
    }
  }

  if (step === 'verify') {
    return (
      <TwoFactorVerification
        method={selectedMethod}
        qrCode={qrCode}
        onComplete={(codes) => {
          if (codes?.length) {
            setBackupCodes(codes)
            setStep('backup')
          } else {
            onComplete()
          }
        }}
        onBack={() => setStep('method')}
      />
    )
  }

  if (step === 'backup') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Códigos de Backup
          </CardTitle>
          <CardDescription>
            Guarde estes códigos em um local seguro. Você pode usá-los para acessar sua conta se perder acesso ao seu método de autenticação principal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="warning">
            <AlertIcon variant="warning" />
            <AlertDescription>
              Estes códigos só serão mostrados uma vez. Certifique-se de salvá-los em um local seguro.
            </AlertDescription>
          </Alert>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <Label className="text-sm font-medium">Códigos de Backup</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={copyBackupCodes}
                className="h-8"
              >
                {copiedCodes ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {backupCodes.map((code, index) => (
                <div key={index} className="bg-white p-2 rounded border">
                  {code}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleBackupCodesAcknowledged} className="flex-1">
              Salvei os Códigos
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Configurar Autenticação de Dois Fatores
        </CardTitle>
        <CardDescription>
          Adicione uma camada extra de segurança à sua conta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertIcon variant="destructive" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de Autenticação</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-1 gap-4"
                    >
                      <div className="flex items-center space-x-3 border rounded-lg p-4">
                        <RadioGroupItem value="totp" id="totp" />
                        <div className="flex items-center gap-3 flex-1">
                          <Smartphone className="h-5 w-5 text-gray-500" />
                          <div>
                            <Label htmlFor="totp" className="font-medium">
                              App Autenticador (Recomendado)
                            </Label>
                            <p className="text-sm text-gray-500">
                              Use Google Authenticator, Authy ou similar
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 border rounded-lg p-4">
                        <RadioGroupItem value="sms" id="sms" />
                        <div className="flex items-center gap-3 flex-1">
                          <Smartphone className="h-5 w-5 text-gray-500" />
                          <div>
                            <Label htmlFor="sms" className="font-medium">
                              SMS
                            </Label>
                            <p className="text-sm text-gray-500">
                              Receba códigos por mensagem de texto
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 border rounded-lg p-4">
                        <RadioGroupItem value="email" id="email" />
                        <div className="flex items-center gap-3 flex-1">
                          <Mail className="h-5 w-5 text-gray-500" />
                          <div>
                            <Label htmlFor="email" className="font-medium">
                              Email
                            </Label>
                            <p className="text-sm text-gray-500">
                              Receba códigos por email
                            </p>
                          </div>
                        </div>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedMethod === 'sms' && (
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Telefone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+55 (11) 99999-9999"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Digite seu número de telefone com código do país
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancelar
              </Button>
              <LoadingButton
                type="submit"
                loading={isLoading}
                loadingText="Configurando..."
                className="flex-1"
              >
                Continuar
              </LoadingButton>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

// Two Factor Verification Component
interface TwoFactorVerificationProps {
  method: 'totp' | 'sms' | 'email'
  qrCode?: string | null
  onComplete: (backupCodes?: string[]) => void
  onBack: () => void
}

function TwoFactorVerification({ method, qrCode, onComplete, onBack }: TwoFactorVerificationProps) {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Código deve ter 6 dígitos')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await authApi.verifyTwoFactorForSetup(code)
      
      if (response.success) {
        onComplete(response.backupCodes)
      }
    } catch (err) {
      const authError = handleAuthError(err)
      setError(authError.message)
    } finally {
      setIsLoading(false)
    }
  }

  const getInstructions = () => {
    switch (method) {
      case 'totp':
        return 'Escaneie o QR code com seu app autenticador e digite o código de 6 dígitos'
      case 'sms':
        return 'Digite o código de 6 dígitos enviado por SMS'
      case 'email':
        return 'Digite o código de 6 dígitos enviado por email'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verificar Configuração</CardTitle>
        <CardDescription>{getInstructions()}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertIcon variant="destructive" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {method === 'totp' && qrCode && (
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg border">
              <img src={qrCode} alt="QR Code para configuração 2FA" className="w-48 h-48" />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="verification-code">Código de Verificação</Label>
          <Input
            id="verification-code"
            type="text"
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="text-center text-lg tracking-widest"
            maxLength={6}
          />
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            Voltar
          </Button>
          <LoadingButton
            onClick={handleVerify}
            loading={isLoading}
            loadingText="Verificando..."
            className="flex-1"
            disabled={code.length !== 6}
          >
            Verificar
          </LoadingButton>
        </div>
      </CardContent>
    </Card>
  )
}