# Database Setup - Plataforma Financeira

Este diretório contém a configuração do banco de dados usando Prisma ORM.

## 📋 Estrutura

```
prisma/
├── schema.prisma          # Schema do banco de dados
├── seed.ts               # Script de seed com dados iniciais
├── migrations/           # Migrações do banco (geradas automaticamente)
└── README.md            # Este arquivo
```

## 🚀 Configuração Inicial

### 1. Pré-requisitos

- Docker e Docker Compose instalados
- Node.js 18+ instalado
- PostgreSQL rodando (via Docker)

### 2. Iniciar o Banco de Dados

```bash
# Iniciar PostgreSQL via Docker
docker compose up -d postgres

# Aguardar alguns segundos para o PostgreSQL inicializar
```

### 3. Configurar o Banco

#### Opção A: Script Automático (Recomendado)

**Linux/Mac:**
```bash
chmod +x scripts/init-db.sh
./scripts/init-db.sh
```

**Windows:**
```powershell
.\scripts\init-db.ps1
```

#### Opção B: Comandos Manuais

```bash
# 1. Gerar o cliente Prisma
npm run prisma:generate

# 2. Aplicar o schema ao banco (primeira vez)
npx prisma db push

# 3. Criar migração inicial
npx prisma migrate dev --name init

# 4. Executar seeds
npm run prisma:seed
```

## 📊 Dados de Demonstração

O script de seed cria:

### 👤 Usuário Demo
- **Email:** demo@plataforma-financeira.com
- **Senha:** demo123

### 📂 Categorias Padrão
- **Receitas:** Salário, Freelance, Investimentos, Outros Rendimentos
- **Despesas:** Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Compras, Serviços

### 🏦 Contas Demo
- Conta Corrente Principal (R$ 5.000,00)
- Conta Poupança (R$ 15.000,00)
- Cartão de Crédito (-R$ 1.200,00)

### 💰 Transações Demo
- Salário mensal (R$ 8.000,00)
- Compras supermercado (R$ 350,00)
- Abastecimento (R$ 120,00)

### 🎯 Meta Demo
- Reserva de Emergência (R$ 30.000,00 meta, R$ 15.000,00 atual)

### 📈 Investimentos Demo
- PETR4: 100 ações
- ITSA4: 200 ações

## 🛠️ Comandos Úteis

```bash
# Visualizar banco no navegador
npm run prisma:studio

# Resetar banco (CUIDADO: apaga todos os dados)
npm run prisma:reset

# Criar nova migração
npm run prisma:migrate

# Aplicar migrações em produção
npm run prisma:deploy

# Executar seeds novamente
npm run prisma:seed

# Gerar cliente após mudanças no schema
npm run prisma:generate
```

## 🔧 Desenvolvimento

### Modificando o Schema

1. Edite `schema.prisma`
2. Execute `npx prisma migrate dev --name nome_da_mudanca`
3. O cliente Prisma será regenerado automaticamente

### Adicionando Dados de Seed

1. Edite `seed.ts`
2. Execute `npm run prisma:seed`

### Resetando o Banco

```bash
# Apaga tudo e recria do zero
npm run prisma:reset

# Ou manualmente:
npx prisma migrate reset --force
npm run prisma:seed
```

## 🌍 Ambientes

### Desenvolvimento
```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/plataforma_financeira"
```

### Produção
```env
DATABASE_URL="postgresql://user:password@host:5432/database"
```

## 📝 Modelos Principais

### User
- Autenticação e perfil do usuário
- Suporte a OAuth e 2FA

### Account
- Contas bancárias e cartões
- Integração com Open Banking

### Transaction
- Receitas, despesas e transferências
- Categorização automática com IA

### Investment
- Ações, fundos, ETFs, criptomoedas
- Cálculo de performance

### Goal
- Metas de economia e gastos
- Acompanhamento de progresso

## 🔒 Segurança

- Senhas hasheadas com bcrypt
- Tokens JWT para autenticação
- Soft delete para dados sensíveis
- Auditoria completa de alterações

## 📚 Documentação

- [Prisma Docs](https://www.prisma.io/docs/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [NestJS Prisma](https://docs.nestjs.com/recipes/prisma)