'use client'

import React from 'react'
import { CreditCard } from 'lucide-react'
import { getBankConfig } from '@/lib/bank-colors'
import type { Account } from '@/types/transaction'

interface WalletCreditCardProps {
  account: Account
}

export function WalletCreditCard({ account }: WalletCreditCardProps) {
  const bankConfig = getBankConfig(account.name)
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: account.currency || 'BRL',
    }).format(value)
  }

  // Extrair últimos 4 dígitos do account ID ou providerAccountId
  const lastDigits = account.providerAccountId?.slice(-4) || account.id.slice(-4) || '0000'
  
  // Para cartões de crédito, o balance negativo representa a fatura atual
  // e precisamos calcular o limite disponível (precisa de dados adicionais que não temos)
  // Por enquanto, vamos usar valores mockados ou do balance
  const currentBill = Math.abs(Number(account.balance))
  const creditLimit = currentBill * 3 // Mock - assumindo limite 3x a fatura
  const availableLimit = creditLimit - currentBill

  return (
    <div
      className="relative rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
      style={{
        background: bankConfig.gradient || `linear-gradient(135deg, ${bankConfig.primaryColor} 0%, ${bankConfig.secondaryColor || bankConfig.primaryColor} 100%)`,
        width: '100%',
        aspectRatio: '1.6', // Proporção de cartão de crédito
      }}
    >
      {/* Padrão de fundo sutil */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12" />
      </div>

      <div className="relative p-6 h-full flex flex-col justify-between text-white">
        {/* Topo do cartão */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="font-semibold text-lg">{bankConfig.name}</span>
          </div>
          
          {/* Logo da bandeira - usando ícone genérico por enquanto */}
          <div className="w-12 h-8 bg-white/20 rounded flex items-center justify-center">
            <span className="text-xs font-bold">CC</span>
          </div>
        </div>

        {/* Número do cartão */}
        <div className="mt-4">
          <div className="text-xs text-white/70 mb-1">Número do Cartão</div>
          <div className="text-xl font-mono tracking-wider">**** {lastDigits}</div>
        </div>

        {/* Informações do cartão */}
        <div className="mt-auto space-y-3">
          <div>
            <div className="text-xs text-white/70">Fatura atual</div>
            <div className="text-2xl font-bold">{formatCurrency(currentBill)}</div>
          </div>
          
          <div className="flex justify-between text-sm">
            <div>
              <div className="text-white/70">Limite disponível</div>
              <div className="font-semibold">{formatCurrency(availableLimit)}</div>
            </div>
            <div>
              <div className="text-white/70">Vencimento</div>
              <div className="font-semibold">15/02/2025</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
