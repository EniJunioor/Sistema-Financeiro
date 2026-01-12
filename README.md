# 💰 Plataforma Financeira

Uma plataforma moderna e segura para gestão financeira pessoal e de pequenos negócios com controle completo de receitas, despesas, metas, investimentos, planejamento financeiro e integração com bancos e corretoras através de Open Banking.

## ✨ Funcionalidades Principais

### 🔐 Autenticação e Segurança
- ✅ Autenticação JWT com refresh tokens
- ✅ OAuth2 (Google, Apple, Microsoft, Facebook)
- ✅ Autenticação de dois fatores (2FA/TOTP)
- ✅ Rate limiting e proteção contra ataques
- ✅ Criptografia de dados sensíveis

### 💳 Gestão de Transações
- ✅ CRUD completo de transações
- ✅ Categorização automática com IA/ML
- ✅ Filtros avançados e busca full-text
- ✅ Transações recorrentes
- ✅ Upload de anexos e OCR
- ✅ Deduplicação inteligente

### 🏦 Contas Bancárias (Open Banking)
- ✅ Conexão com múltiplos provedores (Plaid, TrueLayer, Pluggy, Belvo)
- ✅ Sincronização automática a cada 2 horas
- ✅ Aprovação de transações pendentes
- ✅ Gestão de múltiplas contas
- ✅ Detecção de duplicatas

### 📊 Dashboard e Analytics
- ✅ Dashboard personalizável com cards
- ✅ Gráficos interativos (Recharts + D3.js)
- ✅ Previsões com IA (time series forecasting)
- ✅ Comparações entre períodos
- ✅ Atualização em tempo real (WebSockets)

### 📈 Investimentos
- 🔄 Gestão de carteira multi-ativo
- 🔄 Cotações em tempo real
- 🔄 Análise de performance e risco
- 🔄 Rebalanceamento automático

### 🎯 Metas Financeiras
- 🔄 Múltiplos tipos de meta
- 🔄 Gamificação (badges, streaks)
- 🔄 Planejamento automático com IA

### 📱 Mobile
- 🔄 App React Native
- 🔄 Modo offline
- 🔄 Captura de recibos com OCR
- 🔄 Pagamentos via PIX

### 📋 Relatórios
- 🔄 Geração de PDF/Excel
- 🔄 Templates personalizáveis
- 🔄 Agendamento automático
- 🔄 Compliance fiscal

**Legenda:** ✅ Implementado | 🔄 Em desenvolvimento | ⏳ Planejado

## 🏗️ Arquitetura

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

**Mobile (Futuro)**
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

### Estrutura do Projeto

```
plataforma-financeira/
├── 📁 backend/          # API NestJS
├── 📁 frontend/         # Web Next.js  
├── 📁 mobile/           # App React Native (futuro)
├── 📁 shared/           # Tipos compartilhados
├── 📁 docs/             # Documentação
├── 📁 docker/           # Configurações Docker
└── 🐳 docker-compose.yml
```

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- Git

### Instalação

1. **Clone o repositório**
   ```bash
   git clone <repository-url>
   cd plataforma-financeira
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   
   # Frontend  
   cp frontend/.env.local.example frontend/.env.local
   ```

4. **Inicie os serviços com Docker**
   ```bash
   npm run docker:up
   ```

5. **Execute as migrações do banco**
   ```bash
   npm run db:migrate
   ```

6. **Inicie o desenvolvimento**
   ```bash
   npm run dev
   ```

### Acessos

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Documentação API**: http://localhost:3001/api/docs
- **Prisma Studio**: `npm run prisma:studio`

## 📝 Scripts Disponíveis

### Desenvolvimento
- `npm run dev` - Inicia backend e frontend em modo desenvolvimento
- `npm run dev:backend` - Inicia apenas o backend
- `npm run dev:frontend` - Inicia apenas o frontend

### Build
- `npm run build` - Build completo (shared + backend + frontend)
- `npm run build:backend` - Build apenas do backend
- `npm run build:frontend` - Build apenas do frontend

### Testes
- `npm run test` - Executa todos os testes
- `npm run test:backend` - Testes do backend
- `npm run test:frontend` - Testes do frontend

### Qualidade de Código
- `npm run lint` - Executa ESLint em todos os projetos
- `npm run format` - Formata código com Prettier

### Docker
- `npm run docker:up` - Inicia containers (PostgreSQL + Redis)
- `npm run docker:down` - Para containers
- `npm run docker:logs` - Visualiza logs dos containers

### Banco de Dados
- `npm run db:migrate` - Executa migrações Prisma
- `npm run db:seed` - Popula banco com dados iniciais

## 🗄️ Banco de Dados

O projeto usa PostgreSQL com Prisma ORM. O schema está em `backend/prisma/schema.prisma`.

### Principais Entidades

