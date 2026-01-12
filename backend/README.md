# Backend - Plataforma Financeira

## 🎯 Visão Geral

O backend da Plataforma Financeira é uma API REST robusta construída com NestJS, oferecendo funcionalidades completas para gestão financeira pessoal, incluindo autenticação avançada, integração com Open Banking, categorização automática com IA, e analytics financeiros.

## 🛠️ Stack Tecnológico

### Core Framework
- **NestJS** 10.0+ - Framework Node.js enterprise-grade
- **TypeScript** 5.0+ - Type safety e melhor experiência de desenvolvimento
- **Node.js** 18+ - Runtime JavaScript

### Banco de Dados
- **PostgreSQL** 15+ - Banco de dados principal
- **Prisma ORM** 5.0+ - Object-Relational Mapping
- **Redis** 7.0+ - Cache e sessões

### Autenticação e Segurança
- **JWT** - JSON Web Tokens para autenticação
- **Passport.js** - Estratégias de autenticação
- **bcrypt** - Hash de senhas
- **Helmet** - Segurança HTTP
- **Rate Limiting** - Proteção contra ataques

### Integrações
- **Open Banking Brasil** - Conectividade bancária
- **AWS S3** - Armazenamento de arquivos
- **SendGrid** - Envio de emails
- **Bull Queue** - Processamento de jobs

### Monitoramento e Logs
- **Winston** - Sistema de logs
- **Prometheus** - Métricas
- **Sentry** - Monitoramento de erros

## 🏗️ Arquitetura

### Estrutura de Módulos
```
src/
├── auth/                   # Autenticação e autorização
├── users/                  # Gestão de usuários
├── accounts/               # Contas bancárias e Open Banking
├── transactions/           # Transações financeiras
├── categories/             # Categorias de transações
├── investments/            # Investimentos e portfolio
├── goals/                  # Metas financeiras
├── reports/                # Relatórios e analytics
├── notifications/          # Sistema de notificações
├── files/                  # Upload e gestão de arquivos
├── common/                 # Utilitários compartilhados
├── config/                 # Configurações
└── database/               # Configuração do banco
```

### Padrões Arquiteturais
- **Modular Architecture**: Separação clara de responsabilidades
- **Dependency Injection**: Inversão de controle com NestJS
- **Repository Pattern**: Abstração da camada de dados
- **Service Layer**: Lógica de negócio centralizada
- **DTO Pattern**: Data Transfer Objects para validação
- **Guard Pattern**: Proteção de rotas e recursos

## 🚀 Funcionalidades Implementadas

### ✅ Autenticação e Usuários
- **Registro e Login**: Email/senha com validação
- **JWT Authentication**: Tokens seguros com refresh
- **OAuth Integration**: Google, Facebook, Apple
- **Two-Factor Authentication**: TOTP com Google Authenticator
- **Password Recovery**: Reset seguro via email
- **Profile Management**: Gestão completa de perfil

### ✅ Contas Bancárias (Open Banking)
- **Account Connection**: Conexão com bancos via Open Banking
- **OAuth Flow**: Fluxo completo de autorização bancária
- **Account Sync**: Sincronização automática de dados
- **Balance Tracking**: Acompanhamento de saldos
- **Transaction Import**: Importação automática de transações
- **Multi-Bank Support**: Suporte a múltiplos bancos

### ✅ Transações Financeiras
- **CRUD Operations**: Criação, leitura, atualização e exclusão
- **Auto-Categorization**: IA para categorização automática
- **Advanced Filtering**: Filtros por data, valor, categoria, conta
- **Full-Text Search**: Busca em descrições e localizações
- **Bulk Operations**: Operações em lote
- **Recurring Transactions**: Transações recorrentes
- **File Attachments**: Anexos de comprovantes

