# Scripts de Desenvolvimento

Scripts para facilitar o desenvolvimento da Plataforma Financeira.

## 🚀 Scripts Disponíveis

### Windows (PowerShell)

```powershell
# Rodar todos os projetos (Frontend, Backend e Mobile)
.\scripts\dev.ps1
```

### Linux/Mac (Bash)

```bash
# Dar permissão de execução (apenas na primeira vez)
chmod +x scripts/dev.sh

# Rodar todos os projetos
./scripts/dev.sh
```

### NPM (Funciona em todos os sistemas)

```bash
# Rodar todos os projetos usando concurrently
npm run dev

# Ou explicitamente
npm run dev:all
```

## 📋 O que cada script faz

### `dev.ps1` / `dev.sh`
- ✅ Verifica se as dependências estão instaladas
- ✅ Verifica e inicia serviços Docker (PostgreSQL, Redis)
- ✅ Inicia o Backend (NestJS) na porta 3001
- ✅ Inicia o Frontend (Next.js) na porta 3000
- ✅ Inicia o Mobile (Expo)
- ✅ Mostra logs de todos os serviços
- ✅ Permite parar todos os serviços com Ctrl+C

## 🌐 Acessos

Após iniciar os projetos:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api/docs
- **Mobile**: Expo DevTools será aberto automaticamente

## 🛑 Parar os Serviços

- **PowerShell/Bash**: Pressione `Ctrl+C` no terminal
- **NPM**: Pressione `Ctrl+C` no terminal

## 📝 Notas

- Certifique-se de que o Docker está rodando antes de executar os scripts
- O script PowerShell usa Jobs do PowerShell para gerenciar processos
- O script Bash usa processos em background e redireciona logs para arquivos
- O script NPM usa `concurrently` para rodar todos os comandos simultaneamente

## 🔧 Troubleshooting

### Erro: "Port already in use"
Se alguma porta estiver em uso, você pode:
1. Parar o processo que está usando a porta
2. Ou modificar as portas nos arquivos de configuração

### Erro: "Docker not running"
Certifique-se de que o Docker Desktop está rodando antes de executar os scripts.

### Erro: "Module not found"
Execute `npm install` na raiz do projeto e em cada subprojeto se necessário.
