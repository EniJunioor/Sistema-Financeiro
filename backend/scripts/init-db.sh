#!/bin/bash

# Script to initialize the database with Prisma migrations and seeds
# This script should be run after Docker containers are up and running

echo "🚀 Initializing Plataforma Financeira Database..."

# Check if PostgreSQL is running
echo "📡 Checking PostgreSQL connection..."
npx prisma db push --accept-data-loss

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful!"
else
    echo "❌ Failed to connect to database. Make sure PostgreSQL is running."
    echo "💡 Run: docker compose up -d postgres"
    exit 1
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Create initial migration
echo "📝 Creating initial migration..."
npx prisma migrate dev --name init --create-only

# Apply migrations
echo "⚡ Applying migrations..."
npx prisma migrate dev

# Run seeds
echo "🌱 Seeding database with initial data..."
npx prisma db seed

echo "✅ Database initialization completed successfully!"
echo ""
echo "📊 You can now:"
echo "  - View the database: npm run prisma:studio"
echo "  - Reset the database: npm run prisma:reset"
echo "  - Add new migrations: npm run prisma:migrate"
echo ""
echo "🔐 Demo user credentials:"
echo "  Email: demo@plataforma-financeira.com"
echo "  Password: demo123"