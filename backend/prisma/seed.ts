import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create default categories
  const categories = [
    // Income categories
    { name: 'Salário', icon: '💰', color: '#10b981', isSystem: true },
    { name: 'Freelance', icon: '💼', color: '#3b82f6', isSystem: true },
    { name: 'Investimentos', icon: '📈', color: '#8b5cf6', isSystem: true },
    { name: 'Outros Rendimentos', icon: '💵', color: '#06b6d4', isSystem: true },

    // Expense categories
    { name: 'Alimentação', icon: '🍽️', color: '#ef4444', isSystem: true },
    { name: 'Transporte', icon: '🚗', color: '#f59e0b', isSystem: true },
    { name: 'Moradia', icon: '🏠', color: '#84cc16', isSystem: true },
    { name: 'Saúde', icon: '🏥', color: '#ec4899', isSystem: true },
    { name: 'Educação', icon: '📚', color: '#6366f1', isSystem: true },
    { name: 'Lazer', icon: '🎮', color: '#14b8a6', isSystem: true },
    { name: 'Compras', icon: '🛍️', color: '#f97316', isSystem: true },
    { name: 'Serviços', icon: '🔧', color: '#64748b', isSystem: true },
  ];

  console.log('📂 Creating default categories...');
  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }

  // Create subcategories
  const alimentacaoCategory = await prisma.category.findFirst({
    where: { name: 'Alimentação' },
  });

  const transporteCategory = await prisma.category.findFirst({
    where: { name: 'Transporte' },
  });

  const moradiaCategory = await prisma.category.findFirst({
    where: { name: 'Moradia' },
  });

  if (alimentacaoCategory) {
    const subcategoriesAlimentacao = [
      { name: 'Supermercado', icon: '🛒', color: '#ef4444', parentId: alimentacaoCategory.id, isSystem: true },
      { name: 'Restaurantes', icon: '🍽️', color: '#ef4444', parentId: alimentacaoCategory.id, isSystem: true },
      { name: 'Delivery', icon: '🚚', color: '#ef4444', parentId: alimentacaoCategory.id, isSystem: true },
    ];

    for (const subcategory of subcategoriesAlimentacao) {
      await prisma.category.upsert({
        where: { name: subcategory.name },
        update: {},
        create: subcategory,
      });
    }
  }

  if (transporteCategory) {
    const subcategoriesTransporte = [
      { name: 'Combustível', icon: '⛽', color: '#f59e0b', parentId: transporteCategory.id, isSystem: true },
      { name: 'Transporte Público', icon: '🚌', color: '#f59e0b', parentId: transporteCategory.id, isSystem: true },
      { name: 'Uber/Taxi', icon: '🚕', color: '#f59e0b', parentId: transporteCategory.id, isSystem: true },
    ];

    for (const subcategory of subcategoriesTransporte) {
      await prisma.category.upsert({
        where: { name: subcategory.name },
        update: {},
        create: subcategory,
      });
    }
  }

  if (moradiaCategory) {
    const subcategoriesMoradia = [
      { name: 'Aluguel', icon: '🏠', color: '#84cc16', parentId: moradiaCategory.id, isSystem: true },
      { name: 'Condomínio', icon: '🏢', color: '#84cc16', parentId: moradiaCategory.id, isSystem: true },
      { name: 'Energia', icon: '⚡', color: '#84cc16', parentId: moradiaCategory.id, isSystem: true },
      { name: 'Água', icon: '💧', color: '#84cc16', parentId: moradiaCategory.id, isSystem: true },
      { name: 'Internet', icon: '🌐', color: '#84cc16', parentId: moradiaCategory.id, isSystem: true },
    ];

    for (const subcategory of subcategoriesMoradia) {
      await prisma.category.upsert({
        where: { name: subcategory.name },
        update: {},
        create: subcategory,
      });
    }
  }

  // Create demo user (for development only)
  const hashedPassword = await bcrypt.hash('demo123', 10);
  
  console.log('👤 Creating demo user...');
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@plataforma-financeira.com' },
    update: {},
    create: {
      email: 'demo@plataforma-financeira.com',
      name: 'Usuário Demo',
      password: hashedPassword,
      emailVerified: new Date(),
    },
  });

  // Create demo accounts
  console.log('🏦 Creating demo accounts...');
  const contaCorrente = await prisma.account.upsert({
    where: { id: 'demo-conta-corrente' },
    update: {},
    create: {
      id: 'demo-conta-corrente',
      userId: demoUser.id,
      type: 'checking',
      provider: 'manual',
      name: 'Conta Corrente Principal',
      balance: 5000.00,
      currency: 'BRL',
    },
  });

  const contaPoupanca = await prisma.account.upsert({
    where: { id: 'demo-conta-poupanca' },
    update: {},
    create: {
      id: 'demo-conta-poupanca',
      userId: demoUser.id,
      type: 'savings',
      provider: 'manual',
      name: 'Conta Poupança',
      balance: 15000.00,
      currency: 'BRL',
    },
  });

  const cartaoCredito = await prisma.account.upsert({
    where: { id: 'demo-cartao-credito' },
    update: {},
    create: {
      id: 'demo-cartao-credito',
      userId: demoUser.id,
      type: 'credit_card',
      provider: 'manual',
      name: 'Cartão de Crédito',
      balance: -1200.00,
      currency: 'BRL',
    },
  });

  // Create demo transactions
  console.log('💰 Creating demo transactions...');
  const salarioCategory = await prisma.category.findFirst({
    where: { name: 'Salário' },
  });

  const supermercadoCategory = await prisma.category.findFirst({
    where: { name: 'Supermercado' },
  });

  const combustivelCategory = await prisma.category.findFirst({
    where: { name: 'Combustível' },
  });

  if (salarioCategory) {
    await prisma.transaction.create({
      data: {
        userId: demoUser.id,
        accountId: contaCorrente.id,
        categoryId: salarioCategory.id,
        type: 'income',
        amount: 8000.00,
        description: 'Salário Mensal',
        date: new Date('2024-01-01'),
        tags: 'trabalho,salário',
      },
    });
  }

  if (supermercadoCategory) {
    await prisma.transaction.create({
      data: {
        userId: demoUser.id,
        accountId: contaCorrente.id,
        categoryId: supermercadoCategory.id,
        type: 'expense',
        amount: 350.00,
        description: 'Compras do mês - Supermercado Extra',
        date: new Date('2024-01-02'),
        tags: 'alimentação,supermercado',
      },
    });
  }

  if (combustivelCategory) {
    await prisma.transaction.create({
      data: {
        userId: demoUser.id,
        accountId: contaCorrente.id,
        categoryId: combustivelCategory.id,
        type: 'expense',
        amount: 120.00,
        description: 'Abastecimento - Posto Shell',
        date: new Date('2024-01-03'),
        tags: 'transporte,combustível',
        location: 'Posto Shell - Av. Paulista',
      },
    });
  }

  // Create demo goal
  console.log('🎯 Creating demo goal...');
  await prisma.goal.create({
    data: {
      userId: demoUser.id,
      name: 'Reserva de Emergência',
      description: 'Juntar 6 meses de gastos para emergências',
      type: 'savings',
      targetAmount: 30000.00,
      currentAmount: 15000.00,
      targetDate: new Date('2024-12-31'),
    },
  });

  // Create demo investments
  console.log('📈 Creating demo investments...');
  await prisma.investment.create({
    data: {
      userId: demoUser.id,
      symbol: 'PETR4',
      name: 'Petrobras PN',
      type: 'stock',
      quantity: 100,
      averagePrice: 32.50,
      currentPrice: 35.20,
      currency: 'BRL',
      broker: 'XP Investimentos',
      sector: 'Energia',
    },
  });

  await prisma.investment.create({
    data: {
      userId: demoUser.id,
      symbol: 'ITSA4',
      name: 'Itaúsa PN',
      type: 'stock',
      quantity: 200,
      averagePrice: 9.80,
      currentPrice: 10.15,
      currency: 'BRL',
      broker: 'XP Investimentos',
      sector: 'Financeiro',
    },
  });

  console.log('✅ Database seeding completed successfully!');
  console.log(`
📊 Summary:
- Categories: ${categories.length} main categories created
- Demo user: demo@plataforma-financeira.com (password: demo123)
- Accounts: 3 demo accounts created
- Transactions: 3 demo transactions created
- Goals: 1 demo goal created
- Investments: 2 demo investments created
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });