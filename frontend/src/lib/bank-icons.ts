// Mapeamento de ícones de bancos
// Os ícones devem estar na pasta frontend/public/icons/ com o formato: icon-{nome-do-banco}.png

/**
 * Obtém o caminho do ícone de um banco
 * @param bankName Nome do banco (ex: "Nubank", "Inter", "Banco do Brasil")
 * @returns Caminho relativo do ícone ou null se não encontrado
 */
export function getBankIconPath(bankName: string): string | null {
  if (!bankName) return null
  
  // Normalizar o nome do banco para o formato do arquivo
  const normalizedName = bankName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
  
  // Mapeamento específico para nomes de arquivos
  const iconMap: Record<string, string> = {
    'nubank': '/icons/icon-nubank.png',
    'inter': '/icons/icon-inter.png',
    'banco-do-brasil': '/icons/icon-banco-do-brasil.png',
    'bb': '/icons/icon-banco-do-brasil.png',
    'caixa': '/icons/icon-caixa.png',
    'caixa-economica': '/icons/icon-caixa.png',
    'caixa-economica-federal': '/icons/icon-caixa.png',
    'itau': '/icons/icon-itau.png',
    'itaú': '/icons/icon-itau.png',
    'bradesco': '/icons/icon-bradesco.png',
    'santander': '/icons/icon-santander.png',
  }
  
  // Tentar encontrar no mapeamento
  if (iconMap[normalizedName]) {
    return iconMap[normalizedName]
  }
  
  // Se não encontrar, tentar com o nome normalizado
  return `/icons/icon-${normalizedName}.png`
}

/**
 * Verifica se um ícone existe para um banco
 * @param bankName Nome do banco
 * @returns true se o ícone existe
 */
export function hasBankIcon(bankName: string): boolean {
  const iconPath = getBankIconPath(bankName)
  return iconPath !== null
}