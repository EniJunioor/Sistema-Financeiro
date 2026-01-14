'use client'

import React from 'react'
import { getBankConfig } from '@/lib/bank-colors'
import { BankIcon } from './bank-icon'
import type { Account } from '@/types/transaction'

interface WalletCreditCardProps {
  account: Account
  cardholderName?: string
}

export function WalletCreditCard({ account, cardholderName = 'USUÁRIO' }: WalletCreditCardProps) {
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
  const currentBill = Math.abs(Number(account.balance))
  const creditLimit = currentBill * 3 // Mock - assumindo limite 3x a fatura
  const availableLimit = creditLimit - currentBill
  const usedPercentage = (currentBill / creditLimit) * 100

  // Determinar a cor principal do banco (usar cor mais escura/saturada para o cartão)
  const cardColor = bankConfig.primaryColor || '#820AD1'

  return (
    <div
      className="relative rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1"
      style={{
        backgroundColor: cardColor,
        opacity: 0.75
        , // Opacidade suave (opacity-5 equivalente)
        width: '100%',
        aspectRatio: '2.2', // Proporção mais compacta
        maxHeight: '180px',
      }}
    >
      {/* Textura sutil do cartão */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />
      </div>

      {/* Conteúdo do cartão */}
      <div className="relative p-4 h-full flex flex-col text-white z-10">
        {/* Topo do cartão - Ícone do banco e símbolos */}
        <div className="flex items-center justify-between mb-4">
          {/* Logo do banco */}
          <div className="w-10 h-10 flex items-center justify-center bg-white/20 rounded-lg p-1.5">
            <BankIcon 
              bankName={account.name}
              size={24}
              className="object-contain"
            />
          </div>
          
          {/* Logo Mastercard/Visa (simplificado) */}
          <div className="flex items-center">
            <div 
              className="w-6 h-6 rounded-full border-2 border-white"
              style={{ backgroundColor: '#EB001B' }}
            />
            <div 
              className="w-6 h-6 rounded-full border-2 border-white -ml-3"
              style={{ backgroundColor: '#F79E1B' }}
            />
          </div>
        </div>

        {/* Número do cartão */}
        <div>
          <div className="text-base font-mono tracking-wider text-white/95 font-light">
            •••• •••• •••• {lastDigits}
          </div>
        </div>

        {/* Informações do limite - Base do cartão */}
        <div className="flex flex-col gap-1.5">
          {/* Barra de progresso do limite */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-white/90 font-medium">Limite utilizado</span>
              <span className="text-[11px] font-semibold text-white">{usedPercentage.toFixed(0)}%</span>
            </div>
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/70 rounded-full transition-all duration-500"
                style={{ width: `${usedPercentage}%` }}
              />
            </div>
          </div>
          
          {/* Informações financeiras - Completamente visíveis */}
          <div className="space-y-0.5 pt-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-white/80">Usado</span>
              <span className="text-[11px] font-semibold text-white">{formatCurrency(currentBill)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-white/80">Restante</span>
              <span className="text-[11px] font-semibold text-white">{formatCurrency(availableLimit)}</span>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  )
}
