# Documento de Design - Plataforma Financeira

## Visão Geral

A Plataforma Financeira é um sistema full-stack moderno construído com TypeScript, NestJS no backend e Next.js no frontend, projetado para oferecer gestão financeira completa com IA, segurança avançada e integrações bancárias. O sistema segue arquitetura modular, clean architecture e princípios SOLID.

## Arquitetura do Sistema

### Stack Tecnológica

**Backend (API)**
- **Runtime**: Node.js 18+ com TypeScript 5+
- **Framework**: NestJS 10+ (Express/Fastify)
- **ORM**: Prisma 5+ com PostgreSQL 15+
- **Cache**: Redis 7+ para sessões e cache
- **Queue**: Bull/BullMQ para processamento assíncrono
- **Auth**: Passport.js + JWT + OAuth2
- **Validation**: class-validator + class-transformer
- **Documentation**: Swagger/OpenAPI 3.0

**Frontend (Web)**
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript 5+
- **Styling**: TailwindCSS 3+ + Shadcn/ui
- **State**: Zustand + React Query (TanStack Query)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts + D3.js para visualizações avançadas
- **Auth**: NextAuth.js v5

**Mobile**
- **Framework**: React Native 0.73+ com Expo
- **Navigation**: React Navigation 6+
- **State**: Zustand + React Query
- **UI**: NativeBase ou Tamagui

**DevOps & Infraestrutura**
- **Containerização**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Cloud**: AWS (ECS, RDS, ElastiCache, S3)
- **Monitoring**: Sentry + DataDog
- **Testing**: Jest + Supertest + Cypress

## Arquitetura de Pastas

### Estrutura Geral do Projeto

```
plataforma-financeira/
├── 📁 backend/                    # API NestJS
├── 📁 frontend/                   # Web Next.js
├── 📁 mobile/                     # App React Native
├── 📁 shared/                     # Tipos e utilitários compartilhados
├── 📁 docs/                       # Documentação
├── 📁 scripts/                    # Scripts de automação
├── 📁 docker/                     # Configurações Docker
├── 🐳 docker-compose.yml          # Orquestração local
├── 📋 package.json                # Workspace root
└── 📄 README.md                   # Documentação principal
```

### Backend - Estrutura NestJS

```
backend/
├── 📁 src/
│   ├── 📁 modules/                # Módulos de negócio
│   │   ├── 📁 auth/               # Autenticação e autorização
│   │   │   ├── 📁 controllers/    # AuthController
│   │   │   ├── 📁 services/       # AuthService, JwtService
│   │   │   ├── 📁 guards/         # JwtGuard, RolesGuard
│   │   │   ├── 📁 strategies/     # JwtStrategy, GoogleStrategy
│   │   │   ├── 📁 dto/            # LoginDto, RegisterDto
│   │   │   └── 📄 auth.module.ts  # Módulo de autenticação
│   │   │
│   │   ├── 📁 users/              # Gestão de usuários
│   │   │   ├── 📁 controllers/    # UsersController
│   │   │   ├── 📁 services/       # UsersService
│   │   │   ├── 📁 dto/            # CreateUserDto, UpdateUserDto
│   │   │   ├── 📁 entities/       # User entity
│   │   │   └── 📄 users.module.ts
│   │   │
│   │   ├── 📁 transactions/       # Gestão de transações
│   │   │   ├── 📁 controllers/    # TransactionsController
│   │   │   ├── 📁 services/       # TransactionsService, CategoryService
│   │   │   ├── 📁 dto/            # CreateTransactionDto
│   │   │   ├── 📁 entities/       # Transaction, Category
│   │   │   └── 📄 transactions.module.ts
│   │   │
│   │   ├── 📁 accounts/           # Contas bancárias
│   │   │   ├── 📁 controllers/    # AccountsController
│   │   │   ├── 📁 services/       # AccountsService, OpenBankingService
│   │   │   ├── 📁 dto/            # ConnectAccountDto
│   │   │   ├── 📁 entities/       # Account, Bank
│   │   │   └── 📄 accounts.module.ts
│   │   │
│   │   ├── 📁 investments/        # Gestão de investimentos
│   │   │   ├── 📁 controllers/    # InvestmentsController
│   │   │   ├── 📁 services/       # InvestmentsService, QuotesService
│   │   │   ├── 📁 dto/            # CreateInvestmentDto
│   │   │   ├── 📁 entities/       # Investment, Asset
│   │   │   └── 📄 investments.module.ts
│   │   │
│   │   ├── 📁 goals/              # Metas financeiras
│   │   │   ├── 📁 controllers/    # GoalsController
│   │   │   ├── 📁 services/       # GoalsService, ProgressService
│   │   │   ├── 📁 dto/            # CreateGoalDto
│   │   │   ├── 📁 entities/       # Goal, Progress
│   │   │   └── 📄 goals.module.ts
│   │   │
│   │   ├── 📁 notifications/      # Sistema de notificações
│   │   │   ├── 📁 controllers/    # NotificationsController
│   │   │   ├── 📁 services/       # NotificationService, FCMService
│   │   │   ├── 📁 dto/            # SendNotificationDto
│   │   │   ├── 📁 entities/       # Notification
│   │   │   └── 📄 notifications.module.ts
│   │   │
│   │   ├── 📁 reports/            # Relatórios e analytics
│   │   │   ├── 📁 controllers/    # ReportsController
│   │   │   ├── 📁 services/       # ReportsService, AnalyticsService
│   │   │   ├── 📁 dto/            # GenerateReportDto
│   │   │   └── 📄 reports.module.ts
│   │   │
│   │   └── 📁 ai/                 # Inteligência Artificial
│   │       ├── 📁 controllers/    # AIController
│   │       ├── 📁 services/       # MLService, PredictionService
│   │       ├── 📁 dto/            # PredictionDto
│   │       └── 📄 ai.module.ts
│   │
│   ├── 📁 common/                 # Código compartilhado
│   │   ├── 📁 decorators/         # Custom decorators
│   │   ├── 📁 filters/            # Exception filters
│   │   ├── 📁 guards/             # Guards globais
│   │   ├── 📁 interceptors/       # Interceptors
│   │   ├── 📁 pipes/              # Validation pipes
│   │   ├── 📁 middleware/         # Middlewares
│   │   └── 📁 constants/          # Constantes
│   │
│   ├── 📁 config/                 # Configurações
│   │   ├── 📄 database.config.ts  # Config do banco
│   │   ├── 📄 redis.config.ts     # Config do Redis
│   │   ├── 📄 jwt.config.ts       # Config JWT
│   │   └── 📄 app.config.ts       # Config geral
│   │
│   ├── 📁 database/               # Database setup
│   │   ├── 📁 migrations/         # Prisma migrations
│   │   ├── 📁 seeds/              # Database seeds
│   │   └── 📄 schema.prisma       # Prisma schema
│   │
│   ├── 📁 jobs/                   # Background jobs
│   │   ├── 📁 processors/         # Job processors
│   │   └── 📁 queues/             # Queue definitions
│   │
│   ├── 📄 app.module.ts           # Módulo principal
│   ├── 📄 main.ts                 # Bootstrap da aplicação
│   └── 📄 app.controller.ts       # Health check
│
├── 📁 test/                       # Testes
│   ├── 📁 unit/                   # Testes unitários
│   ├── 📁 integration/            # Testes de integração
│   └── 📁 e2e/                    # Testes end-to-end
│
├── 📄 package.json                # Dependências
├── 📄 tsconfig.json               # Config TypeScript
├── 📄 nest-cli.json               # Config NestJS
├── 📄 .env                        # Variáveis de ambiente
├── 📄 .env.example                # Template de variáveis
└── 📄 Dockerfile                  # Container Docker
```

