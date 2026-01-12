# 🚀 Guia de Deploy - Plataforma Financeira

## 🎯 Visão Geral

Este guia fornece instruções detalhadas para fazer deploy da Plataforma Financeira em diferentes ambientes, desde desenvolvimento local até produção em nuvem.

## 🏗️ Arquitetura de Deploy

### Ambientes

1. **Desenvolvimento Local** - Docker Compose
2. **Staging** - AWS ECS com RDS
3. **Produção** - AWS ECS com Multi-AZ RDS
4. **Preview** - Vercel (frontend) + Railway (backend)

### Componentes

- **Frontend**: Next.js (Vercel/CloudFront)
- **Backend**: NestJS (ECS/EC2)
- **Database**: PostgreSQL (RDS)
- **Cache**: Redis (ElastiCache)
- **Storage**: S3 para arquivos
- **CDN**: CloudFront
- **Monitoring**: DataDog/Sentry

## 🐳 Docker

### Desenvolvimento Local

```bash
# Iniciar todos os serviços
docker-compose up -d

# Apenas banco e cache
docker-compose up -d postgres redis

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

### Docker Compose Completo

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: plataforma_financeira
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/plataforma_financeira
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
```

### Dockerfiles

#### Backend Dockerfile
```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production && npm cache clean --force

COPY . .
RUN npm run build
RUN npx prisma generate

FROM node:18-alpine AS runner

WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

USER nestjs
EXPOSE 3001

CMD ["npm", "run", "start:prod"]
```

#### Frontend Dockerfile
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
```

## ☁️ AWS Deploy

### Pré-requisitos

```bash
# Instalar AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configurar credenciais
aws configure

# Instalar Terraform
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/
```

### Infraestrutura como Código (Terraform)

```hcl
# terraform/main.tf
provider "aws" {
  region = var.aws_region
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "plataforma-financeira-vpc"
  }
}

# Subnets
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "plataforma-financeira-private-${count.index + 1}"
  }
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 10}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "plataforma-financeira-public-${count.index + 1}"
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier     = "plataforma-financeira-db"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.micro"
  
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_encrypted     = true
  
  db_name  = "plataforma_financeira"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = false
  final_snapshot_identifier = "plataforma-financeira-final-snapshot"
  
  tags = {
    Name = "plataforma-financeira-db"
  }
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "main" {
  name       = "plataforma-financeira-cache-subnet"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "plataforma-financeira-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "plataforma-financeira"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# ECS Task Definition - Backend
resource "aws_ecs_task_definition" "backend" {
  family                   = "plataforma-financeira-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn           = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "backend"
      image = "${aws_ecr_repository.backend.repository_url}:latest"
      
      portMappings = [
        {
          containerPort = 3001
          protocol      = "tcp"
        }
      ]
      
      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "DATABASE_URL"
          value = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.postgres.endpoint}:5432/plataforma_financeira"
        },
        {
          name  = "REDIS_URL"
          value = "redis://${aws_elasticache_cluster.redis.cache_nodes[0].address}:6379"
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.backend.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
}

# ECS Service - Backend
resource "aws_ecs_service" "backend" {
  name            = "plataforma-financeira-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.backend.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 3001
  }

  depends_on = [aws_lb_listener.backend]
}
```

### Deploy Script

```bash
#!/bin/bash
# scripts/deploy-aws.sh

set -e

echo "🚀 Iniciando deploy para AWS..."

# Variáveis
AWS_REGION="us-east-1"
ECR_BACKEND_REPO="plataforma-financeira-backend"
ECR_FRONTEND_REPO="plataforma-financeira-frontend"
ECS_CLUSTER="plataforma-financeira"
ECS_SERVICE_BACKEND="plataforma-financeira-backend"

# Build e push das imagens Docker
echo "📦 Building e pushing imagens Docker..."

# Backend
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

docker build -t $ECR_BACKEND_REPO ./backend
docker tag $ECR_BACKEND_REPO:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_BACKEND_REPO:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_BACKEND_REPO:latest

# Atualizar ECS Service
echo "🔄 Atualizando ECS Service..."
aws ecs update-service \
  --cluster $ECS_CLUSTER \
  --service $ECS_SERVICE_BACKEND \
  --force-new-deployment

# Aguardar deploy
echo "⏳ Aguardando deploy..."
aws ecs wait services-stable \
  --cluster $ECS_CLUSTER \
  --services $ECS_SERVICE_BACKEND

