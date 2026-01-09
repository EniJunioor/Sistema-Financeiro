#!/bin/bash

# Setup script for Plataforma Financeira
echo "🚀 Configurando Plataforma Financeira..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale Node.js 18+ primeiro."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Por favor, instale Docker primeiro."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não encontrado. Por favor, instale Docker Compose primeiro."
    exit 1
fi

echo "✅ Pré-requisitos verificados"

# Install dependencies
echo "📦 Instalando dependências..."
npm install

# Copy environment files
echo "⚙️ Configurando variáveis de ambiente..."
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "✅ Arquivo backend/.env criado"
fi

if [ ! -f frontend/.env.local ]; then
    cp frontend/.env.local.example frontend/.env.local
    echo "✅ Arquivo frontend/.env.local criado"
fi

# Start Docker services
echo "🐳 Iniciando serviços Docker..."
docker-compose up -d postgres redis

# Wait for PostgreSQL to be ready
echo "⏳ Aguardando PostgreSQL inicializar..."
sleep 10

# Generate Prisma client and run migrations
echo "🗄️ Configurando banco de dados..."
cd backend
npm run prisma:generate
npm run prisma:migrate
cd ..

echo "🎉 Setup concluído com sucesso!"
echo ""
echo "Para iniciar o desenvolvimento:"
echo "  npm run dev"
echo ""
echo "Acessos:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:3001"
echo "  API Docs: http://localhost:3001/api/docs"