### ✅ Categorização Inteligente
- **Machine Learning**: Algoritmos de aprendizado
- **User Learning**: Aprende com histórico do usuário
- **Keyword Matching**: Regras baseadas em palavras-chave
- **Confidence Scoring**: Pontuação de confiança
- **Category Hierarchy**: Categorias hierárquicas
- **Brazilian Categories**: Categorias específicas do Brasil

### ✅ Investimentos
- **Portfolio Management**: Gestão completa de portfolio
- **Asset Tracking**: Acompanhamento de ativos
- **Performance Analytics**: Análise de performance
- **Price Updates**: Atualização automática de preços
- **Dividend Tracking**: Acompanhamento de dividendos
- **Asset Types**: Ações, fundos, ETFs, criptomoedas

### ✅ Metas Financeiras
- **Goal Creation**: Criação de metas personalizadas
- **Progress Tracking**: Acompanhamento de progresso
- **Smart Suggestions**: Sugestões inteligentes
- **Deadline Management**: Gestão de prazos
- **Category Goals**: Metas por categoria
- **Achievement System**: Sistema de conquistas

### ✅ Relatórios e Analytics
- **Financial Dashboard**: Dashboard completo
- **Trend Analysis**: Análise de tendências
- **Period Comparison**: Comparação entre períodos
- **Cash Flow Analysis**: Análise de fluxo de caixa
- **Spending Patterns**: Padrões de gastos
- **Predictive Analytics**: Analytics preditivos
- **Export Functionality**: Exportação de dados

### ✅ Sistema de Notificações
- **Email Notifications**: Notificações por email
- **Push Notifications**: Notificações push (mobile)
- **In-App Notifications**: Notificações internas
- **Smart Alerts**: Alertas inteligentes
- **Customizable Settings**: Configurações personalizáveis

## 📊 Banco de Dados

### Modelos Principais

#### User
```typescript
{
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Account
```typescript
{
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  bankName?: string;
  accountNumber?: string;
  isConnected: boolean;
  connectionId?: string;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Transaction
```typescript
{
  id: string;
  userId: string;
  accountId?: string;
  categoryId?: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: Date;
  location?: string;
  tags?: string[];
  isRecurring: boolean;
  recurringRule?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Relacionamentos
- User → Accounts (1:N)
- User → Transactions (1:N)
- User → Goals (1:N)
- User → Investments (1:N)
- Account → Transactions (1:N)
- Category → Transactions (1:N)

## 🔧 Configuração e Desenvolvimento

### Pré-requisitos
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker e Docker Compose

### Variáveis de Ambiente
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/plataforma_financeira"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"

# Open Banking
OPEN_BANKING_CLIENT_ID="your-client-id"
OPEN_BANKING_CLIENT_SECRET="your-client-secret"

# AWS
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET="your-bucket-name"

# Email
SENDGRID_API_KEY="your-sendgrid-key"
```

### Comandos de Desenvolvimento
```bash
# Instalar dependências
npm install

# Iniciar banco de dados
docker compose up -d postgres redis

# Configurar banco
npm run prisma:migrate
npm run prisma:seed

# Desenvolvimento
npm run start:dev

# Build
npm run build

# Produção
npm run start:prod

# Testes
npm test
npm run test:e2e
npm run test:cov
```

## 🧪 Testes

### Estratégia de Testes
- **Unit Tests**: Testes unitários para services e utils
- **Integration Tests**: Testes de integração para controllers
- **E2E Tests**: Testes end-to-end para fluxos completos
- **Database Tests**: Testes com banco de dados real

### Cobertura de Testes
- **Services**: 95%+ cobertura
- **Controllers**: 90%+ cobertura
- **Utils**: 100% cobertura
- **Overall**: 90%+ cobertura

### Executar Testes
```bash
# Todos os testes
npm test

# Testes específicos
npm test -- --testPathPattern=auth
npm test -- --testPathPattern=transactions

# Testes E2E
npm run test:e2e

# Cobertura
npm run test:cov
```

## 📡 API Endpoints

### Autenticação
```
POST   /auth/register          # Registro de usuário
POST   /auth/login             # Login
POST   /auth/refresh           # Refresh token
POST   /auth/logout            # Logout
POST   /auth/forgot-password   # Esqueci a senha
POST   /auth/reset-password    # Reset de senha
POST   /auth/verify-email      # Verificar email
```

### Usuários
```
GET    /users/profile          # Perfil do usuário
PATCH  /users/profile          # Atualizar perfil
POST   /users/avatar           # Upload de avatar
DELETE /users/account          # Deletar conta
```

### Contas Bancárias
```
GET    /accounts               # Listar contas
POST   /accounts               # Criar conta manual
GET    /accounts/:id           # Detalhes da conta
PATCH  /accounts/:id           # Atualizar conta
DELETE /accounts/:id           # Deletar conta
POST   /accounts/connect       # Conectar com banco
POST   /accounts/sync          # Sincronizar dados
```

### Transações
```
GET    /transactions           # Listar transações
POST   /transactions           # Criar transação
GET    /transactions/:id       # Detalhes da transação
PATCH  /transactions/:id       # Atualizar transação
DELETE /transactions/:id       # Deletar transação
GET    /transactions/stats     # Estatísticas
POST   /transactions/import    # Importar transações
```

### Relatórios
```
GET    /reports/dashboard      # Dashboard completo
GET    /reports/summary        # Resumo financeiro
GET    /reports/trends         # Análise de tendências
GET    /reports/cash-flow      # Fluxo de caixa
GET    /reports/categories     # Gastos por categoria
```

## 🔒 Segurança

### Medidas Implementadas
- **HTTPS Only**: Comunicação criptografada
- **JWT Security**: Tokens seguros com expiração
- **Password Hashing**: bcrypt com salt
- **Rate Limiting**: Proteção contra ataques
- **CORS Configuration**: Configuração adequada de CORS
- **Input Validation**: Validação rigorosa de entrada
- **SQL Injection Protection**: Prisma ORM protege contra SQL injection
- **XSS Protection**: Sanitização de dados

### Compliance
- **LGPD**: Lei Geral de Proteção de Dados
- **Open Banking Brasil**: Regulamentações do Banco Central
- **PCI DSS**: Padrões para dados de pagamento

## 🚀 Deploy e Produção

### Ambientes
- **Development**: Ambiente local
- **Staging**: Ambiente de homologação
- **Production**: Ambiente de produção

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

### CI/CD
- **GitHub Actions**: Automação de builds e deploys
- **Docker Hub**: Registry de imagens
- **AWS ECS**: Orquestração de containers
- **AWS RDS**: Banco de dados gerenciado
- **AWS ElastiCache**: Redis gerenciado

## 📈 Monitoramento

### Métricas
- **Response Time**: Tempo de resposta das APIs
- **Throughput**: Requisições por segundo
- **Error Rate**: Taxa de erros
- **Database Performance**: Performance do banco
- **Memory Usage**: Uso de memória
- **CPU Usage**: Uso de CPU

### Logs
- **Structured Logging**: Logs estruturados com Winston
- **Log Levels**: Debug, Info, Warn, Error
- **Request Logging**: Log de todas as requisições
- **Error Tracking**: Rastreamento de erros com Sentry

## 📚 Documentação

### API Documentation
- **Swagger/OpenAPI**: Documentação interativa
- **Postman Collection**: Coleção para testes
- **API Examples**: Exemplos de uso

### Links Úteis
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)

## 🤝 Contribuição

### Padrões de Código
- **ESLint**: Linting de código
- **Prettier**: Formatação de código
- **Husky**: Git hooks
- **Conventional Commits**: Padrão de commits

### Fluxo de Desenvolvimento
1. Fork do repositório
2. Criar branch feature
3. Implementar funcionalidade
4. Escrever testes
5. Executar linting e testes
6. Criar Pull Request

## 📄 Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo `LICENSE` na raiz do projeto para mais detalhes.