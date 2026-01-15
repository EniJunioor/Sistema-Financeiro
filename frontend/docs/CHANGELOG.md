# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Não Lançado]

### Em Desenvolvimento
- Sistema de notificações inteligentes
- Integração com mais provedores Open Banking
- Aplicativo mobile React Native
- Sistema de metas financeiras avançadas

## [1.2.0] - 2026-01-15

### Adicionado
- 📊 **Sistema de Relatórios Completo**
  - Página de Relatórios Mensais (`/reports/monthly`)
    - Modal funcional para geração de relatórios mensais
    - Seleção de mês e ano
    - Opções de formato (PDF, Excel, CSV)
    - Integração completa com backend
    - Cards de resumo com cores e ícones
    - Lista de relatórios gerados com download funcional
    - Loading states e fallback para dados mock
  
  - Página de Relatórios Anuais (`/reports/annual`)
    - Modal funcional para geração de relatórios anuais
    - Seleção de ano
    - Opções de formato e configurações avançadas
    - Breakdown mensal opcional
    - Integração completa com backend
    - Cards de resumo com cores e ícones
    - Lista de relatórios gerados com download funcional
  
  - Página de Relatórios Personalizados (`/reports/custom`)
    - Modal funcional com seleção de período personalizado
    - Calendário para escolher datas inicial e final
    - Validação de período (data final >= data inicial)
    - Título personalizado para o relatório
    - Opções de formato e configurações
    - Integração completa com backend
    - Cards de resumo e lista de relatórios

- 🎨 **Melhorias Visuais na Página de Relatórios**
  - Cards de tipo de relatório com cores e ícones:
    - Mensal: verde (emerald) com ícone Calendar
    - Anual: azul com ícone BarChart3
    - Personalizado: roxo com ícone FileText
  - Cards de estatísticas melhorados:
    - Templates: verde com ícone FileText
    - Agendados: azul com ícone Calendar
    - Este Mês: roxo com ícone History
    - Compartilhados: laranja com ícone Share2
  - Cards de templates com gradientes e cores por categoria
  - Navegação funcional para páginas específicas
  - Hover effects e transições suaves

- 🔧 **Componentes de Relatórios**
  - `MonthlyReportDialog` - Modal para relatórios mensais
  - `AnnualReportDialog` - Modal para relatórios anuais
  - `CustomReportDialog` - Modal para relatórios personalizados
  - Validação de formulários com Zod
  - Feedback visual (loading, sucesso, erro)

- 💼 **Melhorias em Investimentos**
  - Página de Fundos (`/investments/funds`) completamente refatorada
    - Integração com hooks `useInvestments`, `usePortfolio`, `useAssetAllocation`
    - Atualização de cotações funcional
    - Exportação de dados em CSV
    - Cards de resumo com ícones e cores
    - Loading states com skeletons
    - Integração com formulário de investimentos
    - Menu de ações para cada investimento
  - Páginas de Portfolio e Ações atualizadas com mesmas melhorias
  - Suporte para múltiplos tipos de investimentos

### Melhorado
- 🔄 **Hook useReports**
  - Refatoração completa do hook
  - Remoção de estados desnecessários
  - Integração com React Query para histórico de relatórios
  - Filtragem automática de relatórios por tipo
  - Melhor tratamento de erros
  - Loading states aprimorados

- 📡 **Integração com Backend**
  - Busca automática de histórico de relatórios
  - Filtragem inteligente (mensal, anual, personalizado)
  - Fallback para dados mock quando backend não disponível
  - Download de relatórios funcional
  - Geração de relatórios integrada com API

- 🎨 **Design System**
  - Cores consistentes por tipo de relatório
  - Ícones em todos os cards
  - Hover effects e transições
  - Responsividade completa (mobile e desktop)
  - Loading states em todas as páginas

### Mudanças Técnicas
- 📁 **Estrutura de Arquivos**
  - Criadas páginas: `frontend/src/app/(dashboard)/reports/monthly/page.tsx`
  - Criadas páginas: `frontend/src/app/(dashboard)/reports/annual/page.tsx`
  - Criadas páginas: `frontend/src/app/(dashboard)/reports/custom/page.tsx`
  - Criados componentes: `frontend/src/components/reports/monthly-report-dialog.tsx`
  - Criados componentes: `frontend/src/components/reports/annual-report-dialog.tsx`
  - Criados componentes: `frontend/src/components/reports/custom-report-dialog.tsx`
  - Atualizado hook: `frontend/src/hooks/use-reports.ts`
  - Atualizado API: `frontend/src/lib/reports-api.ts`
  - Atualizadas páginas de investimentos com integração completa

## [1.1.3] - 2026-01-14

