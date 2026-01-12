# 📡 Documentação da API - Plataforma Financeira

## 🎯 Visão Geral

A API da Plataforma Financeira é construída com NestJS e segue padrões REST com documentação OpenAPI/Swagger. Todas as rotas são protegidas por autenticação JWT, exceto as rotas públicas de autenticação.

## 🔗 URLs Base

- **Desenvolvimento**: `http://localhost:3001/api/v1`
- **Produção**: `https://api.plataforma-financeira.com/api/v1`
- **Documentação Swagger**: `/api/docs`

## 🔐 Autenticação

### JWT Bearer Token

Todas as rotas protegidas requerem um token JWT no header:

```http
Authorization: Bearer <jwt_token>
```

### Refresh Token

Para renovar tokens expirados:

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your_refresh_token"
}
```

## 📋 Endpoints Principais

### 🔐 Autenticação (`/auth`)

#### Registro
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "MinhaSenh@123"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "joao@example.com",
  "password": "MinhaSenh@123"
}
```

#### OAuth (Google, Facebook, etc.)
```http
GET /api/v1/auth/google
GET /api/v1/auth/facebook
GET /api/v1/auth/microsoft
GET /api/v1/auth/apple
```

#### 2FA Setup
```http
POST /api/v1/auth/2fa/setup
Authorization: Bearer <token>

{
  "method": "totp" | "sms" | "email"
}
```

### 🏦 Contas Bancárias (`/accounts`)

#### Listar Contas
```http
GET /api/v1/accounts
Authorization: Bearer <token>
Query Parameters:
  - type: checking | savings | credit_card | investment
  - provider: plaid | truelayer | pluggy | belvo
  - isActive: true | false
```

#### Conectar Nova Conta
```http
POST /api/v1/accounts/connect
Authorization: Bearer <token>
Content-Type: application/json

{
  "provider": "plaid",
  "authCode": "auth_code_from_oauth",
  "redirectUri": "https://app.example.com/callback"
}
```

#### Sincronizar Conta
```http
POST /api/v1/accounts/{accountId}/sync
Authorization: Bearer <token>
Content-Type: application/json

{
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-12-31T23:59:59.999Z",
  "forceFullSync": false
}
```

#### Transações da Conta
```http
GET /api/v1/accounts/{accountId}/transactions
Authorization: Bearer <token>
Query Parameters:
  - startDate: 2024-01-01
  - endDate: 2024-12-31
  - status: pending | approved | rejected
```

### 💰 Transações (`/transactions`)

#### Listar Transações
```http
GET /api/v1/transactions
Authorization: Bearer <token>
Query Parameters:
  - page: 1
  - limit: 20
  - type: income | expense | transfer
  - categoryId: uuid
  - accountId: uuid
  - dateFrom: 2024-01-01
  - dateTo: 2024-12-31
  - search: texto de busca
```

#### Criar Transação
```http
POST /api/v1/transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "expense",
  "amount": 150.50,
  "description": "Supermercado",
  "date": "2024-01-15T10:30:00.000Z",
  "accountId": "account_uuid",
  "categoryId": "category_uuid",
  "tags": ["alimentação", "casa"],
  "location": "São Paulo, SP"
}
```

#### Categorização Automática
```http
POST /api/v1/transactions/categorize
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Pagamento Netflix",
  "amount": 29.90
}
```

#### Deduplicação
```http
POST /api/v1/transactions/deduplicate
Authorization: Bearer <token>
Content-Type: application/json

{
  "transactionIds": ["uuid1", "uuid2"],
  "action": "merge" | "keep_first" | "keep_last"
}
```

### 📊 Dashboard (`/dashboard`)

#### Resumo Financeiro
```http
GET /api/v1/dashboard/summary
Authorization: Bearer <token>
Query Parameters:
  - startDate: 2024-01-01
  - endDate: 2024-12-31
  - groupBy: day | week | month | quarter | year
```

#### Analytics
```http
GET /api/v1/dashboard/analytics
Authorization: Bearer <token>
Query Parameters:
  - period: 1M | 3M | 6M | 1Y | ALL
  - categories: uuid1,uuid2,uuid3
  - accounts: uuid1,uuid2,uuid3
```