### Frontend - Estrutura Next.js

```
frontend/
├── 📁 src/
│   ├── 📁 app/                    # App Router (Next.js 14+)
│   │   ├── 📁 (auth)/             # Grupo de rotas de auth
│   │   │   ├── 📁 login/          # Página de login
│   │   │   ├── 📁 register/       # Página de registro
│   │   │   └── 📄 layout.tsx      # Layout de auth
│   │   │
│   │   ├── 📁 (dashboard)/        # Grupo de rotas do dashboard
│   │   │   ├── 📁 dashboard/      # Dashboard principal
│   │   │   ├── 📁 transactions/   # Gestão de transações
│   │   │   ├── 📁 accounts/       # Contas bancárias
│   │   │   ├── 📁 investments/    # Investimentos
│   │   │   ├── 📁 goals/          # Metas financeiras
│   │   │   ├── 📁 reports/        # Relatórios
│   │   │   ├── 📁 settings/       # Configurações
│   │   │   └── 📄 layout.tsx      # Layout do dashboard
│   │   │
│   │   ├── 📁 api/                # API Routes
│   │   │   ├── 📁 auth/           # Endpoints de auth
│   │   │   └── 📁 webhooks/       # Webhooks
│   │   │
│   │   ├── 📄 layout.tsx          # Root layout
│   │   ├── 📄 page.tsx            # Homepage
│   │   ├── 📄 loading.tsx         # Loading UI
│   │   ├── 📄 error.tsx           # Error UI
│   │   └── 📄 not-found.tsx       # 404 page
│   │
│   ├── 📁 components/             # Componentes React
│   │   ├── 📁 ui/                 # Componentes base (Shadcn/ui)
│   │   │   ├── 📄 button.tsx      # Botão
│   │   │   ├── 📄 input.tsx       # Input
│   │   │   ├── 📄 card.tsx        # Card
│   │   │   ├── 📄 dialog.tsx      # Modal
│   │   │   └── 📄 ...             # Outros componentes UI
│   │   │
│   │   ├── 📁 layout/             # Componentes de layout
│   │   │   ├── 📄 sidebar.tsx     # Sidebar principal
│   │   │   ├── 📄 header.tsx      # Header
│   │   │   ├── 📄 footer.tsx      # Footer
│   │   │   └── 📄 navigation.tsx  # Navegação
│   │   │
│   │   ├── 📁 forms/              # Formulários
│   │   │   ├── 📄 transaction-form.tsx
│   │   │   ├── 📄 goal-form.tsx
│   │   │   └── 📄 account-form.tsx
│   │   │
│   │   ├── 📁 charts/             # Gráficos e visualizações
│   │   │   ├── 📄 expense-chart.tsx
│   │   │   ├── 📄 portfolio-chart.tsx
│   │   │   └── 📄 trend-chart.tsx
│   │   │
│   │   └── 📁 features/           # Componentes por feature
│   │       ├── 📁 dashboard/      # Componentes do dashboard
│   │       ├── 📁 transactions/   # Componentes de transações
│   │       ├── 📁 investments/    # Componentes de investimentos
│   │       └── 📁 goals/          # Componentes de metas
│   │
│   ├── 📁 lib/                    # Utilitários e configurações
│   │   ├── 📄 api.ts              # Cliente API (axios/fetch)
│   │   ├── 📄 auth.ts             # Configuração NextAuth
│   │   ├── 📄 utils.ts            # Utilitários gerais
│   │   ├── 📄 validations.ts      # Schemas Zod
│   │   └── 📄 constants.ts        # Constantes
│   │
│   ├── 📁 hooks/                  # Custom hooks
│   │   ├── 📄 use-auth.ts         # Hook de autenticação
│   │   ├── 📄 use-transactions.ts # Hook de transações
│   │   ├── 📄 use-investments.ts  # Hook de investimentos
│   │   └── 📄 use-debounce.ts     # Hook de debounce
│   │
│   ├── 📁 store/                  # Estado global (Zustand)
│   │   ├── 📄 auth-store.ts       # Store de autenticação
│   │   ├── 📄 ui-store.ts         # Store de UI
│   │   └── 📄 data-store.ts       # Store de dados
│   │
│   ├── 📁 types/                  # Tipos TypeScript
│   │   ├── 📄 auth.ts             # Tipos de autenticação
│   │   ├── 📄 transaction.ts      # Tipos de transação
│   │   ├── 📄 investment.ts       # Tipos de investimento
│   │   └── 📄 api.ts              # Tipos de API
│   │
│   └── 📁 styles/                 # Estilos
│       ├── 📄 globals.css         # Estilos globais
│       └── 📄 components.css      # Estilos de componentes
│
├── 📁 public/                     # Assets estáticos
│   ├── 📁 icons/                  # Ícones
│   ├── 📁 images/                 # Imagens
│   └── 📄 favicon.ico             # Favicon
│
├── 📄 package.json                # Dependências
├── 📄 tsconfig.json               # Config TypeScript
├── 📄 tailwind.config.js          # Config TailwindCSS
├── 📄 next.config.js              # Config Next.js
├── 📄 .env.local                  # Variáveis de ambiente
└── 📄 Dockerfile                  # Container Docker
```

