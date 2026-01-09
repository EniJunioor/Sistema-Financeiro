# Guia de Desenvolvimento

## Configuração do Ambiente

### Pré-requisitos

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Docker** e **Docker Compose** ([Download](https://www.docker.com/))
- **Git** ([Download](https://git-scm.com/))
- **VS Code** (recomendado) com extensões:
  - TypeScript
  - Prisma
  - ESLint
  - Prettier
  - Docker

### Primeira Configuração

1. **Clone e configure o projeto**
   ```bash
   git clone <repository-url>
   cd plataforma-financeira
   npm install
   ```

2. **Execute o script de setup**
   ```bash
   # Linux/Mac
   ./scripts/setup.sh
   
   # Windows PowerShell
   .\scripts\setup.ps1
   ```

3. **Inicie o desenvolvimento**
   ```bash
   npm run dev
   ```

## Estrutura do Código

### Backend (NestJS)

#### Criando um novo módulo
```bash
cd backend
npx nest generate module modules/exemplo
npx nest generate controller modules/exemplo/controllers/exemplo
npx nest generate service modules/exemplo/services/exemplo
```

#### Padrões de código
- Use **DTOs** para validação de entrada
- Implemente **Guards** para autorização
- Use **Interceptors** para transformação de resposta
- Aplique **Pipes** para validação e transformação

#### Exemplo de Controller
```typescript
@Controller('exemplo')
@UseGuards(JwtAuthGuard)
export class ExemploController {
  constructor(private readonly exemploService: ExemploService) {}

  @Get()
  @ApiOperation({ summary: 'Listar exemplos' })
  async findAll(@Query() query: FindAllExemploDto) {
    return this.exemploService.findAll(query);
  }
}
```

### Frontend (Next.js)

#### Estrutura de componentes
```
components/
├── ui/           # Componentes base (Shadcn/ui)
├── layout/       # Componentes de layout
├── forms/        # Formulários
├── charts/       # Gráficos
└── features/     # Componentes por feature
```

#### Padrões de código
- Use **React Hook Form** + **Zod** para formulários
- Implemente **React Query** para cache de dados
- Use **Zustand** para estado global
- Aplique **TypeScript** rigorosamente

#### Exemplo de componente
```typescript
interface ExemploProps {
  data: ExemploData[];
  onUpdate: (id: string, data: Partial<ExemploData>) => void;
}

export function Exemplo({ data, onUpdate }: ExemploProps) {
  const { mutate } = useMutation({
    mutationFn: updateExemplo,
    onSuccess: () => queryClient.invalidateQueries(['exemplos']),
  });

  return (
    <Card>
      {/* Implementação do componente */}
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