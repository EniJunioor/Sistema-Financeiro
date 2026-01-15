#!/bin/bash

# Script para parar todos os projetos
# Uso: ./scripts/stop.sh

echo "🛑 Parando todos os serviços..."

# Parar processos do Node relacionados aos projetos
pkill -f "next dev" 2>/dev/null || true
pkill -f "nest start" 2>/dev/null || true
pkill -f "expo start" 2>/dev/null || true
pkill -f "node.*backend" 2>/dev/null || true
pkill -f "node.*frontend" 2>/dev/null || true
pkill -f "node.*mobile" 2>/dev/null || true

# Parar containers Docker (opcional - descomente se quiser parar também)
# echo "  Parando containers Docker..."
# docker-compose down

echo "✅ Todos os serviços foram parados"
