# Setup da Plataforma Financeira

# 🚀 Setup da Plataforma Financeira

## ✅ Status da Configuração

### ✅ Concluído
- ✅ Estrutura do monorepo criada
- ✅ Backend NestJS com autenticação avançada (JWT + OAuth + 2FA)
- ✅ Frontend Next.js com interface completa
- ✅ Sistema de transações com IA e deduplicação
- ✅ Interface de contas bancárias (Open Banking)
- ✅ Dashboard com analytics e gráficos
- ✅ Schema Prisma com todas as entidades
- ✅ Docker Compose configurado
- ✅ Componentes UI (Shadcn/ui) implementados
- ✅ Hooks React Query para gerenciamento de estado
- ✅ API clients para todas as funcionalidades
- ✅ Testes unitários e de integração
- ✅ Documentação completa

### 🔄 Em Desenvolvimento
- 🔄 Sistema de investimentos
- 🔄 Metas financeiras com gamificação
- 🔄 Notificações inteligentes
- 🔄 Relatórios avançados
- 🔄 Aplicativo mobile React Native

### ⏳ Planejado
- ⏳ Integrações externas (e-commerce, cashback)
- ⏳ API pública para desenvolvedores
- ⏳ Sistema de compliance avançado
- ⏳ Deploy em produção (AWS)

#### 1. Instalar Docker (Obrigatório)

Para executar a aplicação, você precisa instalar Docker:

**Windows:**
- Baixe Docker Desktop: https://www.docker.com/products/docker-desktop/
- Instale e reinicie o sistema
- Verifique a instalação: `docker --version`

**Linux:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
```

**macOS:**
- Baixe Docker Desktop: https://www.docker.com/products/docker-desktop/
- Instale via Homebrew: `brew install --cask docker`

#### 2. Configurar Variáveis de Ambiente

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.local.example frontend/.env.local
```

#### 3. Iniciar Serviços

```bash
# Iniciar PostgreSQL e Redis
docker-compose up -d postgres redis

# Instalar dependências (já feito)
npm install

# Gerar Prisma client e executar migrations
cd backend
npm run prisma:generate
npm run prisma:migrate
cd ..

# Iniciar desenvolvimento
npm run dev
```

## 🚀 Comandos Disponíveis

### Desenvolvimento
```bash
npm run dev              # Inicia backend + frontend
npm run dev:backend      # Apenas backend (porta 3001)
npm run dev:frontend     # Apenas frontend (porta 3000)
npm run dev:mobile       # Apenas mobile (Expo)
```

### Build e Produção
```bash
npm run build            # Build completo
npm run build:backend    # Build apenas backend
npm run build:frontend   # Build apenas frontend
npm run start            # Inicia em produção
```

### Docker
```bash
npm run docker:up        # Inicia PostgreSQL + Redis
npm run docker:down      # Para containers
npm run docker:logs      # Ver logs dos containers
npm run docker:clean     # Limpa volumes e imagens
```

### Banco de Dados
```bash
npm run db:migrate       # Executar migrations
npm run db:seed          # Popular dados iniciais
npm run db:reset         # Reset completo do banco
npm run db:studio        # Abrir Prisma Studio
```

### Testes
```bash
npm run test             # Todos os testes
npm run test:backend     # Testes do backend
npm run test:frontend    # Testes do frontend
npm run test:e2e         # Testes end-to-end
npm run test:watch       # Testes em modo watch
```

### Qualidade de Código
```bash
npm run lint             # ESLint em todos os projetos
npm run lint:fix         # Corrigir problemas automaticamente
npm run format           # Prettier em todos os arquivos
npm run type-check       # Verificação de tipos TypeScript
```

## 📁 Estrutura Criada

```
plataforma-financeira/
├── 📁 backend/                    # API NestJS
│   ├── 📁 src/
│   │   ├── 📁 modules/            # Módulos de negócio
│   │   │   └── 📁 auth/           # Autenticação (básico)
│   │   ├── 📁 common/             # Código compartilhado
│   │   │   └── 📁 prisma/         # Prisma service
│   │   ├── 📄 app.module.ts       # Módulo principal
│   │   └── 📄 main.ts             # Bootstrap
│   ├── 📁 prisma/
│   │   └── 📄 schema.prisma       # Schema do banco
│   ├── 📄 package.json
│   ├── 📄 Dockerfile
│   └── 📄 .env.example
│
├── 📁 frontend/                   # Web Next.js
│   ├── 📁 src/
│   │   ├── 📁 app/                # App Router
│   │   │   ├── 📄 layout.tsx      # Layout raiz
│   │   │   ├── 📄 page.tsx        # Homepage
│   │   │   └── 📄 globals.css     # Estilos globais
│   ├── 📄 package.json
│   ├── 📄 tailwind.config.js
│   ├── 📄 next.config.js
│   ├── 📄 Dockerfile
│   └── 📄 .env.local.example
│
├── 📁 shared/                     # Tipos compartilhados
│   ├── 📁 src/
│   │   ├── 📄 types/index.ts      # Interfaces TypeScript
│   │   └── 📄 schemas/index.ts    # Schemas Zod
│   └── 📄 package.json
│
├── 📁 mobile/                     # Placeholder React Native
├── 📁 docs/                       # Documentação
├── 📁 scripts/                    # Scripts de setup
├── 🐳 docker-compose.yml          # Orquestração
├── 📄 package.json                # Workspace root
└── 📄 README.md                   # Documentação principal
```

## 🔧 Tecnologias Configuradas

### Backend
- **NestJS** 10+ com TypeScript
- **Prisma** ORM com PostgreSQL
- **JWT** + Passport para autenticação
- **Redis** para cache e sessões
- **Swagger** para documentação da API
- **Docker** para containerização

### Frontend
- **Next.js** 14+ com App Router
- **TypeScript** para type safety
- **TailwindCSS** + Shadcn/ui para styling
- **React Query** para cache de dados
- **Zustand** para estado global
- **React Hook Form** + Zod para formulários

### DevOps
- **Docker Compose** para desenvolvimento
- **ESLint** + Prettier para qualidade de código
- **Jest** para testes
- **GitHub Actions** (configuração futura)

## 🎯 Próximas Implementações

Após instalar Docker e executar o setup, você pode começar a implementar as funcionalidades seguindo o arquivo `tasks.md`:

1. **Tarefa 2**: Configurar banco de dados e ORM
2. **Tarefa 3**: Configurar autenticação base
3. **Tarefa 4**: Configurar frontend base
4. E assim por diante...

## 🆘 Troubleshooting

### Docker não encontrado
- Instale Docker Desktop
- Reinicie o terminal/sistema
- Verifique PATH do sistema

### Erro de permissão no Docker (Linux)
```bash
sudo usermod -aG docker $USER
# Faça logout e login novamente
```

### Porta já em uso
```bash
# Verificar processos usando as portas
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001
netstat -tulpn | grep :5432
```

### Problemas com dependências
```bash
# Limpar e reinstalar
rm -rf node_modules package-lock.json
npm install
```

---

**Status**: ✅ Estrutura inicial configurada com sucesso!
**Próximo passo**: Instalar Docker e executar `npm run setup`