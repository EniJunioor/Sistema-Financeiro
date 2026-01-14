# Guia de Contribuição - Plataforma Financeira

## 🎯 Visão Geral

Obrigado por considerar contribuir para a Plataforma Financeira! Este documento fornece diretrizes e informações para contribuir efetivamente com o projeto.

## 📋 Índice

- [Como Contribuir](#como-contribuir)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Padrões de Código](#padrões-de-código)
- [Processo de Desenvolvimento](#processo-de-desenvolvimento)
- [Testes](#testes)
- [Documentação](#documentação)
- [Revisão de Código](#revisão-de-código)
- [Comunicação](#comunicação)

## 🚀 Como Contribuir

### Tipos de Contribuição

Aceitamos vários tipos de contribuição:

- **🐛 Correção de Bugs**: Correções para problemas identificados
- **✨ Novas Funcionalidades**: Implementação de recursos planejados
- **📚 Documentação**: Melhorias na documentação
- **🧪 Testes**: Adição ou melhoria de testes
- **🎨 UI/UX**: Melhorias na interface e experiência do usuário
- **⚡ Performance**: Otimizações de performance
- **🔒 Segurança**: Melhorias de segurança

### Antes de Começar

1. **Verifique Issues Existentes**: Procure por issues relacionadas ao que você quer trabalhar
2. **Discuta Grandes Mudanças**: Para mudanças significativas, abra uma issue para discussão primeiro
3. **Leia a Documentação**: Familiarize-se com a arquitetura e padrões do projeto

## 🛠️ Configuração do Ambiente

### Pré-requisitos

- **Node.js** 18+ 
- **npm** ou **yarn**
- **Docker** e **Docker Compose**
- **Git**
- **PostgreSQL** 15+ (via Docker)
- **Redis** 7+ (via Docker)

### Setup Inicial

1. **Fork e Clone**
```bash
# Fork o repositório no GitHub
git clone https://github.com/seu-usuario/plataforma-financeira.git
cd plataforma-financeira
```

2. **Instalar Dependências**
```bash
# Root do projeto
npm install

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Mobile (se aplicável)
cd ../mobile
npm install
```

3. **Configurar Ambiente**
```bash
# Copiar arquivos de exemplo
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# Editar variáveis conforme necessário
```

4. **Iniciar Serviços**
```bash
# Iniciar banco de dados e Redis
docker compose up -d postgres redis

# Configurar banco de dados
cd backend
npm run prisma:migrate
npm run prisma:seed
```

5. **Executar Aplicação**
```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 📝 Padrões de Código

### Linguagens e Frameworks

- **Backend**: TypeScript + NestJS + Prisma
- **Frontend**: TypeScript + Next.js + TailwindCSS
- **Mobile**: TypeScript + React Native + Expo

### Convenções de Nomenclatura

#### Arquivos e Pastas
```
kebab-case/
├── components/
│   ├── transaction-form.tsx
│   └── investment-chart.tsx
├── services/
│   ├── auth.service.ts
│   └── transactions.service.ts
└── utils/
    ├── date-helpers.ts
    └── currency-formatter.ts
```

#### Variáveis e Funções
```typescript
// camelCase para variáveis e funções
const userName = 'João Silva';
const calculateTotalBalance = (accounts: Account[]) => { ... };

// PascalCase para classes e componentes
class TransactionService { ... }
const TransactionForm = () => { ... };

// UPPER_SNAKE_CASE para constantes
const MAX_TRANSACTION_AMOUNT = 1000000;
const API_ENDPOINTS = { ... };
```

#### Interfaces e Types
```typescript
// PascalCase com prefixo I para interfaces
interface IUser {
  id: string;
  email: string;
}

// PascalCase para types
type TransactionType = 'income' | 'expense' | 'transfer';
type ApiResponse<T> = {
  success: boolean;
  data: T;
};
```

### Formatação de Código

#### ESLint e Prettier
```json
// .eslintrc.js
{
  "extends": [
    "@nestjs/eslint-config",
    "prettier"
  ],
  "rules": {
    "no-console": "warn",
    "prefer-const": "error",
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

#### Configuração Prettier
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### Estrutura de Imports
```typescript
// 1. Imports de bibliotecas externas
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/client';

// 2. Imports internos (módulos do projeto)
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionEntity } from './entities/transaction.entity';

// 3. Imports relativos
import './transaction.styles.css';
```

## 🔄 Processo de Desenvolvimento

### Git Workflow

#### Branches
```
main                    # Branch principal (produção)
├── develop            # Branch de desenvolvimento
├── feature/auth-2fa   # Funcionalidades
├── bugfix/login-error # Correções
├── hotfix/security    # Correções urgentes
└── release/v1.2.0     # Preparação de release
```

#### Conventional Commits
```bash
# Formato: tipo(escopo): descrição

# Tipos válidos:
feat(auth): adicionar autenticação 2FA
fix(transactions): corrigir cálculo de saldo
docs(readme): atualizar instruções de setup
style(ui): ajustar espaçamento dos cards
refactor(api): reorganizar estrutura de pastas
test(units): adicionar testes para TransactionService
chore(deps): atualizar dependências do projeto
```

#### Fluxo de Trabalho
1. **Criar Branch**
```bash
git checkout develop
git pull origin develop
git checkout -b feature/nova-funcionalidade
```

2. **Desenvolver e Commitar**
```bash
git add .
git commit -m "feat(transactions): adicionar filtro por categoria"
```

3. **Manter Atualizado**
```bash
git checkout develop
git pull origin develop
git checkout feature/nova-funcionalidade
git rebase develop
```

4. **Push e Pull Request**
```bash
git push origin feature/nova-funcionalidade
# Criar PR no GitHub
```

### Estrutura de Pull Request

#### Template de PR
```markdown
## 📋 Descrição
Breve descrição das mudanças implementadas.

## 🎯 Tipo de Mudança
- [ ] 🐛 Correção de bug
- [ ] ✨ Nova funcionalidade
- [ ] 💥 Breaking change
- [ ] 📚 Documentação
- [ ] 🧪 Testes

## 🧪 Como Testar
1. Passos para testar as mudanças
2. Cenários específicos
3. Dados de teste necessários

## 📸 Screenshots (se aplicável)
Capturas de tela das mudanças visuais.

## ✅ Checklist
- [ ] Código segue os padrões do projeto
- [ ] Testes foram adicionados/atualizados
- [ ] Documentação foi atualizada
- [ ] Build passa sem erros
- [ ] Não há conflitos de merge
```

## 🧪 Testes

### Estratégia de Testes

#### Tipos de Teste
- **Unitários**: Testam componentes isolados
- **Integração**: Testam interação entre componentes
- **E2E**: Testam fluxos completos do usuário
- **Propriedades**: Testam propriedades universais

#### Estrutura de Testes
```
test/
├── unit/              # Testes unitários
│   ├── services/
│   ├── controllers/
│   └── utils/
├── integration/       # Testes de integração
│   ├── auth/
│   ├── transactions/
│   └── investments/
├── e2e/              # Testes end-to-end
│   ├── user-flows/
│   └── api-endpoints/
└── fixtures/         # Dados de teste
    ├── users.json
    └── transactions.json
```

#### Comandos de Teste
```bash
# Backend
npm test                    # Todos os testes
npm run test:unit          # Apenas unitários
npm run test:integration   # Apenas integração
npm run test:e2e          # Apenas E2E
npm run test:cov          # Com cobertura

# Frontend
npm test                   # Testes React
npm run test:e2e          # Cypress E2E
npm run test:coverage     # Cobertura
```

#### Exemplo de Teste Unitário
```typescript
// transaction.service.spec.ts
describe('TransactionService', () => {
  let service: TransactionService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('createTransaction', () => {
    it('should create a transaction successfully', async () => {
      // Arrange
      const createDto: CreateTransactionDto = {
        type: 'expense',
        amount: 100.50,
        description: 'Supermercado',
        date: '2024-01-15T10:30:00Z',
      };

      const expectedTransaction = {
        id: 'tx-123',
        ...createDto,
        userId: 'user-123',
        createdAt: new Date(),
      };

      jest.spyOn(prisma.transaction, 'create').mockResolvedValue(expectedTransaction);

      // Act
      const result = await service.createTransaction(createDto, 'user-123');

      // Assert
      expect(result).toEqual(expectedTransaction);
      expect(prisma.transaction.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          userId: 'user-123',
        },
      });
    });
  });
});
```

#### Exemplo de Teste de Propriedade
```typescript
// transaction.property.spec.ts
import fc from 'fast-check';

describe('Transaction Property Tests', () => {
  it('Property 7: should suggest category for any transaction with description', () => {
    fc.assert(
      fc.property(
        fc.record({
          description: fc.string({ minLength: 1, maxLength: 255 }),
          amount: fc.float({ min: 0.01, max: 10000 }),
        }),
        async (transactionData) => {
          // Act
          const suggestion = await service.suggestCategory(
            transactionData.description,
            transactionData.amount,
            'user-123'
          );

          // Assert
          expect(suggestion).toBeDefined();
          expect(suggestion.categoryId).toBeTruthy();
          expect(suggestion.confidence).toBeGreaterThan(0);
          expect(suggestion.confidence).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Cobertura de Testes

#### Metas de Cobertura
- **Services**: 95%+
- **Controllers**: 90%+
- **Utils**: 100%
- **Components**: 85%+
- **Overall**: 90%+

#### Relatórios de Cobertura
```bash
# Gerar relatório
npm run test:cov

# Visualizar no navegador
open coverage/lcov-report/index.html
```

## 📚 Documentação

### Tipos de Documentação

#### Código
```typescript
/**
 * Calcula o saldo total de uma conta considerando todas as transações
 * @param accountId - ID da conta
 * @param endDate - Data limite para cálculo (opcional)
 * @returns Promise com o saldo calculado
 * @throws {NotFoundError} Quando a conta não existe
 * @example
 * ```typescript
 * const balance = await calculateAccountBalance('acc-123');
 * console.log(balance); // 1500.75
 * ```
 */
async calculateAccountBalance(
  accountId: string,
  endDate?: Date
): Promise<number> {
  // Implementação...
}
```

#### README de Módulos
```markdown
# Transactions Module

## Visão Geral
Módulo responsável pela gestão completa de transações financeiras.

## Funcionalidades
- ✅ CRUD de transações
- ✅ Categorização automática com IA
- ✅ Filtros avançados
- ✅ Importação em lote

## API Endpoints
- `GET /transactions` - Listar transações
- `POST /transactions` - Criar transação
- `PATCH /transactions/:id` - Atualizar transação
- `DELETE /transactions/:id` - Deletar transação

## Exemplos de Uso
```typescript
// Criar transação
const transaction = await transactionService.create({
  type: 'expense',
  amount: 150.50,
  description: 'Supermercado Extra'
});
```
```

#### Changelog
```markdown
# Changelog

## [1.2.0] - 2024-01-15

### Added
- ✨ Autenticação 2FA com TOTP
- ✨ Dashboard de investimentos
- ✨ Exportação de relatórios em PDF

### Changed
- 🔄 Melhorada performance das consultas de transações
- 🔄 Atualizada interface do dashboard

### Fixed
- 🐛 Corrigido cálculo de saldo em contas compartilhadas
- 🐛 Corrigida sincronização com Open Banking

### Security
- 🔒 Implementada criptografia adicional para dados sensíveis
```

## 👀 Revisão de Código

### Checklist do Revisor

#### Funcionalidade
- [ ] O código faz o que deveria fazer?
- [ ] A lógica está correta?
- [ ] Casos extremos foram considerados?
- [ ] Tratamento de erros está adequado?

#### Qualidade
- [ ] Código é legível e bem estruturado?
- [ ] Nomes de variáveis são descritivos?
- [ ] Funções têm responsabilidade única?
- [ ] Não há duplicação desnecessária?

#### Performance
- [ ] Não há loops desnecessários?
- [ ] Consultas ao banco são otimizadas?
- [ ] Cache é usado adequadamente?
- [ ] Não há vazamentos de memória?

#### Segurança
- [ ] Dados sensíveis são protegidos?
- [ ] Validação de entrada está presente?
- [ ] Autorização está implementada?
- [ ] Não há vulnerabilidades óbvias?

#### Testes
- [ ] Testes cobrem os casos principais?
- [ ] Testes são claros e concisos?
- [ ] Mocks são usados adequadamente?
- [ ] Cobertura atende aos padrões?

### Processo de Review

1. **Auto-Review**: Revisar próprio código antes do PR
2. **Automated Checks**: CI/CD deve passar
3. **Peer Review**: Pelo menos 1 aprovação necessária
4. **Maintainer Review**: Para mudanças significativas

## 💬 Comunicação

### Canais de Comunicação

- **GitHub Issues**: Bugs, funcionalidades, discussões técnicas
- **GitHub Discussions**: Discussões gerais, ideias, perguntas
- **Pull Requests**: Revisões de código, feedback técnico

### Diretrizes de Comunicação

#### Issues
- Use templates fornecidos
- Seja específico e detalhado
- Inclua passos para reproduzir (bugs)
- Adicione labels apropriadas

#### Pull Requests
- Descreva claramente as mudanças
- Referencie issues relacionadas
- Inclua screenshots se aplicável
- Responda feedback construtivamente

#### Código de Conduta
- Seja respeitoso e profissional
- Foque no código, não na pessoa
- Aceite feedback construtivo
- Ajude outros desenvolvedores

## 🏆 Reconhecimento

### Contribuidores

Todos os contribuidores são reconhecidos no arquivo `CONTRIBUTORS.md` e no README principal.

### Tipos de Contribuição Reconhecidas

- 💻 Código
- 📖 Documentação
- 🐛 Relatórios de Bug
- 💡 Ideias
- 🤔 Perguntas
- ⚠️ Testes
- 🌍 Tradução
- 📢 Divulgação

## 📄 Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a mesma licença do projeto (MIT License).

## ❓ Dúvidas

Se você tiver dúvidas sobre como contribuir:

1. Verifique a documentação existente
2. Procure em issues fechadas
3. Abra uma nova issue com a tag `question`
4. Participe das discussões no GitHub Discussions

Obrigado por contribuir para a Plataforma Financeira! 🚀