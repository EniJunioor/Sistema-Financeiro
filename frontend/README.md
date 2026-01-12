# 🌐 Frontend - Plataforma Financeira

Aplicação web moderna construída com Next.js 14, TypeScript, TailwindCSS e Shadcn/ui para gestão financeira completa.

## ✨ Funcionalidades Implementadas

### 🔐 Autenticação
- ✅ NextAuth.js v5 com múltiplos provedores
- ✅ Login/registro com email e senha
- ✅ OAuth (Google, Microsoft, Facebook, Apple)
- ✅ Páginas de autenticação responsivas
- ✅ Proteção de rotas com middleware

### 🏦 Gestão de Contas Bancárias
- ✅ Interface completa para contas bancárias
- ✅ Conexão via Open Banking (OAuth flow)
- ✅ Visualização de transações importadas
- ✅ Aprovação de transações pendentes
- ✅ Sincronização manual e automática
- ✅ Gestão de múltiplas contas

### 💰 Transações
- ✅ CRUD completo de transações
- ✅ Filtros avançados e busca
- ✅ Categorização automática
- ✅ Transações recorrentes
- ✅ Deduplicação inteligente
- ✅ Paginação e ordenação

### 📊 Dashboard
- ✅ Dashboard principal com métricas
- ✅ Gráficos interativos (Recharts)
- ✅ Cards de resumo financeiro
- ✅ Seletor de período
- ✅ Atualização em tempo real

### 🎨 Interface e UX
- ✅ Design system completo (Shadcn/ui)
- ✅ Sidebar navegação expansível
- ✅ Layout responsivo
- ✅ Dark/Light mode
- ✅ Loading states e skeletons
- ✅ Error boundaries
- ✅ Toast notifications

### 🔧 Arquitetura Técnica
- ✅ Next.js 14 com App Router
- ✅ TypeScript rigoroso
- ✅ React Query para cache
- ✅ Zustand para estado global
- ✅ React Hook Form + Zod
- ✅ Testes unitários (Jest + Testing Library)

