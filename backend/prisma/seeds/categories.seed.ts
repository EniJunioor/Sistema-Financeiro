import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedCategories() {
  console.log('Seeding categories...');

  // Main categories
  const mainCategories = [
    { name: 'Alimentação', icon: '🍽️', color: '#10b981' },
    { name: 'Transporte', icon: '🚗', color: '#3b82f6' },
    { name: 'Moradia', icon: '🏠', color: '#8b5cf6' },
    { name: 'Saúde', icon: '🏥', color: '#ef4444' },
    { name: 'Educação', icon: '📚', color: '#f59e0b' },
    { name: 'Entretenimento', icon: '🎬', color: '#ec4899' },
    { name: 'Compras', icon: '🛍️', color: '#06b6d4' },
    { name: 'Serviços', icon: '🔧', color: '#84cc16' },
    { name: 'Investimentos', icon: '📈', color: '#6366f1' },
    { name: 'Outros', icon: '📦', color: '#6b7280' },
  ];

  const createdCategories = new Map();

  for (const category of mainCategories) {
    const created = await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: {
        ...category,
        isSystem: true,
      }
    });
    createdCategories.set(category.name, created);
    console.log(`Created category: ${category.name}`);
  }

  // Subcategories
  const subcategories = [
    // Alimentação
    { name: 'Supermercado', parent: 'Alimentação', icon: '🛒' },
    { name: 'Restaurante', parent: 'Alimentação', icon: '🍽️' },
    { name: 'Delivery', parent: 'Alimentação', icon: '🚚' },
    { name: 'Padaria', parent: 'Alimentação', icon: '🥖' },
    { name: 'Lanchonete', parent: 'Alimentação', icon: '🍔' },
    
    // Transporte
    { name: 'Combustível', parent: 'Transporte', icon: '⛽' },
    { name: 'Transporte Público', parent: 'Transporte', icon: '🚌' },
    { name: 'Uber/Taxi', parent: 'Transporte', icon: '🚕' },
    { name: 'Estacionamento', parent: 'Transporte', icon: '🅿️' },
    { name: 'Manutenção Veículo', parent: 'Transporte', icon: '🔧' },
    
    // Moradia
    { name: 'Aluguel', parent: 'Moradia', icon: '🏠' },
    { name: 'Condomínio', parent: 'Moradia', icon: '🏢' },
    { name: 'Energia Elétrica', parent: 'Moradia', icon: '⚡' },
    { name: 'Água', parent: 'Moradia', icon: '💧' },
    { name: 'Internet', parent: 'Moradia', icon: '🌐' },
    { name: 'Gás', parent: 'Moradia', icon: '🔥' },
    { name: 'Telefone', parent: 'Moradia', icon: '📞' },
    
    // Saúde
    { name: 'Médico', parent: 'Saúde', icon: '👨‍⚕️' },
    { name: 'Dentista', parent: 'Saúde', icon: '🦷' },
    { name: 'Farmácia', parent: 'Saúde', icon: '💊' },
    { name: 'Exames', parent: 'Saúde', icon: '🔬' },
    { name: 'Plano de Saúde', parent: 'Saúde', icon: '🏥' },
    
    // Educação
    { name: 'Mensalidade', parent: 'Educação', icon: '🎓' },
    { name: 'Material Escolar', parent: 'Educação', icon: '📝' },
    { name: 'Livros', parent: 'Educação', icon: '📚' },
    { name: 'Cursos', parent: 'Educação', icon: '💻' },
    
    // Entretenimento
    { name: 'Cinema', parent: 'Entretenimento', icon: '🎬' },
    { name: 'Streaming', parent: 'Entretenimento', icon: '📺' },
    { name: 'Jogos', parent: 'Entretenimento', icon: '🎮' },
    { name: 'Viagem', parent: 'Entretenimento', icon: '✈️' },
    { name: 'Academia', parent: 'Entretenimento', icon: '💪' },
    
    // Compras
    { name: 'Roupas', parent: 'Compras', icon: '👕' },
    { name: 'Eletrônicos', parent: 'Compras', icon: '📱' },
    { name: 'Casa e Decoração', parent: 'Compras', icon: '🛋️' },
    { name: 'Presentes', parent: 'Compras', icon: '🎁' },
    
    // Serviços
    { name: 'Cabeleireiro', parent: 'Serviços', icon: '💇' },
    { name: 'Limpeza', parent: 'Serviços', icon: '🧹' },
    { name: 'Advocacia', parent: 'Serviços', icon: '⚖️' },
    { name: 'Contabilidade', parent: 'Serviços', icon: '📊' },
  ];

  for (const subcategory of subcategories) {
    const parentCategory = createdCategories.get(subcategory.parent);
    
    if (parentCategory) {
      await prisma.category.upsert({
        where: { name: subcategory.name },
        update: {},
        create: {
          name: subcategory.name,
          icon: subcategory.icon,
          color: parentCategory.color,
          parentId: parentCategory.id,
          isSystem: true,
        }
      });
      console.log(`Created subcategory: ${subcategory.name}`);
    }
  }

  console.log('Categories seeded successfully!');
}

if (require.main === module) {
  seedCategories()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}