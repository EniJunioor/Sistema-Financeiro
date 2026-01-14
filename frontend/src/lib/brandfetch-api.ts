// Integração com Brandfetch API para buscar logos e cores de marcas
// Documentação: https://docs.brandfetch.com/

export interface BrandfetchLogo {
  type: string;
  theme: string;
  formats: Array<{
    src: string;
    format: string;
    size?: number;
  }>;
}

export interface BrandfetchColor {
  hex: string;
  type: string;
  brightness?: number;
}

export interface BrandfetchBrand {
  name: string;
  domain: string;
  logos: BrandfetchLogo[];
  colors: BrandfetchColor[];
  fonts?: Array<{
    name: string;
    type: string;
  }>;
}

// Mapeamento de bancos para domínios
const bankDomainMap: Record<string, string> = {
  'nubank': 'nubank.com.br',
  'inter': 'bancointer.com.br',
  'banco do brasil': 'bb.com.br',
  'bb': 'bb.com.br',
  'caixa': 'caixa.gov.br',
  'caixa econômica': 'caixa.gov.br',
  'caixa econômica federal': 'caixa.gov.br',
  'itau': 'itau.com.br',
  'itaú': 'itau.com.br',
  'bradesco': 'bradesco.com.br',
  'santander': 'santander.com.br',
};

/**
 * Obtém o domínio de um banco baseado no nome
 */
export function getBankDomain(bankName: string): string | null {
  if (!bankName) return null;
  
  const normalizedName = bankName.toLowerCase().trim();
  
  // Busca exata
  if (bankDomainMap[normalizedName]) {
    return bankDomainMap[normalizedName];
  }
  
  // Busca parcial
  for (const [key, domain] of Object.entries(bankDomainMap)) {
    if (normalizedName.includes(key)) {
      return domain;
    }
  }
  
  return null;
}

/**
 * Busca dados de uma marca via Brandfetch API
 */
export async function fetchBrandData(domain: string): Promise<BrandfetchBrand | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_BRANDFETCH_API_KEY;
    
    // Se não tiver API key, retorna null
    if (!apiKey) {
      console.warn('Brandfetch API key not configured');
      return null;
    }
    
    const response = await fetch(`https://api.brandfetch.io/v2/brands/${domain}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Brand not found for domain: ${domain}`);
        return null;
      }
      throw new Error(`Brandfetch API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching brand data:', error);
    return null;
  }
}

/**
 * Busca logo de um banco via Brandfetch API
 * Retorna a URL do logo em formato SVG ou PNG
 */
export async function fetchBankLogo(bankName: string): Promise<string | null> {
  const domain = getBankDomain(bankName);
  if (!domain) return null;
  
  const brandData = await fetchBrandData(domain);
  if (!brandData || !brandData.logos || brandData.logos.length === 0) {
    return null;
  }
  
  // Preferir logo do tipo 'icon' ou 'logo'
  const logo = brandData.logos.find(l => l.type === 'icon' || l.type === 'logo') || brandData.logos[0];
  
  // Preferir formato SVG, depois PNG
  const svgFormat = logo.formats.find(f => f.format === 'svg');
  if (svgFormat) return svgFormat.src;
  
  const pngFormat = logo.formats.find(f => f.format === 'png');
  if (pngFormat) return pngFormat.src;
  
  // Retornar o primeiro formato disponível
  return logo.formats[0]?.src || null;
}

/**
 * Busca cores de um banco via Brandfetch API
 * Retorna a cor principal (brand) ou a primeira cor disponível
 */
export async function fetchBankColors(bankName: string): Promise<{ primary: string; secondary?: string } | null> {
  const domain = getBankDomain(bankName);
  if (!domain) return null;
  
  const brandData = await fetchBrandData(domain);
  if (!brandData || !brandData.colors || brandData.colors.length === 0) {
    return null;
  }
  
  // Preferir cor do tipo 'brand'
  const brandColor = brandData.colors.find(c => c.type === 'brand');
  const primary = brandColor?.hex || brandData.colors[0]?.hex;
  
  // Buscar cor secundária
  const secondaryColor = brandData.colors.find(c => c.type === 'accent' || c.type === 'secondary');
  const secondary = secondaryColor?.hex;
  
  if (!primary) return null;
  
  return { primary, secondary };
}

/**
 * Busca todos os dados de marca de um banco (logo + cores)
 */
export async function fetchBankBrandData(bankName: string): Promise<{
  logo?: string;
  colors?: { primary: string; secondary?: string };
  name?: string;
} | null> {
  const domain = getBankDomain(bankName);
  if (!domain) return null;
  
  const brandData = await fetchBrandData(domain);
  if (!brandData) return null;
  
  const result: {
    logo?: string;
    colors?: { primary: string; secondary?: string };
    name?: string;
  } = {};
  
  // Buscar logo
  if (brandData.logos && brandData.logos.length > 0) {
    const logo = brandData.logos.find(l => l.type === 'icon' || l.type === 'logo') || brandData.logos[0];
    const svgFormat = logo.formats.find(f => f.format === 'svg');
    const pngFormat = logo.formats.find(f => f.format === 'png');
    result.logo = svgFormat?.src || pngFormat?.src || logo.formats[0]?.src;
  }
  
  // Buscar cores
  if (brandData.colors && brandData.colors.length > 0) {
    const brandColor = brandData.colors.find(c => c.type === 'brand');
    const primary = brandColor?.hex || brandData.colors[0]?.hex;
    const secondaryColor = brandData.colors.find(c => c.type === 'accent' || c.type === 'secondary');
    result.colors = {
      primary: primary || '',
      secondary: secondaryColor?.hex,
    };
  }
  
  // Nome da marca
  if (brandData.name) {
    result.name = brandData.name;
  }
  
  return Object.keys(result).length > 0 ? result : null;
}