## Design da Interface - Sidebar

Baseado na imagem fornecida, o sidebar terá a seguinte estrutura:

### Componente Sidebar

```typescript
// components/layout/sidebar.tsx
interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType;
  href?: string;
  children?: SidebarItem[];
  isActive?: boolean;
  isExpanded?: boolean;
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'user-profile',
    label: 'Enivander Junior',
    icon: UserIcon,
    href: '/profile'
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: DashboardIcon,
    href: '/dashboard',
    isActive: true
  },
  {
    id: 'transactions',
    label: 'Transações',
    icon: TransactionIcon,
    children: [
      { id: 'income', label: 'Receitas', href: '/transactions/income' },
      { id: 'expenses', label: 'Despesas', href: '/transactions/expenses' },
      { id: 'transfers', label: 'Transferências', href: '/transactions/transfers' }
    ]
  },
  {
    id: 'accounts',
    label: 'Contas',
    icon: AccountIcon,
    children: [
      { id: 'bank-accounts', label: 'Contas Bancárias', href: '/accounts/banks' },
      { id: 'credit-cards', label: 'Cartões de Crédito', href: '/accounts/cards' }
    ]
  },
  {
    id: 'investments',
    label: 'Investimentos',
    icon: InvestmentIcon,
    isExpanded: true,
    children: [
      { id: 'portfolio', label: 'Carteira', href: '/investments/portfolio' },
      { id: 'stocks', label: 'Ações', href: '/investments/stocks' },
      { id: 'funds', label: 'Fundos', href: '/investments/funds' }
    ]
  },
  {
    id: 'goals',
    label: 'Metas',
    icon: GoalIcon,
    href: '/goals'
  },
  {
    id: 'reports',
    label: 'Relatórios',
    icon: ReportIcon,
    children: [
      { id: 'monthly', label: 'Mensal', href: '/reports/monthly' },
      { id: 'annual', label: 'Anual', href: '/reports/annual' },
      { id: 'custom', label: 'Personalizado', href: '/reports/custom' }
    ]
  },
  {
    id: 'settings',
    label: 'Configurações',
    icon: SettingsIcon,
    children: [
      { id: 'profile', label: 'Perfil', href: '/settings/profile' },
      { id: 'security', label: 'Segurança', href: '/settings/security' },
      { id: 'notifications', label: 'Notificações', href: '/settings/notifications' }
    ]
  }
];
```