### Adicionado
- 🔗 **Integração Brandfetch API**
  - Serviço para busca automática de logos e cores de bancos
  - Hooks React (`useBankBrand`, `useBankLogo`, `useBankColors`) para integração com React Query
  - Mapeamento automático de bancos brasileiros para domínios
  - Suporte para múltiplos formatos de logo (SVG, PNG)
  - Cache de 24 horas para melhor performance
  - Documentação completa em `docs/BRANDFETCH_INTEGRATION.md`

### Melhorado
- 🎨 **Sistema de Ícones de Bancos**
  - Possibilidade de usar logos dinâmicos via Brandfetch API
  - Fallback inteligente (API → ícones locais → ícone padrão)
  - Suporte para cores oficiais das marcas

### Mudanças Técnicas
- 📁 **Estrutura de Arquivos**
  - Criado serviço `frontend/src/lib/brandfetch-api.ts`
  - Criado hook `frontend/src/hooks/use-brandfetch.ts`
  - Criada documentação `frontend/docs/BRANDFETCH_INTEGRATION.md`
  - Variável de ambiente `NEXT_PUBLIC_BRANDFETCH_API_KEY` para configuração

## [1.1.2] - 2026-01-13

### Adicionado
- 🏦 **Sistema de Ícones de Bancos**
  - Componente `BankIcon` para exibição de logos de bancos
  - Função utilitária `getBankIconPath` para mapeamento de ícones
  - Suporte para ícones de bancos na página de contas
  - Estrutura para ícones em `public/icons/`
  - Fallback automático para ícone padrão quando o ícone do banco não existir

### Melhorado
- 🎨 **Página de Contas**
  - Substituição de ícones genéricos por logos reais dos bancos
  - Exibição de logos de bancos nas seções "Minhas Contas" e "Cartões de Crédito"
  - Suporte para múltiplos bancos (Nubank, Inter, Banco do Brasil, Caixa, Itaú, Bradesco, Santander)

### Mudanças Técnicas
- 📁 **Estrutura de Arquivos**
  - Criado componente `frontend/src/components/accounts/bank-icon.tsx`
  - Criado utilitário `frontend/src/lib/bank-icons.ts`
  - Estrutura criada em `frontend/public/icons/` para armazenar ícones de bancos
  - Página de contas atualizada para usar o componente `BankIcon`

## [1.1.1] - 2025-01-27

### Adicionado
- 📚 **Atualização Completa da Documentação**
  - Atualização de todos os arquivos README.md do projeto
  - Revisão e atualização do CHANGELOG.md
  - Atualização do SETUP.md com instruções mais claras
  - Melhorias na documentação da API (docs/API.md)
  - Atualização do guia de desenvolvimento (docs/DEVELOPMENT.md)
  - Revisão do guia de deploy (docs/DEPLOYMENT.md)
  - Documentação atualizada dos módulos backend
  - Documentação atualizada do frontend
  - Documentação do módulo mobile atualizada

### Melhorado
- 📝 **Documentação**
  - README principal com informações mais detalhadas sobre funcionalidades
  - Documentação de segurança expandida
  - Exemplos de código atualizados
  - Instruções de setup mais claras e passo a passo
  - Guias de contribuição aprimorados

### Mudanças Técnicas
- 🔧 **Configuração do Projeto**
  - Verificação e atualização do .gitignore
  - Preparação para versionamento Git
  - Organização da estrutura de documentação

## [1.1.0] - 2026-01-12

### Adicionado
- 🔒 **Segurança Avançada Implementada**
  - **TLS 1.3** com cipher suites seguros (AES-256-GCM, ChaCha20-Poly1305)
  - **Certificate Pinning** para produção com validação SHA-256
  - **HSTS** com preload e includeSubDomains
  - **Criptografia AES-256-GCM** para dados financeiros
  - **Criptografia ChaCha20-Poly1305** para PII e tokens
  - **HSM Integration** com AWS KMS e HashiCorp Vault
  - **Auditoria Completa** com logs estruturados e rotação diária
  - **Rate Limiting Avançado** com Redis e proteção brute force
  - **Security Headers** completos (CSP, X-Frame-Options, etc.)
  - **Input Validation** com detecção de padrões maliciosos
  - **IP Whitelisting** e validação de User-Agent
  - **Monitoramento de Segurança** em tempo real

- 🛡️ **Serviços de Segurança**
  - `EncryptionService` - Criptografia AES-256 e ChaCha20
  - `HSMService` - Integração com Hardware Security Modules
  - `AuditService` - Sistema de auditoria e logs de segurança
  - `TLSService` - Configuração TLS 1.3 e certificate pinning
  - `SecurityMiddleware` - Middleware de segurança avançado
  - `SecurityGuard` - Guard para validação de requisições
  - `SecurityController` - API para gerenciamento de segurança