#### Previsões IA
```http
GET /api/v1/dashboard/forecast
Authorization: Bearer <token>
Query Parameters:
  - type: expenses | income | balance
  - period: 1M | 3M | 6M | 1Y
  - confidence: 0.8 | 0.9 | 0.95
```

### 📈 Investimentos (`/investments`)

#### Listar Investimentos
```http
GET /api/v1/investments
Authorization: Bearer <token>
Query Parameters:
  - type: stock | fund | etf | crypto | bond
  - broker: xp | rico | clear | btg
```

#### Adicionar Investimento
```http
POST /api/v1/investments
Authorization: Bearer <token>
Content-Type: application/json

{
  "symbol": "PETR4",
  "name": "Petrobras PN",
  "type": "stock",
  "quantity": 100,
  "averagePrice": 32.50,
  "broker": "xp",
  "sector": "energia"
}
```

#### Cotações em Tempo Real
```http
GET /api/v1/investments/quotes
Authorization: Bearer <token>
Query Parameters:
  - symbols: PETR4,VALE3,ITUB4
  - provider: yahoo | alpha_vantage | polygon
```

### 🎯 Metas (`/goals`)

#### Listar Metas
```http
GET /api/v1/goals
Authorization: Bearer <token>
Query Parameters:
  - type: savings | spending_limit | investment
  - status: active | completed | paused
```

#### Criar Meta
```http
POST /api/v1/goals
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Viagem para Europa",
  "description": "Economizar para viagem de férias",
  "type": "savings",
  "targetAmount": 15000.00,
  "targetDate": "2024-12-31T23:59:59.999Z",
  "categoryId": "travel_category_uuid"
}
```

### 📋 Relatórios (`/reports`)

#### Gerar Relatório
```http
POST /api/v1/reports/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "monthly" | "annual" | "custom",
  "format": "pdf" | "excel" | "csv",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "includeCharts": true,
  "categories": ["uuid1", "uuid2"],
  "accounts": ["uuid1", "uuid2"]
}
```

#### Agendar Relatório
```http
POST /api/v1/reports/schedule
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Relatório Mensal",
  "template": "monthly_summary",
  "frequency": "monthly",
  "dayOfMonth": 1,
  "email": "joao@example.com",
  "format": "pdf"
}
```

### 🔒 Segurança (`/security`)

#### Status de Segurança
```http
GET /api/v1/security/status
Authorization: Bearer <token>
```

#### Logs de Auditoria (Admin)
```http
GET /api/v1/security/audit/logs
Authorization: Bearer <admin_token>
Query Parameters:
  - userId: uuid
  - action: login | logout | data_access
  - startDate: 2024-01-01
  - endDate: 2024-12-31
  - riskLevel: LOW | MEDIUM | HIGH | CRITICAL
```

#### Criptografar Dados
```http
POST /api/v1/security/encrypt
Authorization: Bearer <token>
Content-Type: application/json

{
  "data": "dados sensíveis para criptografar",
  "useChaCha20": false
}
```

#### Descriptografar Dados
```http
POST /api/v1/security/decrypt
Authorization: Bearer <token>
Content-Type: application/json

{
  "encrypted": "dados_criptografados_hex",
  "iv": "initialization_vector_hex",
  "tag": "auth_tag_hex",
  "algorithm": "aes-256-gcm"
}
```

#### HSM - Criptografia com Hardware
```http
POST /api/v1/security/hsm/encrypt
Authorization: Bearer <token>
Content-Type: application/json

{
  "data": "dados para criptografar no HSM",
  "keyId": "hsm-key-id-optional"
}
```

#### HSM - Assinatura Digital
```http
POST /api/v1/security/hsm/sign
Authorization: Bearer <token>
Content-Type: application/json

{
  "data": "dados para assinar",
  "keyId": "hsm-key-id-optional",
  "algorithm": "RSASSA_PSS_SHA_256"
}
```

#### Informações do Certificado TLS
```http
GET /api/v1/security/certificate/info
Authorization: Bearer <token>
```

#### Health Check de Segurança
```http
GET /api/v1/security/health
Authorization: Bearer <token>
```

## 📊 Códigos de Status HTTP

