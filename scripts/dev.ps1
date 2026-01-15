# Script para rodar todos os projetos (Frontend, Backend e Mobile)
# Uso: .\scripts\dev.ps1

Write-Host "🚀 Iniciando todos os projetos..." -ForegroundColor Green
Write-Host ""

# Verificar se estamos no diretório raiz
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Execute este script a partir do diretório raiz do projeto" -ForegroundColor Red
    exit 1
}

# Verificar se as dependências estão instaladas
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
    npm install
}

# Verificar se Docker está rodando
Write-Host "🐳 Verificando serviços Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✅ Docker está rodando" -ForegroundColor Green
    
    # Verificar se os containers estão rodando
    $postgresRunning = docker ps --filter "name=postgres" --format "{{.Names}}" | Select-String "postgres"
    if (-not $postgresRunning) {
        Write-Host "⚠️  PostgreSQL não está rodando. Iniciando..." -ForegroundColor Yellow
        docker-compose up -d postgres redis
        Start-Sleep -Seconds 5
    }
} catch {
    Write-Host "⚠️  Docker não está rodando. Certifique-se de que o Docker Desktop está iniciado." -ForegroundColor Yellow
    Write-Host "   Você pode iniciar os serviços manualmente com: docker-compose up -d" -ForegroundColor Yellow
}

# Função para limpar processos ao sair
function Cleanup {
    Write-Host ""
    Write-Host "🛑 Parando todos os processos..." -ForegroundColor Yellow
    Get-Job | Stop-Job
    Get-Job | Remove-Job
    Write-Host "✅ Processos finalizados" -ForegroundColor Green
}

# Registrar handler para Ctrl+C
$null = Register-EngineEvent PowerShell.Exiting -Action { Cleanup }

Write-Host ""
Write-Host "📱 Iniciando Mobile (Expo)..." -ForegroundColor Cyan
$mobileJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location mobile
    npm start
}

Write-Host "🔧 Iniciando Backend (NestJS)..." -ForegroundColor Cyan
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location backend
    npm run start:dev
}

Write-Host "🎨 Iniciando Frontend (Next.js)..." -ForegroundColor Cyan
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location frontend
    npm run dev
}

Write-Host ""
Write-Host "✅ Todos os projetos estão iniciando..." -ForegroundColor Green
Write-Host ""
Write-Host "📍 Acessos:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:  http://localhost:3001" -ForegroundColor White
Write-Host "  API Docs: http://localhost:3001/api/docs" -ForegroundColor White
Write-Host "  Mobile:   Expo DevTools será aberto automaticamente" -ForegroundColor White
Write-Host ""
Write-Host "💡 Pressione Ctrl+C para parar todos os serviços" -ForegroundColor Yellow
Write-Host ""

# Monitorar jobs e mostrar output
try {
    while ($true) {
        Start-Sleep -Seconds 2
        
        # Mostrar output dos jobs
        $mobileJob | Receive-Job -ErrorAction SilentlyContinue | ForEach-Object {
            Write-Host "[MOBILE] $_" -ForegroundColor Magenta
        }
        
        $backendJob | Receive-Job -ErrorAction SilentlyContinue | ForEach-Object {
            Write-Host "[BACKEND] $_" -ForegroundColor Blue
        }
        
        $frontendJob | Receive-Job -ErrorAction SilentlyContinue | ForEach-Object {
            Write-Host "[FRONTEND] $_" -ForegroundColor Green
        }
        
        # Verificar se algum job terminou
        if ($mobileJob.State -eq "Failed" -or $backendJob.State -eq "Failed" -or $frontendJob.State -eq "Failed") {
            Write-Host ""
            Write-Host "❌ Um dos serviços falhou. Verifique os logs acima." -ForegroundColor Red
            Cleanup
            exit 1
        }
    }
} catch {
    Write-Host ""
    Write-Host "⚠️  Interrompido pelo usuário" -ForegroundColor Yellow
} finally {
    Cleanup
}