### Estrutura Visual do Sidebar

```
┌─────────────────────────────┐
│ 👤 Enivander Junior         │ ← Perfil do usuário
├─────────────────────────────┤
│ 📊 Dashboard               │ ← Item ativo (destacado)
├─────────────────────────────┤
│ 💰 Transações          ▼   │ ← Item expansível
│   ├ 📈 Receitas            │
│   ├ 📉 Despesas            │
│   └ 🔄 Transferências      │
├─────────────────────────────┤
│ 🏦 Contas              ▼   │
│   ├ 🏛️ Contas Bancárias    │
│   └ 💳 Cartões de Crédito  │
├─────────────────────────────┤
│ 📈 Investimentos       ▲   │ ← Expandido (como na imagem)
│   ├ 💼 Carteira            │
│   ├ 📊 Ações               │
│   └ 🏢 Fundos              │
├─────────────────────────────┤
│ 🎯 Metas                   │
├─────────────────────────────┤
│ 📋 Relatórios          ▼   │
├─────────────────────────────┤
│ ⚙️ Configurações       ▼   │
└─────────────────────────────┘
```

### Cores e Estilo (TailwindCSS)

```css
/* Sidebar principal */
.sidebar {
  @apply bg-green-50 border-r border-green-200 w-64 h-screen overflow-y-auto;
}

/* Item ativo (Dashboard) */
.sidebar-item-active {
  @apply bg-green-200 text-green-800 border-l-4 border-green-600;
}

/* Items normais */
.sidebar-item {
  @apply text-gray-700 hover:bg-green-100 px-4 py-3 flex items-center;
}

/* Subitems */
.sidebar-subitem {
  @apply text-gray-600 hover:bg-green-50 pl-8 py-2 text-sm;
}

/* Ícones */
.sidebar-icon {
  @apply w-5 h-5 mr-3 text-gray-500;
}
```

Agora vou continuar com os outros componentes da arquitetura...

## Componentes e Interfaces

### Arquitetura Backend (NestJS)

#### Módulos Principais

**AuthModule**
```typescript
// Responsável por autenticação, autorização e segurança
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '24h' }
      }),
      inject: [ConfigService]
    }),
    PassportModule
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, LocalStrategy],
  exports: [AuthService]
})
```

**TransactionsModule**
```typescript
// Gestão completa de transações financeiras
@Module({
  imports: [PrismaModule, CacheModule, QueueModule],
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    CategoryService,
    MLCategorizationService,
    DuplicateDetectionService
  ],
  exports: [TransactionsService]
})
```

**InvestmentsModule**
```typescript
// Gestão de carteira e cotações
@Module({
  imports: [PrismaModule, HttpModule, CacheModule],
  controllers: [InvestmentsController],
  providers: [
    InvestmentsService,
    QuotesService,
    PortfolioAnalysisService,
    RiskCalculationService
  ],
  exports: [InvestmentsService]
})
```

#### Services Principais

**TransactionsService**
```typescript
@Injectable()
export class TransactionsService {
  async createTransaction(dto: CreateTransactionDto, userId: string): Promise<Transaction>
  async findAllByUser(userId: string, filters: TransactionFilters): Promise<PaginatedTransactions>
  async updateTransaction(id: string, dto: UpdateTransactionDto): Promise<Transaction>
  async deleteTransaction(id: string): Promise<void>
  async categorizeWithML(description: string, amount: number): Promise<Category>
  async detectDuplicates(transaction: Transaction): Promise<Transaction[]>
  async importFromCSV(file: Buffer, userId: string): Promise<ImportResult>
}
```

**InvestmentsService**
```typescript
@Injectable()
export class InvestmentsService {
  async addInvestment(dto: CreateInvestmentDto, userId: string): Promise<Investment>
  async getPortfolio(userId: string): Promise<Portfolio>
  async updateQuotes(): Promise<void>
  async calculatePerformance(userId: string): Promise<PerformanceMetrics>
  async suggestRebalancing(userId: string): Promise<RebalancingStrategy>
  async analyzeRisk(userId: string): Promise<RiskAnalysis>
}
```

### Arquitetura Frontend (Next.js)

#### Componentes de Layout

**DashboardLayout**
```typescript
interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

**Sidebar Component**
```typescript
export function Sidebar() {
  const [expandedItems, setExpandedItems] = useState<string[]>(['investments']);
  const pathname = usePathname();

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  return (
    <aside className="w-64 bg-green-50 border-r border-green-200 overflow-y-auto">
      <div className="p-4">
        <UserProfile />
      </div>
      <nav className="mt-4">
        {sidebarItems.map(item => (
          <SidebarItem 
            key={item.id}
            item={item}
            isActive={pathname === item.href}
            isExpanded={expandedItems.includes(item.id)}
            onToggle={() => toggleExpanded(item.id)}
          />
        ))}
      </nav>
    </aside>
  );
}
```

#### Componentes de Funcionalidade

**TransactionForm**
```typescript
interface TransactionFormProps {
  initialData?: Transaction;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  onCancel: () => void;
}