- 📋 **Documentação de Segurança**
  - Guia completo de implementação de segurança
  - Scripts de validação de segurança
  - Configurações de produção
  - Checklist de compliance
  - Procedimentos de incident response

### Melhorado
- 🔧 **Configuração de Segurança**
  - Variáveis de ambiente expandidas para segurança
  - Configuração modular de segurança
  - Validação automática de configurações
  - Health checks para componentes de segurança

- 🚀 **Bootstrap da Aplicação**
  - Inicialização com segurança avançada
  - Validação de certificados TLS
  - Configuração automática de headers de segurança
  - Monitoramento de status de segurança

### Segurança
- 🔐 **Criptografia de Dados**
  - Dados financeiros criptografados com AES-256-GCM
  - PII criptografado com ChaCha20-Poly1305
  - Tokens seguros com HSM quando disponível
  - Derivação de chaves com PBKDF2 (100k iterações)
  - Geração de chaves criptograficamente seguras

- 🛡️ **Proteção de Rede**
  - TLS 1.3 obrigatório em produção
  - Certificate pinning para prevenir MITM
  - HSTS com preload para forçar HTTPS
  - Rate limiting inteligente por IP
  - Proteção contra ataques DDoS

- 📊 **Auditoria e Compliance**
  - Log de todas as ações de usuário
  - Classificação automática de risco
  - Detecção de atividades suspeitas
  - Retenção configurável de logs (365 dias)
  - Sanitização automática de dados sensíveis

## [1.0.0] - 2024-01-11

### Adicionado
- ✨ **Sistema de Autenticação Completo**
  - Registro e login com email/senha
  - Autenticação JWT com refresh tokens
  - Integração OAuth (Google, Facebook, Apple)
  - Autenticação de dois fatores (2FA) com TOTP
  - Recuperação de senha via email
  - Gestão completa de perfil de usuário

- ✨ **Gestão de Contas Bancárias (Open Banking)**
  - Conexão com bancos via Open Banking Brasil
  - Fluxo completo de autorização OAuth bancária
  - Sincronização automática de dados bancários
  - Acompanhamento de saldos em tempo real
  - Importação automática de transações
  - Suporte a múltiplos bancos simultaneamente

- ✨ **Sistema de Transações Financeiras**
  - CRUD completo de transações (receitas, despesas, transferências)
  - Categorização automática inteligente com IA
  - Filtros avançados por data, valor, categoria e conta
  - Busca full-text em descrições e localizações
  - Operações em lote para múltiplas transações
  - Suporte a transações recorrentes
  - Anexo de comprovantes e recibos

- ✨ **Categorização Inteligente**
  - Algoritmos de Machine Learning para categorização
  - Aprendizado baseado no histórico do usuário
  - Regras baseadas em palavras-chave para comerciantes
  - Sistema de pontuação de confiança
  - Categorias hierárquicas organizadas
  - Conjunto abrangente de categorias brasileiras

- ✨ **Gestão de Investimentos**
  - Gestão completa de portfolio de investimentos
  - Acompanhamento de ativos (ações, fundos, ETFs, criptomoedas)
  - Análise de performance e rentabilidade
  - Atualização automática de cotações
  - Acompanhamento de dividendos e proventos
  - Cálculos de risco e diversificação

- ✨ **Sistema de Metas Financeiras**
  - Criação de metas personalizadas de economia
  - Acompanhamento visual de progresso
  - Sugestões inteligentes para atingir metas
  - Gestão de prazos e deadlines
  - Metas por categoria de gastos
  - Sistema de conquistas e gamificação

- ✨ **Relatórios e Analytics Avançados**
  - Dashboard financeiro completo e interativo
  - Análise de tendências e padrões de gastos
  - Comparação entre períodos (mês a mês, ano a ano)
  - Análise de fluxo de caixa detalhada
  - Identificação de padrões de gastos
  - Analytics preditivos com IA
  - Exportação de dados em múltiplos formatos

- ✨ **Interface Web Responsiva**
  - Frontend moderno com Next.js 14 e TypeScript
  - Design responsivo com TailwindCSS
  - Componentes reutilizáveis com Shadcn/ui
  - Gráficos interativos com Recharts
  - Formulários validados com React Hook Form
  - Estado global gerenciado com Zustand
  - Otimizações de performance e SEO

- ✨ **API REST Robusta**
  - Backend construído com NestJS e TypeScript
  - Banco de dados PostgreSQL com Prisma ORM
  - Sistema de cache com Redis
  - Documentação automática com Swagger
  - Validação rigorosa de dados
  - Rate limiting e proteção contra ataques
  - Logs estruturados e monitoramento

