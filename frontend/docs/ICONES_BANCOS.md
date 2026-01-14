# 🏦 Sistema de Ícones de Bancos

Este documento descreve o sistema de ícones de bancos implementado na plataforma financeira.

## 📋 Visão Geral

O sistema de ícones de bancos permite exibir logos reais dos bancos na interface, melhorando a experiência do usuário e facilitando a identificação visual das contas bancárias.

## 🎯 Funcionalidades

- ✅ Exibição de logos reais dos bancos
- ✅ Fallback automático para ícone padrão
- ✅ Suporte para múltiplos bancos brasileiros
- ✅ Normalização automática de nomes de bancos
- ✅ Mapeamento flexível de nomes para arquivos

## 📁 Estrutura de Arquivos

```
frontend/
├── public/
│   └── icons/                    # Ícones de bancos (PNG/SVG)
│       ├── icon-nubank.png
│       ├── icon-inter.png
│       ├── icon-banco-do-brasil.png
│       ├── icon-caixa.png
│       ├── icon-itau.png
│       ├── icon-bradesco.png
│       └── icon-santander.png
│
├── src/
│   ├── components/
│   │   └── accounts/
│   │       └── bank-icon.tsx     # Componente de ícone de banco
│   │
│   └── lib/
│       └── bank-icons.ts         # Utilitários de mapeamento
```

## 🔧 Componente BankIcon

O componente `BankIcon` é responsável por exibir o ícone de um banco, com fallback automático para um ícone padrão caso o ícone do banco não seja encontrado.

### Uso Básico

```tsx
import { BankIcon } from '@/components/accounts/bank-icon'

function AccountCard({ account }) {
  return (
    <div>
      <BankIcon 
        bankName={account.name}
        size={24}
        className="object-contain"
      />
      <span>{account.name}</span>
    </div>
  )
}
```

### Propriedades

| Propriedade | Tipo | Padrão | Descrição |
|------------|------|--------|-----------|
| `bankName` | `string` | obrigatório | Nome do banco (ex: "Nubank", "Inter") |
| `size` | `number` | `24` | Tamanho do ícone em pixels |
| `className` | `string` | `''` | Classes CSS adicionais |

### Exemplo Completo

```tsx
'use client'

import { BankIcon } from '@/components/accounts/bank-icon'
import { Card, CardContent } from '@/components/ui/card'

export function AccountList({ accounts }) {
  return (
    <div className="space-y-4">
      {accounts.map((account) => (
        <Card key={account.id}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gray-100">
              <BankIcon 
                bankName={account.name}
                size={24}
                className="object-contain"
              />
            </div>
            <div>
              <h3 className="font-semibold">{account.name}</h3>
              <p className="text-sm text-gray-500">{account.type}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

## 🛠️ Utilitários

### getBankIconPath

A função `getBankIconPath` retorna o caminho do ícone de um banco baseado no seu nome.

```tsx
import { getBankIconPath } from '@/lib/bank-icons'

const iconPath = getBankIconPath('Nubank')
// Retorna: '/icons/icon-nubank.png'

const iconPath2 = getBankIconPath('Banco do Brasil')
// Retorna: '/icons/icon-banco-do-brasil.png'
```

### hasBankIcon

A função `hasBankIcon` verifica se existe um ícone para um banco.

```tsx
import { hasBankIcon } from '@/lib/bank-icons'

const exists = hasBankIcon('Nubank')
// Retorna: true (se o arquivo existir)
```

## 📝 Adicionando Novos Ícones

Para adicionar um novo ícone de banco:

1. **Adicionar o arquivo de ícone**
   - Coloque o arquivo em `frontend/public/icons/`
   - Formato: `icon-{nome-do-banco}.png` ou `.svg`
   - Exemplo: `icon-nubank.png`

2. **Atualizar o mapeamento (opcional)**
   - O sistema tenta encontrar o ícone automaticamente baseado no nome do banco
   - Se necessário, adicione uma entrada no objeto `iconMap` em `frontend/src/lib/bank-icons.ts`:

```tsx
const iconMap: Record<string, string> = {
  'nubank': '/icons/icon-nubank.png',
  'inter': '/icons/icon-inter.png',
  'novo-banco': '/icons/icon-novo-banco.png', // Nova entrada
  // ...
}
```

3. **Usar o componente**
   - Use o componente `BankIcon` na interface:

```tsx
<BankIcon bankName="Novo Banco" size={24} />
```

## 🎨 Especificações de Ícones

### Formato
- **Preferido**: SVG (escalável e menor tamanho)
- **Alternativa**: PNG com fundo transparente

### Tamanho
- **Recomendado**: 512x512px (para qualidade em qualquer tamanho)
- **Mínimo**: 256x256px

### Nome do Arquivo
- Formato: `icon-{nome-do-banco}.{extensão}`
- Nome normalizado: minúsculas, sem acentos, espaços substituídos por hífens
- Exemplos:
  - `icon-nubank.png`
  - `icon-banco-do-brasil.png`
  - `icon-caixa.png`

## 🔄 Bancos Suportados

O sistema suporta os seguintes bancos:

- ✅ Nubank
- ✅ Inter
- ✅ Banco do Brasil (BB)
- ✅ Caixa Econômica Federal
- ✅ Itaú
- ✅ Bradesco
- ✅ Santander

### Adicionando Suporte para Novos Bancos

1. Adicione o arquivo de ícone em `public/icons/`
2. O sistema tentará encontrar automaticamente baseado no nome
3. Se necessário, adicione mapeamento em `bank-icons.ts`

## 🐛 Troubleshooting

### Ícone não aparece

**Problema**: O ícone não está sendo exibido

**Soluções**:
1. Verifique se o arquivo existe em `public/icons/`
2. Verifique se o nome do arquivo está correto (minúsculas, sem acentos)
3. Verifique o console do navegador para erros de carregamento
4. O componente usa fallback automático para ícone padrão

### Nome do banco não é reconhecido

**Problema**: O sistema não encontra o ícone para um banco específico

**Soluções**:
1. Verifique a normalização do nome (minúsculas, sem acentos)
2. Adicione uma entrada no `iconMap` em `bank-icons.ts`
3. Verifique se há variações do nome (ex: "BB" vs "Banco do Brasil")

### Ícone aparece distorcido

**Problema**: O ícone está sendo exibido com proporções incorretas

**Soluções**:
1. Use `className="object-contain"` no componente
2. Verifique se o container tem tamanho fixo (width/height)
3. Use proporções corretas (1:1 para ícones de bancos)

## 📚 Referências

- [Next.js Static Files](https://nextjs.org/docs/app/building-your-application/optimizing/static-assets)
- [Componente BankIcon](../../src/components/accounts/bank-icon.tsx)
- [Utilitários de Ícones](../../src/lib/bank-icons.ts)
