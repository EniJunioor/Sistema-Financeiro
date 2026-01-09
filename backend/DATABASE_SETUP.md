# 🗄️ Database Setup Guide - Plataforma Financeira

Este guia detalha como configurar o banco de dados PostgreSQL com Prisma ORM para a Plataforma Financeira.

## ✅ Status da Configuração

- ✅ **Prisma ORM**: Instalado e configurado
- ✅ **Schema**: Modelos User, Account, Transaction e outros criados
- ✅ **Seeds**: Script de dados iniciais criado
- ✅ **Docker**: Configuração PostgreSQL pronta
- ✅ **Scripts**: Automação de inicialização criada
- ✅ **Health Check**: Endpoint de verificação da conexão

## 🚀 Início Rápido

### 1. Pré-requisitos

```bash
# Verificar se Docker está instalado
docker --version

# Verificar se Node.js está instalado
node --version  # Deve ser 18+
```

### 2. Inicializar Banco de Dados

```bash
# 1. Iniciar PostgreSQL
docker compose up -d postgres

# 2. Aguardar inicialização (30 segundos)
timeout 30

# 3. Executar script de inicialização
cd backend

# Linux/Mac:
chmod +x scripts/init-db.sh
./scripts/init-db.sh

# Windows:
.\scripts\init-db.ps1
```

### 3. Verificar Configuração

```bash
# Testar conexão
npm run prisma:studio

# Verificar health check (após iniciar o backend)
curl http://localhost:3001/health
```

## 📋 Estrutura do Banco

### Modelos Principais

```
User (Usuários)
├── Account (Contas Bancárias)
│   └── Transaction (Transações)
├── Investment (Investimentos)
│   └── InvestmentTransaction (Operações)
├── Goal (Metas Financeiras)
├── Notification (Notificações)
└── Session (Sessões)

Category (Categorias)
└── Transaction (Transações)
```

### Relacionamentos

- **User** → **Account** (1:N)
- **Account** → **Transaction** (1:N)
- **User** → **Transaction** (1:N)
- **Category** → **Transaction** (1:N)
- **User** → **Investment** (1:N)
- **Investment** → **InvestmentTransaction** (1:N)

## 🔧 Comandos de Desenvolvimento

### Prisma CLI

```bash
# Gerar cliente Prisma
npm run prisma:generate

# Criar migração
npm run prisma:migrate

# Aplicar schema (desenvolvimento)
npx prisma db push

# Visualizar banco
npm run prisma:studio

# Executar seeds
npm run prisma:seed

# Resetar banco
npm run prisma:reset
```

### Docker

```bash
# Iniciar apenas PostgreSQL
docker compose up -d postgres

# Parar PostgreSQL
docker compose down postgres

# Ver logs do PostgreSQL
docker compose logs postgres

# Conectar ao PostgreSQL
docker exec -it plataforma-financeira-postgres psql -U postgres -d plataforma_financeira
```

## 📊 Dados de Demonstração

### Usuário Demo
```
Email: demo@plataforma-financeira.com
Senha: demo123
```

### Categorias Criadas
- **Receitas**: Salário, Freelance, Investimentos
- **Despesas**: Alimentação, Transporte, Moradia, Saúde, Educação, Lazer

### Contas Demo
- Conta Corrente: R$ 5.000,00
- Poupança: R$ 15.000,00
- Cartão de Crédito: -R$ 1.200,00

### Transações Demo
- Salário: +R$ 8.000,00
- Supermercado: -R$ 350,00
- Combustível: -R$ 120,00

## 🌍 Configuração de Ambiente

### Desenvolvimento (.env)
```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/plataforma_financeira"
REDIS_URL="redis://:redis123@localhost:6379"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
PORT=3001
NODE_ENV=development
```

### Produção
```env
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
REDIS_URL="rediss://user:password@host:6380"
JWT_SECRET="production-secret-key"
PORT=3001
NODE_ENV=production
```

## 🔍 Troubleshooting

### Erro: "Can't reach database server"

```bash
# Verificar se PostgreSQL está rodando
docker ps | grep postgres

# Se não estiver, iniciar:
docker compose up -d postgres

# Aguardar 30 segundos e tentar novamente
```

### Erro: "Environment variable not found: DATABASE_URL"

```bash
# Verificar se arquivo .env existe
ls -la backend/.env

# Se não existir, copiar do exemplo:
cp backend/.env.example backend/.env
```

### Erro: "Migration failed"

```bash
# Resetar banco e tentar novamente
npm run prisma:reset

# Ou aplicar schema diretamente:
npx prisma db push --accept-data-loss
```

### Erro: "Port 5432 already in use"

```bash
# Verificar processos usando a porta
netstat -tulpn | grep 5432

# Parar PostgreSQL local se estiver rodando
sudo systemctl stop postgresql

# Ou usar porta diferente no docker-compose.yml
```

## 📚 Próximos Passos

1. **Implementar Autenticação**: Módulo de auth com JWT
2. **Criar Controllers**: Endpoints para CRUD das entidades
3. **Adicionar Validações**: DTOs com class-validator
4. **Implementar Testes**: Testes unitários e de integração
5. **Configurar CI/CD**: Pipeline de deploy automático

## 🔗 Links Úteis

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [NestJS Prisma Recipe](https://docs.nestjs.com/recipes/prisma)
- [Docker Compose Reference](https://docs.docker.com/compose/)

---

✅ **Database setup completed successfully!**

O banco de dados está configurado e pronto para desenvolvimento. Execute `npm run prisma:studio` para visualizar os dados ou inicie o backend com `npm run start:dev` para testar a API.