## 🏗️ Estrutura do Projeto

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Rotas de autenticação
│   │   ├── login/               # Página de login
│   │   ├── register/            # Página de registro
│   │   ├── forgot-password/     # Recuperação de senha
│   │   └── layout.tsx           # Layout de auth
│   │
│   ├── (dashboard)/             # Rotas do dashboard
│   │   ├── dashboard/           # Dashboard principal
│   │   ├── accounts/            # Contas bancárias
│   │   │   ├── page.tsx         # Lista de contas
│   │   │   └── [id]/page.tsx    # Detalhes da conta
│   │   ├── transactions/        # Transações
│   │   ├── investments/         # Investimentos
│   │   ├── goals/               # Metas
│   │   └── layout.tsx           # Layout do dashboard
│   │
│   ├── auth/                    # Callbacks OAuth
│   │   └── callback/            # Callback OAuth
│   │
│   └── api/                     # API Routes
│       └── auth/                # NextAuth endpoints
│
├── components/                  # Componentes React
│   ├── ui/                      # Componentes base (Shadcn/ui)
│   │   ├── button.tsx           # Botão
│   │   ├── card.tsx             # Card
│   │   ├── dialog.tsx           # Modal
│   │   ├── tabs.tsx             # Tabs
│   │   ├── calendar.tsx         # Calendário
│   │   └── ...                  # 20+ componentes UI
│   │
│   ├── layout/                  # Componentes de layout
│   │   ├── sidebar.tsx          # Sidebar principal
│   │   ├── header.tsx           # Header
│   │   └── dashboard-layout.tsx # Layout do dashboard
│   │
│   ├── accounts/                # Componentes de contas
│   │   ├── account-card.tsx     # Card de conta
│   │   ├── connect-account-dialog.tsx # Dialog de conexão
│   │   ├── account-settings.tsx # Configurações
│   │   ├── transactions-list.tsx # Lista de transações
│   │   └── pending-transactions.tsx # Transações pendentes
│   │
│   ├── transactions/            # Componentes de transações
│   │   ├── transaction-form.tsx # Formulário
│   │   ├── transaction-list.tsx # Lista
│   │   ├── transaction-filters.tsx # Filtros
│   │   └── deduplication-page.tsx # Deduplicação
│   │
│   ├── dashboard/               # Componentes do dashboard
│   │   ├── financial-summary-cards.tsx # Cards de resumo
│   │   ├── recent-transactions.tsx # Transações recentes
│   │   └── period-selector.tsx  # Seletor de período
│   │
│   └── charts/                  # Gráficos e visualizações
│       ├── expense-trend-chart.tsx # Gráfico de tendências
│       ├── category-breakdown-chart.tsx # Breakdown por categoria
│       └── financial-overview-chart.tsx # Visão geral
│
├── lib/                         # Utilitários e configurações
│   ├── api.ts                   # Cliente API base
│   ├── accounts-api.ts          # API de contas
│   ├── transactions-api.ts      # API de transações
│   ├── dashboard-api.ts         # API do dashboard
│   ├── auth.ts                  # Configuração NextAuth
│   ├── utils.ts                 # Utilitários gerais
│   └── validations.ts           # Schemas Zod
│
├── hooks/                       # Custom hooks
│   ├── use-auth.ts              # Hook de autenticação
│   ├── use-accounts.ts          # Hook de contas
│   ├── use-transactions.ts      # Hook de transações
│   ├── use-dashboard.ts         # Hook do dashboard
│   └── use-deduplication.ts     # Hook de deduplicação
│
├── store/                       # Estado global (Zustand)
│   ├── auth-store.ts            # Store de autenticação
│   ├── ui-store.ts              # Store de UI
│   └── data-store.ts            # Store de dados
│
└── types/                       # Tipos TypeScript
    ├── auth.ts                  # Tipos de autenticação
    ├── transaction.ts           # Tipos de transação
    ├── dashboard.ts             # Tipos do dashboard
    └── api.ts                   # Tipos de API
```

## 🚀 Começando

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Backend da Plataforma Financeira rodando

### Instalação

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Configurar variáveis de ambiente:**
   ```bash
   cp .env.local.example .env.local
   ```

   Edite `.env.local` com suas configurações:
   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key
   NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
   
   # OAuth Providers
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

3. **Iniciar servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Abrir no navegador:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Storybook: [http://localhost:6006](http://localhost:6006)

## 📜 Scripts Disponíveis

### Desenvolvimento
- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run start` - Inicia servidor de produção
- `npm run preview` - Preview do build de produção

### Qualidade de Código
- `npm run lint` - Executa ESLint
- `npm run lint:fix` - Corrige problemas do ESLint
- `npm run type-check` - Verificação de tipos TypeScript
- `npm run format` - Formata código com Prettier

### Testes
- `npm run test` - Executa testes unitários
- `npm run test:watch` - Testes em modo watch
- `npm run test:coverage` - Testes com cobertura
- `npm run test:e2e` - Testes end-to-end (Cypress)

### Storybook
- `npm run storybook` - Inicia Storybook
- `npm run build-storybook` - Build do Storybook

### Análise
- `npm run analyze` - Análise do bundle
- `npm run lighthouse` - Auditoria Lighthouse

## 🔐 Autenticação

A aplicação usa NextAuth.js v5 para autenticação com suporte a:

### Provedores Suportados
- **Credentials** - Email e senha
- **Google** - OAuth 2.0
- **Microsoft** - OAuth 2.0
- **Facebook** - OAuth 2.0
- **Apple** - OAuth 2.0

### Fluxo de Autenticação
1. Usuário acessa página protegida
2. Redirecionamento para `/login`
3. Escolha do método de autenticação
4. Validação e criação de sessão
5. Redirecionamento para página original

### Configuração OAuth
```typescript
// lib/auth.ts
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Outros provedores...
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) token.id = user.id;
      return token;
    },
    session: ({ session, token }) => {
      session.user.id = token.id;
      return session;
    },
  },
};
```

