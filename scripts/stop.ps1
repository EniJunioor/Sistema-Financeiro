# Script para parar todos os projetos
# Uso: .\scripts\stop.ps1

Write-Host "🛑 Parando todos os serviços..." -ForegroundColor Yellow

# Parar processos do Node relacionados aos projetos
$processes = @(
    "node",
    "next",
    "nest",
    "expo"
)

foreach ($process in $processes) {
    $procs = Get-Process -Name $process -ErrorAction SilentlyContinue
    if ($procs) {
        Write-Host "  Parando processos $process..." -ForegroundColor Yellow
        $procs | Stop-Process -Force -ErrorAction SilentlyContinue
    }
}

# Parar containers Docker (opcional - descomente se quiser parar também)
# Write-Host "  Parando containers Docker..." -ForegroundColor Yellow
# docker-compose down

Write-Host "✅ Todos os serviços foram parados" -ForegroundColor Green
