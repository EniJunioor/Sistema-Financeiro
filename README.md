# Plataforma Financeira

Uma plataforma moderna e segura para gestão financeira pessoal e de pequenos negócios com controle completo de receitas, despesas, metas, investimentos, planejamento financeiro e integração com bancos e corretoras.

## 🏗️ Arquitetura

### Stack Tecnológica

- **Backend**: NestJS + TypeScript + Prisma + PostgreSQL + Redis
- **Frontend**: Next.js + TypeScript + TailwindCSS + Shadcn/ui
- **Mobile**: React Native + Expo (futuro)
- **DevOps**: Docker + Docker Compose + GitHub Actions

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

- **User** - Usuários do sistema
- **Account** - Contas bancárias e cartões
- **Transaction** - Transações financeiras
- **Investment** - Investimentos e ativos
- **Goal** - Metas financeiras
- **Category** - Categorias de transações

## 🔧 Desenvolvimento

### Estrutura de Pastas

#### Backend (NestJS)
```
backend/src/
├── modules/           # Módulos de negócio
│   ├── auth/         # Autenticação
│   ├── users/        # Usuários
│   ├── transactions/ # Transações
│   └── investments/  # Investimentos
├── common/           # Código compartilhado
├── config/           # Configurações
└── database/         # Prisma schema e migrations
```

#### Frontend (Next.js)
```
frontend/src/
├── app/              # App Router (Next.js 14)
├── components/       # Componentes React
├── lib/              # Utilitários
├── hooks/            # Custom hooks
├── store/            # Estado global (Zustand)
└── types/            # Tipos TypeScript
```

### Padrões de Código

- **TypeScript** em todos os projetos
- **ESLint + Prettier** para qualidade de código
- **Conventional Commits** para mensagens de commit
- **Clean Architecture** no backend
- **Component-driven development** no frontend

## 🔒 Segurança

- Autenticação JWT + Refresh Tokens
- Validação de entrada com class-validator (backend) e Zod (frontend)
- Rate limiting e throttling
- Helmet.js para headers de segurança
- Criptografia de dados sensíveis

## 📊 Monitoramento

- Health checks em `/api/v1/health`
- Logs estruturados
- Métricas de performance (futuro)
- Error tracking com Sentry (futuro)

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