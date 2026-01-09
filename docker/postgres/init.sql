-- Inicialização do banco de dados PostgreSQL
-- Este script é executado automaticamente quando o container é criado

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Configurações de performance
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET pg_stat_statements.track = 'all';

-- Configurar timezone
SET timezone = 'America/Sao_Paulo';