## 🎨 Componentes UI

Construído com Shadcn/ui e TailwindCSS:

### Componentes Base
- **Button** - Botões com variantes e tamanhos
- **Card** - Cards com header, content e footer
- **Dialog** - Modais e popups
- **Form** - Formulários com validação
- **Input** - Campos de entrada
- **Select** - Seletores dropdown
- **Table** - Tabelas responsivas
- **Tabs** - Navegação por abas

### Componentes Específicos
- **AccountCard** - Card de conta bancária
- **TransactionForm** - Formulário de transação
- **ConnectAccountDialog** - Dialog de conexão bancária
- **FinancialSummaryCards** - Cards de resumo financeiro

### Exemplo de Uso
```typescript
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ExampleComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Título do Card</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="default" size="lg">
          Clique aqui
        </Button>
      </CardContent>
    </Card>
  );
}
```

## 🔄 Gerenciamento de Estado

### React Query (TanStack Query)
Para cache e sincronização de dados do servidor:

```typescript
// hooks/use-accounts.ts
export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: AccountsAPI.getAccounts,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: AccountsAPI.createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}
```

### Zustand
Para estado global da aplicação:

```typescript
// store/ui-store.ts
interface UIStore {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  theme: 'light',
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setTheme: (theme) => set({ theme }),
}));
```

## 📱 Responsividade

A aplicação é totalmente responsiva com breakpoints:

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Exemplo de Classes Responsivas
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards responsivos */}
</div>
```

## 🧪 Testes

### Testes Unitários (Jest + Testing Library)
```typescript
// components/__tests__/account-card.test.tsx
import { render, screen } from '@testing-library/react';
import { AccountCard } from '../account-card';

describe('AccountCard', () => {
  it('renders account information correctly', () => {
    const account = {
      id: '1',
      name: 'Conta Corrente',
      balance: 1000,
      type: 'checking',
    };

    render(<AccountCard account={account} />);
    
    expect(screen.getByText('Conta Corrente')).toBeInTheDocument();
    expect(screen.getByText('R$ 1.000,00')).toBeInTheDocument();
  });
});
```

### Testes E2E (Cypress)
```typescript
// cypress/e2e/accounts.cy.ts
describe('Accounts Management', () => {
  it('should connect a new bank account', () => {
    cy.visit('/accounts');
    cy.get('[data-testid="connect-account-button"]').click();
    cy.get('[data-testid="provider-plaid"]').click();
    // ... resto do teste
  });
});
```

## 🚀 Deploy

### Vercel (Recomendado)
```bash
npm install -g vercel
vercel --prod
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Variáveis de Ambiente de Produção
```env
NEXTAUTH_URL=https://seu-dominio.com
NEXTAUTH_SECRET=production-secret-key
NEXT_PUBLIC_API_URL=https://api.seu-dominio.com/api/v1
```

## 🔧 Desenvolvimento

### Adicionando Nova Página
1. Criar arquivo em `src/app/(dashboard)/nova-pagina/page.tsx`
2. Adicionar rota no sidebar (`components/layout/sidebar.tsx`)
3. Criar componentes necessários
4. Adicionar testes

### Adicionando Novo Componente UI
1. Criar em `src/components/ui/novo-componente.tsx`
2. Seguir padrões do Shadcn/ui
3. Adicionar ao Storybook
4. Escrever testes

### Integrando Nova API
1. Criar cliente em `src/lib/nova-api.ts`
2. Criar hooks em `src/hooks/use-nova-api.ts`
3. Adicionar tipos em `src/types/`
4. Usar nos componentes

## 📚 Recursos Úteis

- [Next.js Documentation](https://nextjs.org/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Shadcn/ui Components](https://ui.shadcn.com/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [NextAuth.js Documentation](https://next-auth.js.org/)

---

Para mais informações sobre o backend, consulte a [documentação da API](../docs/API.md).