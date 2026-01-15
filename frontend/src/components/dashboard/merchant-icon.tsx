'use client'

import React, { useState, useEffect } from 'react'
import { Building2, Store } from 'lucide-react'
import { useMerchantLogo } from '@/hooks/use-brandfetch'
import { getMerchantDomain } from '@/lib/brandfetch-api'

interface MerchantIconProps {
  merchantName: string
  size?: number
  className?: string
}

/**
 * Extrai o nome do estabelecimento da descrição da transação
 * Ex: "Supermercado Extra" -> "Extra", "Uber" -> "Uber", "99" -> "99"
 */
function extractMerchantName(description: string): string {
  if (!description) return ''
  
  // Remove palavras comuns no início
  const commonPrefixes = [
    'supermercado',
    'mercado',
    'farmácia',
    'farmacia',
    'loja',
    'restaurante',
    'padaria',
    'posto',
    'conta de',
    'conta',
    'pagamento',
    'compra',
    'transferência',
    'transferencia',
    'depósito',
    'deposito',
  ]
  
  const lowerDesc = description.toLowerCase().trim()
  
  // Tenta encontrar o nome do estabelecimento removendo prefixos
  for (const prefix of commonPrefixes) {
    if (lowerDesc.startsWith(prefix)) {
      const withoutPrefix = description.substring(prefix.length).trim()
      // Remove hífen ou dois pontos se houver
      return withoutPrefix.replace(/^[-:\s]+/, '').trim() || description
    }
  }
  
  // Se não encontrou prefixo, retorna a primeira palavra ou o nome completo se for curto
  const words = description.split(' ')
  if (words.length === 1 || description.length < 15) {
    return description
  }
  
  // Retorna a primeira palavra (geralmente é o nome do estabelecimento)
  return words[0]
}


/**
 * Componente para exibir o ícone de um estabelecimento/empresa
 * Estratégia de fallback:
 * 1. Tenta Brandfetch API
 * 2. Se falhar, usa ícone padrão (Store ou Building2)
 */
export function MerchantIcon({ 
  merchantName, 
  size = 24,
  className = ''
}: MerchantIconProps) {
  const [brandfetchError, setBrandfetchError] = useState(false)
  const extractedName = extractMerchantName(merchantName)
  const domain = getMerchantDomain(extractedName)
  
  // Buscar logo via Brandfetch API
  const { data: brandfetchLogo, isLoading: isLoadingBrandfetch } = useMerchantLogo(
    extractedName,
    !!domain && !brandfetchError
  )

  // Resetar erro quando o estabelecimento mudar
  useEffect(() => {
    setBrandfetchError(false)
  }, [merchantName])

  // Se o Brandfetch retornou um logo e não teve erro, usar ele
  if (brandfetchLogo && !brandfetchError && !isLoadingBrandfetch) {
    return (
      <img
        src={brandfetchLogo}
        alt={`Logo ${extractedName}`}
        className={className || 'object-contain'}
        style={{ width: size, height: size }}
        onError={() => setBrandfetchError(true)}
      />
    )
  }

  // Fallback: ícone padrão baseado no tipo
  // Se for um nome curto (provavelmente app/empresa), usa Store
  // Caso contrário, usa Building2
  const Icon = extractedName.length < 10 ? Store : Building2
  
  return (
    <Icon 
      className={className}
      style={{ width: size, height: size }}
    />
  )
}
