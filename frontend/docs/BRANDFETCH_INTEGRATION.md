# 🔗 Integração Brandfetch API

Este documento descreve a integração com a Brandfetch API para buscar logos e cores de bancos automaticamente.

## 📋 Visão Geral

A Brandfetch API permite buscar logos, cores e outros assets de marcas automaticamente, eliminando a necessidade de baixar e gerenciar ícones manualmente.

## 🎯 Funcionalidades

- ✅ Busca automática de logos de bancos
- ✅ Obtenção de cores oficiais das marcas
- ✅ Suporte para múltiplos formatos (SVG, PNG)
- ✅ Cache de dados para performance
- ✅ Fallback para ícones locais

## 🔑 Configuração

### 1. Obter API Key

1. Acesse o [Developer Portal da Brandfetch](https://brandfetch.com/developers)
2. Crie uma conta (gratuita com limites)
3. Gere sua API key

### 2. Configurar Variável de Ambiente

Adicione a API key no arquivo `.env.local`:

```env
NEXT_PUBLIC_BRANDFETCH_API_KEY=sua-api-key-aqui
```

**Importante**: A variável precisa ter o prefixo `NEXT_PUBLIC_` para ser acessível no frontend.

### 3. Configurar Domínio de Imagens (Opcional)

Se você quiser usar o componente `next/image` para logos, adicione o domínio da Brandfetch no `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'cdn.brandfetch.io'],
  },
}
```

## 🛠️ Uso

### Buscar Logo de um Banco

```typescript
import { fetchBankLogo } from '@/lib/brandfetch-api'

const logoUrl = await fetchBankLogo('Nubank')
// Retorna: URL do logo (SVG ou PNG)
```

### Buscar Cores de um Banco

```typescript
import { fetchBankColors } from '@/lib/brandfetch-api'

const colors = await fetchBankColors('Nubank')
// Retorna: { primary: '#820AD1', secondary?: '#A855F7' }
```

### Buscar Dados Completos

```typescript
import { fetchBankBrandData } from '@/lib/brandfetch-api'

const brandData = await fetchBankBrandData('Nubank')
// Retorna: { logo?: string, colors?: { primary, secondary }, name?: string }
```

## 🎣 React Hooks

### useBankBrand

Hook para buscar dados completos de marca:

```typescript
import { useBankBrand } from '@/hooks/use-brandfetch'

function BankCard({ bankName }) {
  const { data: brandData, isLoading } = useBankBrand(bankName)
  
  if (isLoading) return <div>Carregando...</div>
  
  return (
    <div>
      {brandData?.logo && (
        <img src={brandData.logo} alt={bankName} />
      )}
      {brandData?.colors?.primary && (
        <div style={{ backgroundColor: brandData.colors.primary }}>
          {bankName}
        </div>
      )}
    </div>
  )
}
```

### useBankLogo

Hook para buscar apenas o logo:

```typescript
import { useBankLogo } from '@/hooks/use-brandfetch'

function BankIcon({ bankName }) {
  const { data: logoUrl } = useBankLogo(bankName)
  
  return logoUrl ? (
    <img src={logoUrl} alt={bankName} />
  ) : (
    <DefaultIcon />
  )
}
```

### useBankColors

Hook para buscar apenas as cores:

```typescript
import { useBankColors } from '@/hooks/use-brandfetch'

function BankCard({ bankName }) {
  const { data: colors } = useBankColors(bankName)
  
  return (
    <div style={{ 
      backgroundColor: colors?.primary || '#gray',
      color: colors?.textColor || '#white'
    }}>
      {bankName}
    </div>
  )
}
```

## 📝 Mapeamento de Bancos

O sistema mapeia automaticamente nomes de bancos para domínios:

| Banco | Domínio |
|-------|---------|
| Nubank | nubank.com.br |
| Inter | bancointer.com.br |
| Banco do Brasil / BB | bb.com.br |
| Caixa | caixa.gov.br |
| Itaú | itau.com.br |
| Bradesco | bradesco.com.br |
| Santander | santander.com.br |

Para adicionar novos bancos, edite o arquivo `frontend/src/lib/brandfetch-api.ts`:

```typescript
const bankDomainMap: Record<string, string> = {
  // ... bancos existentes ...
  'novo-banco': 'novobanco.com.br',
}
```

## ⚠️ Limitações e Considerações

### Limites da API

- **Plano Gratuito**: Limitado a um número de requisições por mês
- **Rate Limiting**: Pode ter limite de requisições por minuto
- **Cobertura**: Nem todos os bancos podem estar disponíveis na base de dados

### Segurança

**Importante**: A API key fica exposta no frontend quando usa `NEXT_PUBLIC_`.

**Recomendações**:
1. **Usar via Backend (Recomendado)**: Criar um endpoint no backend que faz a chamada à Brandfetch API
2. **Usar no Frontend**: Apenas se a API key for pública/limitada e não for crítica
3. **Rate Limiting**: Implementar rate limiting no frontend para evitar abuso

### Performance

- **Cache**: Os hooks usam React Query com cache de 24 horas
- **Lazy Loading**: Logos são carregados sob demanda
- **Fallback**: Sempre há fallback para ícones locais se a API falhar

## 🔄 Estratégia de Fallback

O sistema funciona com uma estratégia de fallback:

1. **Tentar Brandfetch API** (se configurada)
2. **Usar ícone local** (se disponível em `public/icons/`)
3. **Usar ícone padrão** (Building2 do lucide-react)

## 📚 Referências

- [Brandfetch API Documentation](https://docs.brandfetch.com/)
- [Developer Portal](https://brandfetch.com/developers)
- [Brand API Reference](https://docs.brandfetch.com/reference/brand-api)

## 🔧 Exemplo Completo

```typescript
'use client'

import { useBankBrand } from '@/hooks/use-brandfetch'
import { Building2 } from 'lucide-react'

function SmartBankIcon({ bankName }: { bankName: string }) {
  const { data: brandData, isLoading } = useBankBrand(bankName)
  
  // Fallback para ícone local se API não disponível
  if (!isLoading && !brandData?.logo) {
    return <LocalBankIcon bankName={bankName} />
  }
  
  if (isLoading) {
    return <Building2 className="animate-pulse" />
  }
  
  return (
    <img
      src={brandData.logo}
      alt={bankName}
      className="object-contain"
      onError={() => {
        // Fallback em caso de erro
        return <LocalBankIcon bankName={bankName} />
      }}
    />
  )
}
```

## 🚀 Próximos Passos

Para usar a integração:

1. Obter API key da Brandfetch
2. Adicionar `NEXT_PUBLIC_BRANDFETCH_API_KEY` no `.env.local`
3. Usar os hooks nos componentes
4. Monitorar uso da API para não exceder limites
