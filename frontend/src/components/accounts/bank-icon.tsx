'use client'

import React, { useState, useEffect } from 'react'
import { Building2 } from 'lucide-react'
import { getBankIconPath } from '@/lib/bank-icons'
import { useBankLogo } from '@/hooks/use-brandfetch'

interface BankIconProps {
  bankName: string
  size?: number
  className?: string
}

/**
 * Componente para exibir o ícone de um banco
 * Estratégia de fallback:
 * 1. Tenta ícone local (public/icons/)
 * 2. Se falhar, tenta Brandfetch API
 * 3. Se falhar, usa ícone padrão (Building2)
 */
export function BankIcon({ 
  bankName, 
  size = 24,
  className = ''
}: BankIconProps) {
  const [localIconError, setLocalIconError] = useState(false)
  const [brandfetchError, setBrandfetchError] = useState(false)
  const localIconPath = getBankIconPath(bankName)
  
  // Buscar logo via Brandfetch API como fallback
  // Busca em paralelo desde o início para ter pronto caso o ícone local falhe
  // Mas só usa se o ícone local realmente falhar
  const { data: brandfetchLogo, isLoading: isLoadingBrandfetch } = useBankLogo(
    bankName,
    true // Sempre buscar, mas só usar se necessário
  )

  // Resetar erros quando o banco mudar
  useEffect(() => {
    setLocalIconError(false)
    setBrandfetchError(false)
  }, [bankName])

  // Se o ícone local carregou com sucesso, usar ele
  if (localIconPath && !localIconError) {
    return (
      <img
        src={localIconPath}
        alt={`Logo ${bankName}`}
        className={className || 'object-contain'}
        style={{ width: size, height: size }}
        onError={() => setLocalIconError(true)}
      />
    )
  }

  // Se o Brandfetch retornou um logo e não teve erro, usar ele
  if (brandfetchLogo && !brandfetchError && !isLoadingBrandfetch) {
    return (
      <img
        src={brandfetchLogo}
        alt={`Logo ${bankName}`}
        className={className || 'object-contain'}
        style={{ width: size, height: size }}
        onError={() => setBrandfetchError(true)}
      />
    )
  }

  // Fallback final: ícone padrão
  return (
    <Building2 
      className={className}
      style={{ width: size, height: size }}
    />
  )
}