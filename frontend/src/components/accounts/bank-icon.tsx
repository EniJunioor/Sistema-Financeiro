'use client'

import React, { useState } from 'react'
import { Building2 } from 'lucide-react'
import { getBankIconPath } from '@/lib/bank-icons'

interface BankIconProps {
  bankName: string
  size?: number
  className?: string
}

/**
 * Componente para exibir o ícone de um banco
 * Se o ícone não existir, usa um ícone padrão como fallback
 */
export function BankIcon({ 
  bankName, 
  size = 24,
  className = ''
}: BankIconProps) {
  const [hasError, setHasError] = useState(false)
  const iconPath = getBankIconPath(bankName)
  
  // Se não tiver caminho ou tiver erro, usar fallback
  if (!iconPath || hasError) {
    return (
      <Building2 
        className={className}
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <img
      src={iconPath}
      alt={`Logo ${bankName}`}
      className={className || 'object-contain'}
      style={{ width: size, height: size }}
      onError={() => setHasError(true)}
    />
  )
}