- **User** - Usuários com autenticação avançada (JWT, OAuth, 2FA)
- **Account** - Contas bancárias conectadas via Open Banking
- **Transaction** - Transações com categorização IA e deduplicação
- **Investment** - Investimentos multi-ativo com cotações em tempo real
- **Goal** - Metas financeiras com gamificação
- **Category** - Categorias hierárquicas com ML para sugestões
- **Notification** - Sistema de notificações inteligentes
- **Report** - Relatórios personalizáveis e agendáveis

## 🔧 Desenvolvimento

### Estrutura de Pastas

#### Backend (NestJS)
```
backend/src/
├── modules/              # Módulos de negócio
│   ├── auth/            # Autenticação JWT + OAuth + 2FA
│   ├── users/           # Gestão de usuários
│   ├── accounts/        # Contas bancárias + Open Banking
│   ├── transactions/    # Transações + IA + Deduplicação
│   ├── investments/     # Investimentos + Cotações
│   ├── goals/           # Metas + Gamificação
│   ├── notifications/   # Notificações inteligentes
│   ├── reports/         # Relatórios + Analytics
│   └── ai/              # Inteligência Artificial
├── common/              # Código compartilhado
│   ├── decorators/      # Custom decorators
│   ├── filters/         # Exception filters
│   ├── guards/          # Guards globais
│   ├── interceptors/    # Interceptors
│   └── pipes/           # Validation pipes
├── config/              # Configurações
├── database/            # Prisma schema e migrations
└── jobs/                # Background jobs
```

#### Frontend (Next.js)
```
frontend/src/
├── app/                 # App Router (Next.js 14)
│   ├── (auth)/         # Grupo de rotas de auth
│   ├── (dashboard)/    # Grupo de rotas do dashboard
│   └── api/            # API Routes
├── components/          # Componentes React
│   ├── ui/             # Componentes base (Shadcn/ui)
│   ├── layout/         # Componentes de layout
│   ├── forms/          # Formulários
│   ├── charts/         # Gráficos e visualizações
│   ├── accounts/       # Componentes de contas
│   ├── transactions/   # Componentes de transações
│   └── dashboard/      # Componentes do dashboard
├── lib/                 # Utilitários e configurações
├── hooks/               # Custom hooks
├── store/               # Estado global (Zustand)
└── types/               # Tipos TypeScript
```

### Padrões de Código

- **TypeScript** em todos os projetos
- **ESLint + Prettier** para qualidade de código
- **Conventional Commits** para mensagens de commit
- **Clean Architecture** no backend
- **Component-driven development** no frontend

## 🔒 Segurança

### Autenticação e Autorização
- **JWT** com refresh tokens e rotação automática
- **OAuth2** com Google, Apple, Microsoft, Facebook
- **2FA/TOTP** com Google Authenticator, SMS, email
- **Biometria** no mobile (fingerprint/face)
- **Rate limiting** e proteção contra ataques DDoS
- **CAPTCHA** em tentativas suspeitas

### Criptografia e Proteção de Dados
- **TLS 1.3** com certificate pinning e HSTS
- **AES-256** para dados em repouso
- **ChaCha20** para streaming de dados
- **HSM** para gerenciamento de chaves críticas
- **Bcrypt** para hash de senhas
- **Argon2** para dados sensíveis

### Compliance e Auditoria
- **LGPD** - Portabilidade e exclusão de dados
- **PCI-DSS** - Processamento seguro de dados de cartão
- **Auditoria completa** - Log de todas as ações
- **Backup criptografado** - Retenção configurável
- **Disaster recovery** - RTO < 4h, RPO < 1h

### Monitoramento de Segurança
- **Detecção de intrusão** em tempo real
- **Análise de comportamento** com ML
- **Alertas automáticos** para atividades suspeitas
- **Penetration testing** regular
- **Zero-trust architecture** com verificação contínua

## 📊 Monitoramento e Observabilidade

### Health Checks e Métricas
- **Health checks** em `/api/v1/health`
- **Métricas de performance** com Prometheus
- **Logs estruturados** com Winston
- **Distributed tracing** com Jaeger
- **APM** com New Relic ou DataDog

### Error Tracking e Alertas
- **Error tracking** com Sentry
- **Alertas em tempo real** via Slack/Discord
- **Dashboards** personalizados com Grafana
- **SLA monitoring** com uptime checks
- **Performance budgets** para frontend

### Analytics e Business Intelligence
- **User analytics** com Mixpanel/Amplitude
- **Financial metrics** dashboard
- **A/B testing** framework
- **Conversion tracking** e funnels
- **Custom events** e segmentação

## 🚢 Deploy

### Desenvolvimento
```bash
npm run docker:up
npm run dev
```

### Produção
```bash
npm run build
npm run start
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

Para suporte, abra uma issue no GitHub ou entre em contato com a equipe de desenvolvimento.

---

**Plataforma Financeira** - Transformando a gestão financeira com tecnologia moderna 🚀