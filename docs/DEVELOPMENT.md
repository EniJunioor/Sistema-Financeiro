# 🛠️ Guia de Desenvolvimento - Plataforma Financeira

## 🎯 Visão Geral

Este guia fornece instruções detalhadas para desenvolver na Plataforma Financeira, incluindo configuração do ambiente, padrões de código, workflows e melhores práticas.

## 🚀 Configuração do Ambiente

### Pré-requisitos

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Docker** e **Docker Compose** ([Download](https://www.docker.com/))
- **Git** ([Download](https://git-scm.com/))
- **VS Code** (recomendado) com extensões:
  - TypeScript and JavaScript Language Features
  - Prisma
  - ESLint
  - Prettier - Code formatter
  - Docker
  - GitLens
  - Thunder Client (para testar APIs)

### Primeira Configuração

1. **Clone e configure o projeto**
   ```bash
   git clone https://github.com/EniJunioor/Sistema-Financeiro.git
   cd Sistema-Financeiro
   npm install
   ```

2. **Configure variáveis de ambiente**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   
   # Frontend
   cp frontend/.env.local.example frontend/.env.local
   ```

3. **Execute o script de setup**
   ```bash
   # Linux/Mac
   ./scripts/setup.sh
   
   # Windows PowerShell
   .\scripts\setup.ps1
   ```

4. **Inicie os serviços**
   ```bash
   # Inicia PostgreSQL e Redis
   npm run docker:up
   
   # Executa migrations e seeds
   npm run db:migrate
   npm run db:seed
   
   # Inicia desenvolvimento
   npm run dev
   ```

### URLs de Acesso

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api/docs
- **Prisma Studio**: `npm run db:studio`

## 🏗️ Estrutura do Código

### Backend (NestJS)

#### Arquitetura de Módulos
```
backend/src/
├── modules/                    # Módulos de negócio
│   ├── auth/                  # Autenticação JWT + OAuth + 2FA
│   │   ├── controllers/       # AuthController, ProfileController
│   │   ├── services/          # AuthService, TwoFactorService
│   │   ├── guards/            # JwtGuard, RolesGuard
│   │   ├── strategies/        # JwtStrategy, GoogleStrategy
│   │   └── dto/               # LoginDto, RegisterDto
│   │
│   ├── accounts/              # Contas bancárias + Open Banking
│   │   ├── controllers/       # AccountsController
│   │   ├── services/          # AccountsService, OpenBankingService
│   │   └── providers/         # PlaidService, TrueLayerService
│   │
│   ├── transactions/          # Transações + IA + Deduplicação
│   │   ├── controllers/       # TransactionsController, DeduplicationController
│   │   ├── services/          # TransactionsService, MLCategorizationService
│   │   └── processors/        # RecurringTransactionsProcessor
│   │
│   ├── investments/           # Investimentos + Cotações
│   ├── goals/                 # Metas + Gamificação
│   ├── notifications/         # Notificações inteligentes
│   ├── reports/               # Relatórios + Analytics
│   └── ai/                    # Inteligência Artificial
│
├── common/                    # Código compartilhado
│   ├── decorators/            # @CurrentUser, @Public
│   ├── filters/               # GlobalExceptionFilter
│   ├── guards/                # JwtAuthGuard, RolesGuard
│   ├── interceptors/          # TransformInterceptor
│   ├── pipes/                 # ValidationPipe
│   └── prisma/                # PrismaService
│
├── config/                    # Configurações
│   ├── database.config.ts     # Config do PostgreSQL
│   ├── redis.config.ts        # Config do Redis
│   ├── jwt.config.ts          # Config JWT
│   └── app.config.ts          # Config geral
│
└── jobs/                      # Background jobs
    ├── processors/            # Job processors
    └── queues/                # Queue definitions
```

#### Criando um novo módulo
```bash
cd backend
npx nest generate module modules/exemplo
npx nest generate controller modules/exemplo/controllers/exemplo
npx nest generate service modules/exemplo/services/exemplo
```

#### Padrões de código Backend
- Use **DTOs** com class-validator para validação
- Implemente **Guards** para autorização
- Use **Interceptors** para transformação de resposta
- Aplique **Pipes** para validação e transformação
- Documente APIs com **Swagger/OpenAPI**
- Use **Prisma** para todas as operações de banco

#### Exemplo de Controller Completo
```typescript
@ApiTags('exemplo')
@Controller('exemplo')
@UseGuards(JwtAuthGuard)
export class ExemploController {
  constructor(private readonly exemploService: ExemploService) {}

  @Get()
  @ApiOperation({ summary: 'Listar exemplos' })
  @ApiResponse({ status: 200, description: 'Lista de exemplos' })
  async findAll(
    @Query() query: FindAllExemploDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.exemploService.findAll(userId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Criar exemplo' })
  @ApiResponse({ status: 201, description: 'Exemplo criado' })
  async create(
    @Body() createDto: CreateExemploDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.exemploService.create(userId, createDto);
  }
}
```

### Frontend (Next.js)

#### Arquitetura de Componentes
```
frontend/src/
├── app/                       # App Router (Next.js 14)
│   ├── (auth)/               # Grupo de rotas de autenticação
│   │   ├── login/            # Página de login
│   │   ├── register/         # Página de registro
│   │   └── layout.tsx        # Layout de auth
│   │
│   ├── (dashboard)/          # Grupo de rotas do dashboard
│   │   ├── dashboard/        # Dashboard principal
│   │   ├── accounts/         # Contas bancárias
│   │   ├── transactions/     # Transações
│   │   ├── investments/      # Investimentos
│   │   └── layout.tsx        # Layout do dashboard
│   │
│   └── api/                  # API Routes
│
├── components/               # Componentes React
│   ├── ui/                   # Componentes base (Shadcn/ui)
│   │   ├── button.tsx        # Botão
│   │   ├── card.tsx          # Card
│   │   ├── dialog.tsx        # Modal
│   │   └── ...               # Outros componentes UI
│   │
│   ├── layout/               # Componentes de layout
│   │   ├── sidebar.tsx       # Sidebar principal
│   │   ├── header.tsx        # Header
│   │   └── navigation.tsx    # Navegação
│   │
│   ├── accounts/             # Componentes de contas
│   │   ├── account-card.tsx  # Card de conta
│   │   ├── connect-dialog.tsx # Dialog de conexão
│   │   └── transactions-list.tsx # Lista de transações
│   │
│   ├── transactions/         # Componentes de transações
│   ├── dashboard/            # Componentes do dashboard
│   ├── charts/               # Gráficos e visualizações
│   └── forms/                # Formulários
│
├── lib/                      # Utilitários e configurações
│   ├── api.ts                # Cliente API base
│   ├── accounts-api.ts       # API de contas
│   ├── transactions-api.ts   # API de transações
│   ├── auth.ts               # Configuração NextAuth
│   ├── utils.ts              # Utilitários gerais
│   └── validations.ts        # Schemas Zod
│
├── hooks/                    # Custom hooks
│   ├── use-auth.ts           # Hook de autenticação
│   ├── use-accounts.ts       # Hook de contas
│   ├── use-transactions.ts   # Hook de transações
│   └── use-debounce.ts       # Hook de debounce
│
├── store/                    # Estado global (Zustand)
│   ├── auth-store.ts         # Store de autenticação
│   ├── ui-store.ts           # Store de UI
│   └── data-store.ts         # Store de dados
│
└── types/                    # Tipos TypeScript
    ├── auth.ts               # Tipos de autenticação
    ├── transaction.ts        # Tipos de transação
    ├── account.ts            # Tipos de conta
    └── api.ts                # Tipos de API
```

#### Padrões de código Frontend
- Use **React Hook Form** + **Zod** para formulários
- Implemente **React Query** para cache de dados
- Use **Zustand** para estado global
- Aplique **TypeScript** rigorosamente
- Use **Shadcn/ui** para componentes base
- Implemente **Error Boundaries** para tratamento de erros

#### Exemplo de componente com hooks
```typescript
interface ExemploProps {
  accountId: string;
}

export function Exemplo({ accountId }: ExemploProps) {
  const { data: account, isLoading, error } = useAccount(accountId);
  const updateMutation = useUpdateAccount();

  const handleUpdate = (data: UpdateAccountData) => {
    updateMutation.mutate({ accountId, data });
  };

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{account.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <AccountForm 
          account={account} 
          onSubmit={handleUpdate}
          isLoading={updateMutation.isPending}
        />
      </CardContent>
    </Card>
  );
}
```

## Banco de Dados

### Prisma Workflow

1. **Modificar schema**
   ```prisma
   // backend/prisma/schema.prisma
   model NovoModel {
     id        String   @id @default(cuid())
     name      String
     createdAt DateTime @default(now())
   }
   ```

2. **Gerar migration**
   ```bash
   cd backend
   npm run prisma:migrate
   ```

3. **Gerar client**
   ```bash
   npm run prisma:generate
   ```

### Convenções

- Use **camelCase** para campos
- Use **@map()** para nomes de tabela em snake_case
- Sempre inclua `createdAt` e `updatedAt`
- Use relacionamentos apropriados com `onDelete`

## Testes

### Backend (Jest)

```typescript
describe('ExemploService', () => {
  let service: ExemploService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ExemploService, PrismaService],
    }).compile();

    service = module.get<ExemploService>(ExemploService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create exemplo', async () => {
    const data = { name: 'Test' };
    const result = await service.create(data);
    expect(result.name).toBe(data.name);
  });
});
```

### Frontend (Jest + Testing Library)

```typescript
import { render, screen } from '@testing-library/react';
import { Exemplo } from './exemplo';

describe('Exemplo Component', () => {
  it('renders correctly', () => {
    render(<Exemplo data={[]} onUpdate={jest.fn()} />);
    expect(screen.getByText('Exemplo')).toBeInTheDocument();
  });
});
```

## Git Workflow

### Branches

- `main` - Produção
- `develop` - Desenvolvimento
- `feature/nome-da-feature` - Novas funcionalidades
- `fix/nome-do-bug` - Correções
- `hotfix/nome-do-hotfix` - Correções urgentes

### Commits

Use **Conventional Commits**:

```
feat: adiciona autenticação OAuth
fix: corrige validação de email
docs: atualiza README
style: formata código com prettier
refactor: reorganiza estrutura de pastas
test: adiciona testes para TransactionService
```

### Pull Requests

1. Crie branch a partir de `develop`
2. Implemente a funcionalidade
3. Escreva testes
4. Execute linting e testes
5. Abra PR para `develop`
6. Aguarde review e aprovação

## Debugging

### Backend

1. **VS Code Debug**
   - Configure launch.json
   - Use breakpoints
   - Inspecione variáveis

2. **Logs**
   ```typescript
   import { Logger } from '@nestjs/common';
   
   private readonly logger = new Logger(ExemploService.name);
   
   this.logger.debug('Debug message');
   this.logger.error('Error message', error.stack);
   ```

### Frontend

1. **React DevTools**
2. **Redux DevTools** (para Zustand)
3. **Network tab** para APIs
4. **Console logs**

## Performance

### Backend

- Use **Redis** para cache
- Implemente **pagination** em listagens
- Use **database indexes** apropriados
- Aplique **rate limiting**

### Frontend

- Use **React.memo** para componentes pesados
- Implemente **lazy loading** para rotas
- Use **React Query** para cache
- Otimize **bundle size**

## Segurança

### Backend

- Valide **todas as entradas**
- Use **JWT** com refresh tokens
- Implemente **rate limiting**
- Use **HTTPS** em produção
- Sanitize **SQL queries** (Prisma faz isso)

### Frontend

- Valide dados no **client e server**
- Use **HTTPS** sempre
- Implemente **CSP headers**
- Sanitize **user inputs**

## Deploy

### Desenvolvimento

```bash
npm run docker:up
npm run dev
```

### Produção

```bash
npm run build
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### Problemas Comuns

1. **Erro de conexão com banco**
   - Verifique se PostgreSQL está rodando
   - Confirme variáveis de ambiente

2. **Erro de CORS**
   - Configure origins no backend
   - Verifique URLs no frontend

3. **Erro de build**
   - Limpe node_modules e reinstale
   - Verifique versões do Node.js

### Comandos Úteis

```bash
# Limpar tudo e reinstalar
npm run clean && npm install

# Resetar banco de dados
npm run db:reset

# Ver logs do Docker
npm run docker:logs

# Verificar saúde da API
curl http://localhost:3001/api/v1/health
```