echo "✅ Deploy concluído com sucesso!"
```

## 🌐 Vercel (Frontend)

### Configuração

```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "env": {
    "NEXTAUTH_URL": "@nextauth-url",
    "NEXTAUTH_SECRET": "@nextauth-secret",
    "NEXT_PUBLIC_API_URL": "@api-url"
  },
  "build": {
    "env": {
      "NEXTAUTH_URL": "@nextauth-url",
      "NEXTAUTH_SECRET": "@nextauth-secret",
      "NEXT_PUBLIC_API_URL": "@api-url"
    }
  }
}
```

### Deploy Automático

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Configurar domínio customizado
vercel domains add plataforma-financeira.com
```

## 🔧 Railway (Backend Alternativo)

### railway.json

```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "backend/Dockerfile"
  },
  "deploy": {
    "startCommand": "npm run start:prod",
    "healthcheckPath": "/api/v1/health"
  }
}
```

### Deploy

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

## 📊 Monitoramento

### Health Checks

```typescript
// backend/src/health/health.controller.ts
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private redis: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redis.pingCheck('redis'),
    ]);
  }
}
```

### Logs Estruturados

```typescript
// backend/src/common/logger/logger.service.ts
@Injectable()
export class LoggerService {
  private logger = winston.createLogger({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' }),
    ],
  });

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }
}
```

### Métricas (Prometheus)

```typescript
// backend/src/metrics/metrics.service.ts
@Injectable()
export class MetricsService {
  private httpRequestDuration = new prometheus.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status'],
  });

  recordHttpRequest(method: string, route: string, status: number, duration: number) {
    this.httpRequestDuration
      .labels(method, route, status.toString())
      .observe(duration);
  }
}
```

## 🔒 Segurança em Produção

### Variáveis de Ambiente

```bash
# Produção - Nunca commitar
DATABASE_URL=postgresql://user:password@prod-db:5432/db
REDIS_URL=redis://prod-redis:6379
JWT_SECRET=super-secret-jwt-key-256-bits
NEXTAUTH_SECRET=super-secret-nextauth-key

# OAuth Produção
GOOGLE_CLIENT_ID=prod-google-client-id
GOOGLE_CLIENT_SECRET=prod-google-client-secret

# AWS
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_BUCKET=plataforma-financeira-prod

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
DATADOG_API_KEY=...
```

### SSL/TLS

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name plataforma-financeira.com;

    ssl_certificate /etc/ssl/certs/plataforma-financeira.crt;
    ssl_certificate_key /etc/ssl/private/plataforma-financeira.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;

    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://backend:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Erro de Conexão com Banco
```bash
# Verificar conectividade
telnet db-host 5432

# Verificar logs
docker logs container-name

# Testar conexão
psql -h db-host -U username -d database
```

#### 2. Erro de Memória (OOM)
```bash
# Verificar uso de memória
docker stats

# Aumentar limite
docker run -m 1g your-image

# ECS - Aumentar memory na task definition
```

#### 3. Erro de SSL
```bash
# Verificar certificado
openssl x509 -in cert.pem -text -noout

# Testar SSL
curl -I https://seu-dominio.com
```

### Comandos Úteis

```bash
# Ver logs em tempo real
docker logs -f container-name

# Executar comando no container
docker exec -it container-name bash

# Backup do banco
pg_dump -h host -U user database > backup.sql

# Restore do banco
psql -h host -U user database < backup.sql

# Verificar saúde da aplicação
curl http://localhost:3001/api/v1/health

# Monitorar recursos
htop
iostat -x 1
```

## 📋 Checklist de Deploy

### Pré-Deploy
- [ ] Testes passando (unit, integration, e2e)
- [ ] Build sem erros
- [ ] Variáveis de ambiente configuradas
- [ ] Backup do banco de dados
- [ ] Certificados SSL válidos
- [ ] DNS configurado

### Deploy
- [ ] Build das imagens Docker
- [ ] Push para registry
- [ ] Atualização dos serviços
- [ ] Verificação de health checks
- [ ] Teste de smoke

### Pós-Deploy
- [ ] Monitoramento ativo
- [ ] Logs sem erros críticos
- [ ] Performance dentro do esperado
- [ ] Funcionalidades críticas testadas
- [ ] Rollback plan preparado

---

Para mais informações sobre desenvolvimento, consulte o [Guia de Desenvolvimento](./DEVELOPMENT.md).