- ✨ **Segurança Avançada**
  - Criptografia de dados sensíveis
  - Comunicação HTTPS obrigatória
  - Proteção contra ataques comuns (XSS, CSRF, SQL Injection)
  - Auditoria completa de ações do usuário
  - Conformidade com LGPD
  - Backup automático e disaster recovery

### Tecnologias Implementadas

#### Backend
- **NestJS** 10.0+ - Framework Node.js enterprise
- **TypeScript** 5.0+ - Type safety
- **PostgreSQL** 15+ - Banco de dados principal
- **Prisma** 5.0+ - ORM type-safe
- **Redis** 7.0+ - Cache e sessões
- **JWT** - Autenticação stateless
- **Passport.js** - Estratégias de autenticação
- **Bull Queue** - Processamento assíncrono

#### Frontend
- **Next.js** 14+ - Framework React com App Router
- **TypeScript** 5.0+ - Type safety
- **TailwindCSS** 3+ - Styling utility-first
- **Shadcn/ui** - Componentes acessíveis
- **Zustand** - Gerenciamento de estado
- **React Query** - Cache e sincronização de dados
- **React Hook Form** - Formulários performáticos
- **Recharts** - Gráficos e visualizações

#### DevOps & Infraestrutura
- **Docker** - Containerização
- **Docker Compose** - Orquestração local
- **GitHub Actions** - CI/CD
- **ESLint & Prettier** - Qualidade de código
- **Jest & Supertest** - Testes automatizados

### Arquitetura

#### Padrões Implementados
- **Clean Architecture** - Separação clara de responsabilidades
- **Domain-Driven Design** - Modelagem baseada no domínio
- **SOLID Principles** - Código maintível e extensível
- **Repository Pattern** - Abstração da camada de dados
- **Service Layer** - Lógica de negócio centralizada
- **DTO Pattern** - Validação e transferência de dados

#### Estrutura Modular
```
backend/src/
├── auth/           # Autenticação e autorização
├── users/          # Gestão de usuários
├── accounts/       # Contas bancárias e Open Banking
├── transactions/   # Transações financeiras
├── investments/    # Gestão de investimentos
├── goals/          # Metas financeiras
├── reports/        # Relatórios e analytics
├── notifications/  # Sistema de notificações
└── common/         # Utilitários compartilhados
```

### Performance e Otimizações

- **Cache Redis** - Consultas frequentes em cache
- **Lazy Loading** - Carregamento sob demanda
- **Pagination** - Listagens otimizadas
- **Database Indexing** - Consultas otimizadas
- **Image Optimization** - Imagens otimizadas automaticamente
- **Bundle Splitting** - Carregamento otimizado do frontend

### Segurança Implementada

- **HTTPS Only** - Comunicação criptografada
- **JWT Security** - Tokens seguros com expiração
- **Password Hashing** - bcrypt com salt
- **Rate Limiting** - Proteção contra ataques
- **CORS Configuration** - Configuração adequada
- **Input Validation** - Validação rigorosa
- **SQL Injection Protection** - Prisma ORM
- **XSS Protection** - Sanitização de dados

### Compliance e Regulamentações

- **LGPD** - Lei Geral de Proteção de Dados
- **Open Banking Brasil** - Regulamentações do Banco Central
- **PCI DSS** - Padrões para dados de pagamento (preparação)

## [0.1.0] - 2024-01-01

### Adicionado
- 🎯 Configuração inicial do projeto
- 📁 Estrutura de pastas e arquitetura
- 🛠️ Setup do ambiente de desenvolvimento
- 📚 Documentação inicial
- 🐳 Configuração Docker
- 🔧 Scripts de automação

---

## Tipos de Mudanças

- `Added` ✨ para novas funcionalidades
- `Changed` 🔄 para mudanças em funcionalidades existentes
- `Deprecated` ⚠️ para funcionalidades que serão removidas
- `Removed` 🗑️ para funcionalidades removidas
- `Fixed` 🐛 para correções de bugs
- `Security` 🔒 para correções de segurança

## Versionamento

Este projeto segue o [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0): Mudanças incompatíveis na API
- **MINOR** (0.X.0): Novas funcionalidades compatíveis
- **PATCH** (0.0.X): Correções de bugs compatíveis

## Links Úteis

- [Documentação Completa](./docs/)
- [Guia de Contribuição](./CONTRIBUTING.md)
- [Configuração de Desenvolvimento](./SETUP.md)
- [Arquitetura do Sistema](./docs/DEVELOPMENT.md)