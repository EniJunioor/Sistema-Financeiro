# PowerShell script to initialize the database with Prisma migrations and seeds
# This script should be run after Docker containers are up and running

Write-Host "🚀 Initializing Plataforma Financeira Database..." -ForegroundColor Green

# Check if PostgreSQL is running
Write-Host "📡 Checking PostgreSQL connection..." -ForegroundColor Yellow
npx prisma db push --accept-data-loss

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database connection successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to connect to database. Make sure PostgreSQL is running." -ForegroundColor Red
    Write-Host "💡 Run: docker compose up -d postgres" -ForegroundColor Cyan
    exit 1
}

# Generate Prisma client
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

# Create initial migration
Write-Host "📝 Creating initial migration..." -ForegroundColor Yellow
npx prisma migrate dev --name init --create-only

# Apply migrations
Write-Host "⚡ Applying migrations..." -ForegroundColor Yellow
npx prisma migrate dev

# Run seeds
Write-Host "🌱 Seeding database with initial data..." -ForegroundColor Yellow
npx prisma db seed

Write-Host "✅ Database initialization completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 You can now:" -ForegroundColor Cyan
Write-Host "  - View the database: npm run prisma:studio" -ForegroundColor White
Write-Host "  - Reset the database: npm run prisma:reset" -ForegroundColor White
Write-Host "  - Add new migrations: npm run prisma:migrate" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Demo user credentials:" -ForegroundColor Cyan
Write-Host "  Email: demo@plataforma-financeira.com" -ForegroundColor White
Write-Host "  Password: demo123" -ForegroundColor White