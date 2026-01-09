"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
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
import { twoFactorVerifySchema, TwoFactorVerifyFormData } from '@/lib/validations'
import { Smartphone, Mail, Shield, ArrowLeft } from 'lucide-react'

interface TwoFactorVerificationProps {
  methods: string[]
  onSubmit: (data: TwoFactorVerifyFormData) => Promise<void>
  onBack: () => void
  isLoading: boolean
  error: string | null
}

export function TwoFactorVerification({
  methods,
  onSubmit,
  onBack,
  isLoading,
  error,
}: TwoFactorVerificationProps) {
  const [useBackupCode, setUseBackupCode] = useState(false)

  const form = useForm<TwoFactorVerifyFormData>({
    resolver: zodResolver(twoFactorVerifySchema),
    defaultValues: {
      code: '',
      backupCode: '',
    },
  })

  const handleSubmit = async (data: TwoFactorVerifyFormData) => {
    await onSubmit(data)
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'totp':
        return <Smartphone className="h-4 w-4" />
      case 'sms':
        return <Smartphone className="h-4 w-4" />
      case 'email':
        return <Mail className="h-4 w-4" />
      default:
        return <Shield className="h-4 w-4" />
    }
  }

  const getMethodName = (method: string) => {
    switch (method) {
      case 'totp':
        return 'App Autenticador'
      case 'sms':
        return 'SMS'
      case 'email':
        return 'Email'
      default:
        return method
    }
  }

  const getInstructions = () => {
    if (useBackupCode) {
      return 'Digite um dos seus códigos de backup de 8 caracteres'
    }

    const primaryMethod = methods[0]
    switch (primaryMethod) {
      case 'totp':
        return 'Digite o código de 6 dígitos do seu app autenticador'
      case 'sms':
        return 'Digite o código de 6 dígitos enviado por SMS'
      case 'email':
        return 'Digite o código de 6 dígitos enviado por email'
      default:
        return 'Digite o código de verificação'
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertIcon variant="destructive" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          {methods.map((method, index) => (
            <div key={method} className="flex items-center gap-1">
              {getMethodIcon(method)}
              <span>{getMethodName(method)}</span>
              {index < methods.length - 1 && <span className="mx-2">•</span>}
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-500">{getInstructions()}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {!useBackupCode ? (
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código de Verificação</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="000000"
                      className="text-center text-lg tracking-widest"
                      maxLength={6}
                      value={field.value}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                        field.onChange(value)
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Digite o código de 6 dígitos
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <FormField
              control={form.control}
              name="backupCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código de Backup</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="XXXXXXXX"
                      className="text-center text-lg tracking-widest"
                      maxLength={8}
                      value={field.value || ''}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
                        field.onChange(value)
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Digite um dos seus códigos de backup de 8 caracteres
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="flex-1"
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <LoadingButton
              type="submit"
              className="flex-1"
              loading={isLoading}
              loadingText="Verificando..."
              disabled={
                (!useBackupCode && (!form.watch('code') || form.watch('code').length !== 6)) ||
                (useBackupCode && (!form.watch('backupCode') || (form.watch('backupCode')?.length || 0) !== 8))
              }
            >
              Verificar
            </LoadingButton>
          </div>
        </form>
      </Form>

      <div className="text-center">
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={() => {
            setUseBackupCode(!useBackupCode)
            form.reset()
          }}
          disabled={isLoading}
        >
          {useBackupCode ? 'Usar código de verificação' : 'Usar código de backup'}
        </Button>
      </div>
    </div>
  )
}