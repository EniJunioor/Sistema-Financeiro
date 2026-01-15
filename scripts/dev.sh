#!/bin/bash

# Script para rodar todos os projetos (Frontend, Backend e Mobile)
# Uso: ./scripts/dev.sh

set -e

echo "🚀 Iniciando todos os projetos..."
echo ""

# Verificar se estamos no diretório raiz
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script a partir do diretório raiz do projeto"
    exit 1
fi

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Verificar se Docker está rodando
echo "🐳 Verificando serviços Docker..."
if ! docker ps &> /dev/null; then
    echo "⚠️  Docker não está rodando. Certifique-se de que o Docker está iniciado."
    echo "   Você pode iniciar os serviços manualmente com: docker-compose up -d"
    exit 1
fi

# Verificar se os containers estão rodando
if ! docker ps --filter "name=postgres" --format "{{.Names}}" | grep -q "postgres"; then
    echo "⚠️  PostgreSQL não está rodando. Iniciando..."
    docker-compose up -d postgres redis
    sleep 5
fi
echo "✅ Docker está rodando"

# Função para limpar processos ao sair
cleanup() {
    echo ""
    echo "🛑 Parando todos os processos..."
    kill $MOBILE_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    wait 2>/dev/null || true
    echo "✅ Processos finalizados"
    exit 0
}

# Registrar handler para Ctrl+C
trap cleanup SIGINT SIGTERM

# Criar diretório de logs se não existir
mkdir -p logs

echo ""
echo "📱 Iniciando Mobile (Expo)..."
(cd mobile && npm start > ../logs/mobile.log 2>&1) &
MOBILE_PID=$!

echo "🔧 Iniciando Backend (NestJS)..."
(cd backend && npm run start:dev > ../logs/backend.log 2>&1) &
BACKEND_PID=$!

echo "🎨 Iniciando Frontend (Next.js)..."
(cd frontend && npm run dev > ../logs/frontend.log 2>&1) &
FRONTEND_PID=$!

echo ""
echo "✅ Todos os projetos estão iniciando..."
echo ""
echo "📍 Acessos:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:3001"
echo "  API Docs: http://localhost:3001/api/docs"
echo "  Mobile:   Expo DevTools será aberto automaticamente"
echo ""
echo "💡 Pressione Ctrl+C para parar todos os serviços"
echo ""
echo "📋 Logs:"
echo "  Mobile:   tail -f logs/mobile.log"
echo "  Backend:  tail -f logs/backend.log"
echo "  Frontend: tail -f logs/frontend.log"
echo ""

# Aguardar processos
wait