export function TransactionForm({ initialData, onSubmit, onCancel }: TransactionFormProps) {
  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: initialData || {
      type: 'expense',
      amount: 0,
      description: '',
      categoryId: '',
      date: new Date()
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField name="type" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Receita</SelectItem>
                <SelectItem value="expense">Despesa</SelectItem>
                <SelectItem value="transfer">Transferência</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )} />
        {/* Outros campos... */}
      </form>
    </Form>
  );
}
```

**InvestmentChart**
```typescript
interface InvestmentChartProps {
  data: PortfolioData[];
  timeRange: '1M' | '3M' | '6M' | '1Y' | 'ALL';
  onTimeRangeChange: (range: string) => void;
}

export function InvestmentChart({ data, timeRange, onTimeRangeChange }: InvestmentChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance da Carteira</CardTitle>
        <div className="flex space-x-2">
          {['1M', '3M', '6M', '1Y', 'ALL'].map(range => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => onTimeRangeChange(range)}
            >
              {range}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

## Modelos de Dados

### Schema Prisma

```prisma
// database/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                String    @id @default(cuid())
  email             String    @unique
  name              String?
  avatar            String?
  emailVerified     DateTime?
  password          String?
  twoFactorEnabled  Boolean   @default(false)
  twoFactorSecret   String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  // Relacionamentos
  accounts          Account[]
  transactions      Transaction[]
  investments       Investment[]
  goals             Goal[]
  notifications     Notification[]
  sessions          Session[]

  @@map("users")
}

model Account {
  id                String    @id @default(cuid())
  userId            String
  type              String    // 'checking', 'savings', 'credit_card', 'investment'
  provider          String?   // 'plaid', 'truelayer', 'manual'
  providerAccountId String?
  name              String
  balance           Decimal   @db.Decimal(15, 2)
  currency          String    @default("BRL")
  isActive          Boolean   @default(true)
  lastSyncAt        DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  // Relacionamentos
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions      Transaction[]

  @@map("accounts")
}

model Category {
  id          String    @id @default(cuid())
  name        String
  icon        String?
  color       String?
  parentId    String?
  isSystem    Boolean   @default(false)
  createdAt   DateTime  @default(now())

  // Relacionamentos
  parent      Category? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryHierarchy")
  transactions Transaction[]

  @@map("categories")
}

model Transaction {
  id              String    @id @default(cuid())
  userId          String
  accountId       String?
  categoryId      String?
  type            String    // 'income', 'expense', 'transfer'
  amount          Decimal   @db.Decimal(15, 2)
  description     String
  date            DateTime
  location        String?
  tags            String[]
  isRecurring     Boolean   @default(false)
  recurringRule   Json?
  attachments     String[]
  metadata        Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relacionamentos
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  account         Account?  @relation(fields: [accountId], references: [id])
  category        Category? @relation(fields: [categoryId], references: [id])

  @@map("transactions")
}

model Investment {
  id              String    @id @default(cuid())
  userId          String
  symbol          String
  name            String
  type            String    // 'stock', 'fund', 'etf', 'crypto', 'bond'
  quantity        Decimal   @db.Decimal(15, 8)
  averagePrice    Decimal   @db.Decimal(15, 2)
  currentPrice    Decimal?  @db.Decimal(15, 2)
  currency        String    @default("BRL")
  broker          String?
  sector          String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relacionamentos
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions    InvestmentTransaction[]

  @@map("investments")
}

model InvestmentTransaction {
  id            String    @id @default(cuid())
  investmentId  String
  type          String    // 'buy', 'sell', 'dividend'
  quantity      Decimal   @db.Decimal(15, 8)
  price         Decimal   @db.Decimal(15, 2)
  fees          Decimal?  @db.Decimal(15, 2)
  date          DateTime
  createdAt     DateTime  @default(now())

  // Relacionamentos
  investment    Investment @relation(fields: [investmentId], references: [id], onDelete: Cascade)

  @@map("investment_transactions")
}

model Goal {
  id            String    @id @default(cuid())
  userId        String
  name          String
  description   String?
  type          String    // 'savings', 'spending_limit', 'investment'
  targetAmount  Decimal   @db.Decimal(15, 2)
  currentAmount Decimal   @default(0) @db.Decimal(15, 2)
  targetDate    DateTime?
  categoryId    String?
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relacionamentos
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("goals")
}

model Notification {
  id          String    @id @default(cuid())
  userId      String
  title       String
  message     String
  type        String    // 'info', 'warning', 'success', 'error'
  isRead      Boolean   @default(false)
  actionUrl   String?
  metadata    Json?
  createdAt   DateTime  @default(now())

  // Relacionamentos
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notifications")
}

model Session {
  id          String    @id @default(cuid())
  userId      String
  token       String    @unique
  deviceInfo  Json?
  ipAddress   String?
  isActive    Boolean   @default(true)
  expiresAt   DateTime
  createdAt   DateTime  @default(now())

  // Relacionamentos
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}
```

### DTOs e Validações

**Transaction DTOs**
```typescript
// dto/create-transaction.dto.ts
export class CreateTransactionDto {
  @IsEnum(['income', 'expense', 'transfer'])
  type: 'income' | 'expense' | 'transfer';

  @IsDecimal({ decimal_digits: '2' })
  @Min(0.01)
  amount: number;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  description: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsUUID()
  accountId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;
}
```

**Investment DTOs**
```typescript
// dto/create-investment.dto.ts
export class CreateInvestmentDto {
  @IsString()
  @MinLength(1)
  symbol: string;

  @IsString()
  @MinLength(1)
  name: string;

  @IsEnum(['stock', 'fund', 'etf', 'crypto', 'bond'])
  type: 'stock' | 'fund' | 'etf' | 'crypto' | 'bond';

  @IsDecimal({ decimal_digits: '8' })
  @Min(0.00000001)
  quantity: number;

  @IsDecimal({ decimal_digits: '2' })
  @Min(0.01)
  averagePrice: number;

  @IsOptional()
  @IsString()
  broker?: string;

  @IsOptional()
  @IsString()
  sector?: string;
}
```

## Análise de Critérios de Aceitação

Agora vou usar a ferramenta de prework para analisar os critérios de aceitação dos requisitos antes de escrever as propriedades de correção:
## Propriedades de Correção

*Uma propriedade é uma característica ou comportamento que deve ser verdadeiro em todas as execuções válidas de um sistema - essencialmente, uma declaração formal sobre o que o sistema deve fazer. As propriedades servem como ponte entre especificações legíveis por humanos e garantias de correção verificáveis por máquina.*

### Propriedades de Autenticação e Segurança

**Propriedade 1: Validação de Senha Forte**
*Para qualquer* senha fornecida durante o registro, se ela atender aos critérios de força (8+ caracteres, maiúscula, minúscula, número, símbolo), então o sistema deve aceitar e enviar email de verificação
**Valida: Requisitos 1.1**

**Propriedade 2: Geração Consistente de JWT**
*Para qualquer* credencial válida fornecida no login, o sistema deve sempre gerar um JWT válido, refresh token e registrar metadados do dispositivo
**Valida: Requisitos 1.2**

**Propriedade 3: Suporte OAuth Universal**
*Para qualquer* provedor OAuth suportado (Google, Apple, Microsoft, Facebook), o sistema deve mapear corretamente os dados do usuário e criar/vincular conta
**Valida: Requisitos 1.3**

**Propriedade 4: Disponibilidade de Opções 2FA**
*Para qualquer* usuário que ativa 2FA, o sistema deve disponibilizar todas as opções (TOTP, SMS, email, backup codes)
**Valida: Requisitos 1.4**

**Propriedade 5: Proteção Contra Ataques**
*Para qualquer* sequência de tentativas de login suspeitas, o sistema deve ativar medidas de proteção (CAPTCHA, bloqueio, notificação)
**Valida: Requisitos 1.5**

### Propriedades de Gestão de Transações

**Propriedade 6: Captura Completa de Dados**
*Para qualquer* transação válida adicionada, o sistema deve capturar todos os campos obrigatórios (data, valor, categoria, descrição) e opcionais disponíveis
**Valida: Requisitos 2.1**

**Propriedade 7: Sugestão Inteligente de Categoria**
*Para qualquer* transação inserida com descrição, o sistema deve sugerir uma categoria baseada no histórico do usuário usando IA
**Valida: Requisitos 2.2**

**Propriedade 8: Filtros Funcionais**
*Para qualquer* combinação de filtros aplicados na listagem de transações, o sistema deve retornar apenas resultados que atendem a todos os critérios
**Valida: Requisitos 2.3**

**Propriedade 9: Versionamento de Edições**
*Para qualquer* transação editada, o sistema deve criar uma nova versão mantendo timestamp, usuário e dados anteriores
**Valida: Requisitos 2.4**

**Propriedade 10: Criação Automática de Recorrências**
*Para qualquer* transação marcada como recorrente, o sistema deve criar automaticamente novas instâncias baseado no padrão definido
**Valida: Requisitos 2.5**

### Propriedades de Dashboard e Visualização

**Propriedade 11: Completude do Dashboard**
*Para qualquer* usuário que acessa o dashboard, o sistema deve exibir todos os cards essenciais (saldo, receitas, despesas, investimentos, metas) com dados atualizados
**Valida: Requisitos 3.1**

**Propriedade 12: Geração de Gráficos**
*Para qualquer* conjunto de dados históricos válidos, o sistema deve gerar gráficos interativos nos formatos suportados (linha, barra, pizza, área)
**Valida: Requisitos 3.2**

**Propriedade 13: Previsões Baseadas em IA**
*Para qualquer* usuário com histórico suficiente, o sistema deve gerar previsões de gastos futuros usando algoritmos de time series
**Valida: Requisitos 3.3**

### Propriedades de Open Banking

**Propriedade 14: Suporte Multi-Provedor**
*Para qualquer* provedor Open Banking suportado (Plaid, TrueLayer, Pluggy, Belvo), o sistema deve permitir conexão segura e autenticação
**Valida: Requisitos 4.1**

**Propriedade 15: Sincronização Automática**
*Para qualquer* conta conectada, o sistema deve executar sincronização a cada 2 horas com retry automático em caso de falha
**Valida: Requisitos 4.2**

**Propriedade 16: Deduplicação Inteligente**
*Para qualquer* conjunto de transações importadas, o sistema deve detectar e tratar duplicatas baseado em múltiplos critérios
**Valida: Requisitos 4.3**

### Propriedades de Investimentos

**Propriedade 17: Suporte Multi-Ativo**
*Para qualquer* tipo de investimento suportado (ações, fundos, ETFs, criptomoedas, renda fixa, derivativos), o sistema deve permitir adição e gestão
**Valida: Requisitos 5.1**

**Propriedade 18: Atualização de Cotações com Fallback**
*Para qualquer* ativo com cotação disponível, o sistema deve atualizar preços via APIs múltiplas com fallback automático
**Valida: Requisitos 5.2**

**Propriedade 19: Cálculos de Venda Precisos**
*Para qualquer* investimento vendido, o sistema deve calcular corretamente ganho/perda, IR devido e atualizar posição mantendo histórico
**Valida: Requisitos 5.3**

### Propriedades de Metas e Planejamento

**Propriedade 20: Suporte Multi-Tipo de Meta**
*Para qualquer* tipo de meta suportado (economia, limite de gastos, investimento, quitação de dívida), o sistema deve permitir criação e acompanhamento
**Valida: Requisitos 6.1**

**Propriedade 21: Cálculos de Meta de Economia**
*Para qualquer* meta de economia criada, o sistema deve calcular valor mensal necessário e sugerir ajustes baseados no prazo e valor alvo
**Valida: Requisitos 6.2**

**Propriedade 22: Gamificação Baseada em Progresso**
*Para qualquer* progresso em metas, o sistema deve aplicar elementos de gamificação (badges, streaks, rankings) de forma consistente
**Valida: Requisitos 6.3**

### Propriedades de Notificações Inteligentes

**Propriedade 23: Detecção de Anomalias**
*Para qualquer* padrão de transação anômalo detectado pelo ML, o sistema deve gerar alerta imediato para o usuário
**Valida: Requisitos 7.1**

**Propriedade 24: Monitoramento de Risco de Metas**
*Para qualquer* meta em risco de não ser atingida, o sistema deve calcular probabilidade e sugerir ações corretivas
**Valida: Requisitos 7.2**

### Propriedades de Relatórios

**Propriedade 25: Geração Completa de Relatórios**
*Para qualquer* solicitação de relatório, o sistema deve gerar arquivo no formato correto (PDF/Excel) com gráficos e análises automáticas
**Valida: Requisitos 8.1**

**Propriedade 26: Disponibilidade de Templates**
*Para qualquer* template pré-definido (DRE, fluxo de caixa, IR, balanço), o sistema deve gerar relatório com estrutura e dados corretos
**Valida: Requisitos 8.2**

### Propriedades Mobile

**Propriedade 27: Funcionalidade Cross-Platform**
*Para qualquer* funcionalidade disponível no web, o sistema deve oferecer equivalente no app mobile (iOS/Android) com sincronização em tempo real
**Valida: Requisitos 9.1**

**Propriedade 28: Modo Offline Funcional**
*Para qualquer* operação suportada offline, o sistema deve permitir visualização e entrada de dados com sincronização automática quando online
**Valida: Requisitos 9.2**

### Propriedades de Segurança

**Propriedade 29: Segurança de Transmissão**
*Para qualquer* dado transmitido, o sistema deve usar TLS 1.3, certificate pinning e HSTS
**Valida: Requisitos 10.1**

**Propriedade 30: Criptografia Adequada**
*Para qualquer* dado armazenado ou transmitido, o sistema deve usar algoritmos de criptografia apropriados (AES-256 para repouso, ChaCha20 para streaming)
**Valida: Requisitos 10.2**

### Propriedades de IA/ML

**Propriedade 31: Precisão de Categorização**
*Para qualquer* transação categorizada automaticamente, o sistema deve atingir precisão de 95% ou superior usando NLP
**Valida: Requisitos 11.1**

**Propriedade 32: Previsões Time Series**
*Para qualquer* usuário com dados históricos suficientes, o sistema deve gerar previsões de gastos e receitas usando técnicas de time series forecasting
**Valida: Requisitos 11.2**

### Propriedades de Integrações

**Propriedade 33: Integrações E-commerce**
*Para qualquer* plataforma de e-commerce suportada (Amazon, Mercado Livre), o sistema deve sincronizar dados de gastos corretamente
**Valida: Requisitos 12.1**

**Propriedade 34: API Pública com Rate Limiting**
*Para qualquer* endpoint da API pública, o sistema deve aplicar rate limiting e retornar respostas consistentes para desenvolvedores externos
**Valida: Requisitos 12.2**

## Tratamento de Erros

### Estratégias de Error Handling

**Backend (NestJS)**
```typescript
// Global Exception Filter
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'string' 
        ? exceptionResponse 
        : (exceptionResponse as any).message;
      code = (exceptionResponse as any).code || 'HTTP_ERROR';
    } else if (exception instanceof PrismaClientKnownRequestError) {
      // Handle Prisma errors
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = 'Duplicate entry';
          code = 'DUPLICATE_ENTRY';
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Record not found';
          code = 'NOT_FOUND';
          break;
      }
    }

    // Log error
    this.logger.error({
      message,
      code,
      status,
      path: request.url,
      method: request.method,
      userId: request.user?.id,
      timestamp: new Date().toISOString(),
      stack: exception instanceof Error ? exception.stack : undefined
    });

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        timestamp: new Date().toISOString(),
        path: request.url
      }
    });
  }
}
```

**Frontend (Next.js)**
```typescript
// Error Boundary
export class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ComponentType<{ error: Error }> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to monitoring service
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Send to Sentry or similar
    if (typeof window !== 'undefined') {
      // Client-side error reporting
    }
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }

    return this.props.children;
  }
}

// API Error Handler
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.error?.code || 'UNKNOWN_ERROR',
      errorData.error?.message || 'An error occurred',
      errorData.error?.details
    );
  }
  
  return response.json();
}
```

### Códigos de Erro Padronizados

```typescript
export enum ErrorCodes {
  // Authentication
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Business Logic
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  DUPLICATE_TRANSACTION = 'DUPLICATE_TRANSACTION',
  GOAL_NOT_ACHIEVABLE = 'GOAL_NOT_ACHIEVABLE',
  
  // External Services
  BANK_CONNECTION_FAILED = 'BANK_CONNECTION_FAILED',
  QUOTE_SERVICE_UNAVAILABLE = 'QUOTE_SERVICE_UNAVAILABLE',
  
  // System
  DATABASE_ERROR = 'DATABASE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
}
```

## Estratégia de Testes

### Abordagem Dual de Testes

A plataforma utilizará uma abordagem dual combinando testes unitários e testes baseados em propriedades:

- **Testes Unitários**: Verificam exemplos específicos, casos extremos e condições de erro
- **Testes de Propriedade**: Verificam propriedades universais em todas as entradas
- Ambos são complementares e necessários para cobertura abrangente

### Configuração de Testes Baseados em Propriedades

**Backend (NestJS + fast-check)**
```typescript
// Configuração mínima de 100 iterações por teste de propriedade
import fc from 'fast-check';

describe('TransactionService Property Tests', () => {
  it('should maintain balance consistency after any valid transaction', () => {
    fc.assert(
      fc.property(
        fc.record({
          type: fc.constantFrom('income', 'expense', 'transfer'),
          amount: fc.float({ min: 0.01, max: 10000 }),
          accountId: fc.uuid(),
          description: fc.string({ minLength: 1, maxLength: 255 })
        }),
        async (transactionData) => {
          const initialBalance = await accountService.getBalance(transactionData.accountId);
          await transactionService.createTransaction(transactionData, userId);
          const finalBalance = await accountService.getBalance(transactionData.accountId);
          
          const expectedChange = transactionData.type === 'income' 
            ? transactionData.amount 
            : -transactionData.amount;
          
          expect(finalBalance).toBeCloseTo(initialBalance + expectedChange, 2);
        }
      ),
      { numRuns: 100 } // Mínimo 100 iterações
    );
  });
});
```

**Frontend (Next.js + fast-check)**
```typescript
describe('Investment Chart Property Tests', () => {
  it('should render valid chart for any portfolio data', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          date: fc.date(),
          value: fc.float({ min: 0, max: 1000000 }),
          symbol: fc.string({ minLength: 1, maxLength: 10 })
        }), { minLength: 1, maxLength: 100 }),
        (portfolioData) => {
          const { container } = render(
            <InvestmentChart data={portfolioData} timeRange="1M" onTimeRangeChange={() => {}} />
          );
          
          // Verifica se o gráfico foi renderizado
          expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
          
          // Verifica se todos os pontos de dados estão presentes
          const dataPoints = container.querySelectorAll('.recharts-line-dot');
          expect(dataPoints.length).toBe(portfolioData.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Tags de Teste para Propriedades

Cada teste de propriedade deve ser tagueado com referência à propriedade do documento de design:

```typescript
// Exemplo de tag
it('Property 7: Intelligent Category Suggestion - Feature: plataforma-financeira, Property 7: Para qualquer transação inserida com descrição, o sistema deve sugerir uma categoria baseada no histórico do usuário usando IA', () => {
  // Teste da propriedade
});
```

### Balanceamento de Testes

- **Testes Unitários**: Focam em exemplos específicos e casos extremos
- **Testes de Propriedade**: Cobrem propriedades universais com muitas entradas
- **Testes de Integração**: Verificam pontos de integração entre componentes
- **Testes E2E**: Validam fluxos completos do usuário

Evitar muitos testes unitários - testes baseados em propriedades lidam com cobertura ampla de entradas automaticamente.