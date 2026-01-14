// Mapeamento de cores e estilos por banco
export interface BankConfig {
  primaryColor: string
  secondaryColor?: string
  gradient?: string
  textColor?: string
  name: string
}

// Cores dos principais bancos brasileiros
export const bankColors: Record<string, BankConfig> = {
  // Nubank
  'nubank': {
    primaryColor: '#820AD1',
    gradient: 'linear-gradient(135deg, #820AD1 0%, #A855F7 100%)',
    textColor: '#FFFFFF',
    name: 'Nubank'
  },
  // Banco Inter
  'inter': {
    primaryColor: '#FF6F00',
    gradient: 'linear-gradient(135deg, #FF6F00 0%, #FF8F00 100%)',
    textColor: '#FFFFFF',
    name: 'Inter'
  },
  // Banco do Brasil
  'banco do brasil': {
    primaryColor: '#455CFF',
    gradient: 'linear-gradient(135deg, #455CFF 0%, #6C7CE8 100%)',
    textColor: '#FFFFFF',
    name: 'Banco do Brasil'
  },
  'bb': {
    primaryColor: '#455CFF',
    gradient: 'linear-gradient(135deg, #455CFF 0%, #6C7CE8 100%)',
    textColor: '#FFFFFF',
    name: 'Banco do Brasil'
  },
  // Caixa Econômica Federal
  'caixa': {
    primaryColor: '#005CA9',
    gradient: 'linear-gradient(135deg, #005CA9 0%, #0073CE 100%)',
    textColor: '#FFFFFF',
    name: 'Caixa'
  },
  'caixa econômica': {
    primaryColor: '#005CA9',
    gradient: 'linear-gradient(135deg, #005CA9 0%, #0073CE 100%)',
    textColor: '#FFFFFF',
    name: 'Caixa'
  },
  // Itaú
  'itau': {
    primaryColor: '#EC7000',
    gradient: 'linear-gradient(135deg, #EC7000 0%, #FF8C00 100%)',
    textColor: '#FFFFFF',
    name: 'Itaú'
  },
  'itaú': {
    primaryColor: '#EC7000',
    gradient: 'linear-gradient(135deg, #EC7000 0%, #FF8C00 100%)',
    textColor: '#FFFFFF',
    name: 'Itaú'
  },
  // Bradesco
  'bradesco': {
    primaryColor: '#CC092F',
    gradient: 'linear-gradient(135deg, #CC092F 0%, #E91E63 100%)',
    textColor: '#FFFFFF',
    name: 'Bradesco'
  },
  // Santander
  'santander': {
    primaryColor: '#EC0000',
    gradient: 'linear-gradient(135deg, #EC0000 0%, #FF1A1A 100%)',
    textColor: '#FFFFFF',
    name: 'Santander'
  },
  // Padrão
  'default': {
    primaryColor: '#6B7280',
    gradient: 'linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)',
    textColor: '#FFFFFF',
    name: 'Banco'
  }
}

export function getBankConfig(bankName: string): BankConfig {
  if (!bankName) return bankColors.default
  
  const normalizedName = bankName.toLowerCase().trim()
  
  // Busca exata
  if (bankColors[normalizedName]) {
    return bankColors[normalizedName]
  }
  
  // Busca parcial
  for (const [key, config] of Object.entries(bankColors)) {
    if (key !== 'default' && normalizedName.includes(key)) {
      return config
    }
  }
  
  return bankColors.default
}