| Código | Significado | Uso |
|--------|-------------|-----|
| 200 | OK | Sucesso em GET, PUT |
| 201 | Created | Sucesso em POST |
| 204 | No Content | Sucesso em DELETE |
| 400 | Bad Request | Dados inválidos |
| 401 | Unauthorized | Token inválido/expirado |
| 403 | Forbidden | Sem permissão |
| 404 | Not Found | Recurso não encontrado |
| 409 | Conflict | Conflito (ex: duplicata) |
| 422 | Unprocessable Entity | Validação falhou |
| 429 | Too Many Requests | Rate limit excedido |
| 500 | Internal Server Error | Erro interno |

## 🔄 Paginação

Todas as listagens suportam paginação:

```http
GET /api/v1/transactions?page=1&limit=20
```

Resposta:
```json
{
  "data": [...],
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8
}
```

## 🔍 Filtros e Busca

### Filtros por Data
```http
GET /api/v1/transactions?dateFrom=2024-01-01&dateTo=2024-12-31
```

### Busca Full-text
```http
GET /api/v1/transactions?search=supermercado
```

### Filtros Múltiplos
```http
GET /api/v1/transactions?type=expense&categoryId=uuid&amountMin=100&amountMax=500
```

## 🚨 Tratamento de Erros

Formato padrão de erro:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos fornecidos",
    "details": {
      "field": "email",
      "message": "Email deve ser válido"
    },
    "timestamp": "2024-01-15T10:30:00.000Z",
    "path": "/api/v1/auth/register"
  }
}
```

### Códigos de Erro Comuns

| Código | Descrição |
|--------|-----------|
| `INVALID_CREDENTIALS` | Email/senha incorretos |
| `TOKEN_EXPIRED` | JWT expirado |
| `VALIDATION_ERROR` | Dados inválidos |
| `INSUFFICIENT_BALANCE` | Saldo insuficiente |
| `DUPLICATE_TRANSACTION` | Transação duplicada |
| `BANK_CONNECTION_FAILED` | Falha na conexão bancária |
| `RATE_LIMIT_EXCEEDED` | Muitas requisições |

## 🔐 Rate Limiting

| Endpoint | Limite | Janela |
|----------|--------|--------|
| `/auth/login` | 5 tentativas | 15 minutos |
| `/auth/register` | 3 tentativas | 1 hora |
| `/transactions` | 100 req | 1 minuto |
| `/accounts/sync` | 10 req | 1 minuto |
| `/security/*` | 50 req | 1 minuto |
| Geral | 1000 req | 1 hora |

## 📝 Webhooks

Para receber notificações de eventos:

```http
POST /api/v1/webhooks/register
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://seu-app.com/webhooks/plataforma-financeira",
  "events": [
    "transaction.created",
    "account.synced",
    "goal.completed"
  ],
  "secret": "webhook_secret_key"
}
```

### Eventos Disponíveis

- `transaction.created` - Nova transação
- `transaction.updated` - Transação atualizada
- `account.connected` - Conta conectada
- `account.synced` - Conta sincronizada
- `goal.completed` - Meta atingida
- `investment.updated` - Investimento atualizado

## 🧪 Ambiente de Testes

Base URL: `http://localhost:3001/api/v1`

### Dados de Teste

```json
{
  "testUser": {
    "email": "test@example.com",
    "password": "Test123!@#"
  },
  "testAccount": {
    "id": "test-account-uuid",
    "name": "Conta Teste",
    "balance": 1000.00
  }
}
```

## 📚 SDKs e Bibliotecas

### JavaScript/TypeScript
```bash
npm install @plataforma-financeira/sdk
```

```typescript
import { PlataformaFinanceiraSDK } from '@plataforma-financeira/sdk';

const client = new PlataformaFinanceiraSDK({
  apiKey: 'your_api_key',
  baseURL: 'https://api.plataforma-financeira.com'
});

const transactions = await client.transactions.list({
  page: 1,
  limit: 20
});
```

### Python
```bash
pip install plataforma-financeira-python
```

```python
from plataforma_financeira import Client

client = Client(api_key='your_api_key')
transactions = client.transactions.list(page=1, limit=20)
```

## 🔧 Ferramentas de Desenvolvimento

### Postman Collection
Importe nossa collection: [Download](./postman/plataforma-financeira.json)

### Insomnia Workspace
Importe nosso workspace: [Download](./insomnia/plataforma-financeira.json)

### OpenAPI Spec
Acesse: `http://localhost:3001/api/docs-json`

---

Para mais informações, consulte a [documentação completa](./DEVELOPMENT.md) ou entre em contato com a equipe de desenvolvimento.