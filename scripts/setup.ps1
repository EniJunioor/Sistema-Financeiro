# Setup script for Plataforma Financeira
Write-Host "🚀 Configurando Plataforma Financeira..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado. Por favor, instale Node.js 18+ primeiro." -ForegroundColor Red
    exit 1
}

# Check if Docker is installed
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker encontrado: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker não encontrado. Por favor, instale Docker primeiro." -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is installed
try {
    $composeVersion = docker-compose --version
    Write-Host "✅ Docker Compose encontrado: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose não encontrado. Por favor, instale Docker Compose primeiro." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Pré-requisitos verificados" -ForegroundColor Green

# Install dependencies
Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
npm install

# Copy environment files
Write-Host "⚙️ Configurando variáveis de ambiente..." -ForegroundColor Yellow
if (-not (Test-Path "backend/.env")) {
    Copy-Item "backend/.env.example" "backend/.env"
    Write-Host "✅ Arquivo backend/.env criado" -ForegroundColor Green
}

if (-not (Test-Path "frontend/.env.local")) {
    Copy-Item "frontend/.env.local.example" "frontend/.env.local"
    Write-Host "✅ Arquivo frontend/.env.local criado" -ForegroundColor Green
}

# Start Docker services
Write-Host "🐳 Iniciando serviços Docker..." -ForegroundColor Yellow
docker-compose up -d postgres redis

# Wait for PostgreSQL to be ready
Write-Host "⏳ Aguardando PostgreSQL inicializar..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Generate Prisma client and run migrations
Write-Host "🗄️ Configurando banco de dados..." -ForegroundColor Yellow
Set-Location backend
npm run prisma:generate
npm run prisma:migrate
Set-Location ..

Write-Host "🎉 Setup concluído com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "Para iniciar o desenvolvimento:" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Acessos:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:  http://localhost:3001" -ForegroundColor White
Write-Host "  API Docs: http://localhost:3001/api/docs" -ForegroundColor White