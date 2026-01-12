import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { Category } from '@prisma/client';

export interface CreateCategoryDto {
  name: string;
  icon?: string;
  color?: string;
  parentId?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  icon?: string;
  color?: string;
  parentId?: string;
}

export interface CategoryWithStats extends Category {
  transactionCount?: number;
  totalAmount?: number;
  children?: CategoryWithStats[];
  parent?: Category;
}

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(private prisma: PrismaService) {
    this.initializeDefaultCategories();
  }

  private async initializeDefaultCategories(): Promise<void> {
    try {
      const categoryCount = await this.prisma.category.count();
      if (categoryCount === 0) {
        this.logger.log('No categories found. Creating default categories...');
        await this.createDefaultCategories();
        this.logger.log('Default categories created successfully');
      }
    } catch (error) {
      this.logger.error('Error initializing default categories:', error);
    }
  }

  async findAll(): Promise<Category[]> {
    return this.prisma.category.findMany({
      include: {
        parent: true,
        children: true,
      },
      orderBy: [
        { parentId: 'asc' },
        { name: 'asc' }
      ]
    });
  }

  async findById(id: string): Promise<Category> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
      }
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async findByName(name: string): Promise<Category | null> {
    return this.prisma.category.findFirst({
      where: {
        name: {
          contains: name
        }
      },
      include: {
        parent: true,
        children: true,
      }
    });
  }

  async create(dto: CreateCategoryDto, userId?: string): Promise<Category> {
    // Check if category name already exists
    const existingCategory = await this.prisma.category.findFirst({
      where: { name: dto.name }
    });

    if (existingCategory) {
      throw new BadRequestException(`Category with name "${dto.name}" already exists`);
    }

    // Validate parent category exists if provided
    if (dto.parentId) {
      const parentCategory = await this.prisma.category.findUnique({
        where: { id: dto.parentId }
      });

      if (!parentCategory) {
        throw new NotFoundException(`Parent category with ID ${dto.parentId} not found`);
      }

      // Prevent creating subcategories of subcategories (max 2 levels)
      if (parentCategory.parentId) {
        throw new BadRequestException('Cannot create subcategory of a subcategory. Maximum 2 levels allowed.');
      }
    }

    return this.prisma.category.create({
      data: {
        name: dto.name,
        icon: dto.icon,
        color: dto.color,
        parentId: dto.parentId,
        isSystem: false, // User-created categories are not system categories
      },
      include: {
        parent: true,
        children: true,
      }
    });
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findById(id);

    // Prevent updating system categories
    if (category.isSystem) {
      throw new BadRequestException('Cannot update system categories');
    }

    // Check if new name already exists (if name is being changed)
    if (dto.name && dto.name !== category.name) {
      const existingCategory = await this.prisma.category.findFirst({
        where: { 
          name: dto.name,
          id: { not: id }
        }
      });

      if (existingCategory) {
        throw new BadRequestException(`Category with name "${dto.name}" already exists`);
      }
    }

    // Validate parent category if being changed
    if (dto.parentId && dto.parentId !== category.parentId) {
      const parentCategory = await this.prisma.category.findUnique({
        where: { id: dto.parentId }
      });

      if (!parentCategory) {
        throw new NotFoundException(`Parent category with ID ${dto.parentId} not found`);
      }

      // Prevent circular references
      if (dto.parentId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }

      // Prevent creating subcategories of subcategories
      if (parentCategory.parentId) {
        throw new BadRequestException('Cannot create subcategory of a subcategory. Maximum 2 levels allowed.');
      }

      // Check if this category has children - if so, it cannot become a subcategory
      const hasChildren = await this.prisma.category.count({
        where: { parentId: id }
      });

      if (hasChildren > 0) {
        throw new BadRequestException('Category with subcategories cannot become a subcategory itself');
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: dto,
      include: {
        parent: true,
        children: true,
      }
    });
  }

  async delete(id: string): Promise<void> {
    const category = await this.findById(id);

    // Prevent deleting system categories
    if (category.isSystem) {
      throw new BadRequestException('Cannot delete system categories');
    }

    // Check if category has transactions
    const transactionCount = await this.prisma.transaction.count({
      where: { categoryId: id }
    });

    if (transactionCount > 0) {
      throw new BadRequestException(`Cannot delete category with ${transactionCount} associated transactions`);
    }

    // Check if category has subcategories
    const subcategoryCount = await this.prisma.category.count({
      where: { parentId: id }
    });

    if (subcategoryCount > 0) {
      throw new BadRequestException(`Cannot delete category with ${subcategoryCount} subcategories`);
    }

    await this.prisma.category.delete({
      where: { id }
    });
  }

  async createDefaultCategories(): Promise<void> {
    const defaultCategories = [
      // Income categories
      { name: 'Receitas', icon: '💰', color: '#059669' },
      
      // Expense categories
      { name: 'Alimentação', icon: '🍽️', color: '#10b981' },
      { name: 'Transporte', icon: '🚗', color: '#3b82f6' },
      { name: 'Moradia', icon: '🏠', color: '#8b5cf6' },
      { name: 'Saúde', icon: '🏥', color: '#ef4444' },
      { name: 'Educação', icon: '📚', color: '#f59e0b' },
      { name: 'Entretenimento', icon: '🎬', color: '#ec4899' },
      { name: 'Compras', icon: '🛍️', color: '#06b6d4' },
      { name: 'Serviços', icon: '🔧', color: '#84cc16' },
      { name: 'Investimentos', icon: '📈', color: '#6366f1' },
      { name: 'Impostos e Taxas', icon: '🏛️', color: '#dc2626' },
      { name: 'Seguros', icon: '🛡️', color: '#7c3aed' },
      { name: 'Dívidas e Empréstimos', icon: '💳', color: '#ea580c' },
      { name: 'Outros', icon: '📦', color: '#6b7280' },
    ];

    for (const category of defaultCategories) {
      await this.prisma.category.upsert({
        where: { name: category.name },
        update: {},
        create: {
          ...category,
          isSystem: true,
        }
      });
    }

    // Create subcategories
    const subcategories = [
      // Receitas (Income)
      { name: 'Salário', parent: 'Receitas', icon: '💼' },
      { name: 'Freelance', parent: 'Receitas', icon: '💻' },
      { name: 'Rendimentos de Investimentos', parent: 'Receitas', icon: '📈' },
      { name: 'Vendas', parent: 'Receitas', icon: '🛒' },
      { name: 'Aluguéis Recebidos', parent: 'Receitas', icon: '🏠' },
      { name: 'Bonificações', parent: 'Receitas', icon: '🎁' },
      { name: 'Restituição de Impostos', parent: 'Receitas', icon: '💰' },
      { name: 'Outros Rendimentos', parent: 'Receitas', icon: '💵' },
      
      // Alimentação
      { name: 'Supermercado', parent: 'Alimentação', icon: '🛒' },
      { name: 'Restaurante', parent: 'Alimentação', icon: '🍽️' },
      { name: 'Delivery', parent: 'Alimentação', icon: '🚚' },
      { name: 'Padaria', parent: 'Alimentação', icon: '🥖' },
      { name: 'Lanchonete', parent: 'Alimentação', icon: '🍔' },
      { name: 'Bebidas', parent: 'Alimentação', icon: '🥤' },
      { name: 'Doces e Sobremesas', parent: 'Alimentação', icon: '🍰' },
      
      // Transporte
      { name: 'Combustível', parent: 'Transporte', icon: '⛽' },
      { name: 'Transporte Público', parent: 'Transporte', icon: '🚌' },
      { name: 'Uber/Taxi', parent: 'Transporte', icon: '🚕' },
      { name: 'Estacionamento', parent: 'Transporte', icon: '🅿️' },
      { name: 'Manutenção Veículo', parent: 'Transporte', icon: '🔧' },
      { name: 'IPVA e Licenciamento', parent: 'Transporte', icon: '📋' },
      { name: 'Pedágio', parent: 'Transporte', icon: '🛣️' },
      { name: 'Multas de Trânsito', parent: 'Transporte', icon: '🚫' },
      
      // Moradia
      { name: 'Aluguel', parent: 'Moradia', icon: '🏠' },
      { name: 'Condomínio', parent: 'Moradia', icon: '🏢' },
      { name: 'Energia Elétrica', parent: 'Moradia', icon: '⚡' },
      { name: 'Água e Esgoto', parent: 'Moradia', icon: '💧' },
      { name: 'Internet', parent: 'Moradia', icon: '🌐' },
      { name: 'Gás', parent: 'Moradia', icon: '🔥' },
      { name: 'Telefone Fixo', parent: 'Moradia', icon: '📞' },
      { name: 'TV por Assinatura', parent: 'Moradia', icon: '📺' },
      { name: 'Limpeza e Manutenção', parent: 'Moradia', icon: '🧹' },
      { name: 'Móveis e Decoração', parent: 'Moradia', icon: '🛋️' },
      
      // Saúde
      { name: 'Médico', parent: 'Saúde', icon: '👨‍⚕️' },
      { name: 'Dentista', parent: 'Saúde', icon: '🦷' },
      { name: 'Farmácia', parent: 'Saúde', icon: '💊' },
      { name: 'Exames', parent: 'Saúde', icon: '🔬' },
      { name: 'Plano de Saúde', parent: 'Saúde', icon: '🏥' },
      { name: 'Psicólogo/Psiquiatra', parent: 'Saúde', icon: '🧠' },
      { name: 'Fisioterapia', parent: 'Saúde', icon: '🏃‍♂️' },
      { name: 'Óculos e Lentes', parent: 'Saúde', icon: '👓' },
      
      // Educação
      { name: 'Mensalidade Escolar', parent: 'Educação', icon: '🎓' },
      { name: 'Material Escolar', parent: 'Educação', icon: '📝' },
      { name: 'Livros', parent: 'Educação', icon: '📚' },
      { name: 'Cursos Online', parent: 'Educação', icon: '💻' },
      { name: 'Idiomas', parent: 'Educação', icon: '🗣️' },
      { name: 'Certificações', parent: 'Educação', icon: '🏆' },
      { name: 'Uniformes', parent: 'Educação', icon: '👕' },
      
      // Entretenimento
      { name: 'Cinema', parent: 'Entretenimento', icon: '🎬' },
      { name: 'Streaming', parent: 'Entretenimento', icon: '📺' },
      { name: 'Jogos', parent: 'Entretenimento', icon: '🎮' },
      { name: 'Viagem', parent: 'Entretenimento', icon: '✈️' },
      { name: 'Academia', parent: 'Entretenimento', icon: '💪' },
      { name: 'Esportes', parent: 'Entretenimento', icon: '⚽' },
      { name: 'Shows e Eventos', parent: 'Entretenimento', icon: '🎵' },
      { name: 'Hobbies', parent: 'Entretenimento', icon: '🎨' },
      { name: 'Bares e Baladas', parent: 'Entretenimento', icon: '🍻' },
      
      // Compras
      { name: 'Roupas', parent: 'Compras', icon: '👕' },
      { name: 'Eletrônicos', parent: 'Compras', icon: '📱' },
      { name: 'Casa e Jardim', parent: 'Compras', icon: '🏡' },
      { name: 'Presentes', parent: 'Compras', icon: '🎁' },
      { name: 'Cosméticos', parent: 'Compras', icon: '💄' },
      { name: 'Calçados', parent: 'Compras', icon: '👟' },
      { name: 'Acessórios', parent: 'Compras', icon: '⌚' },
      { name: 'Ferramentas', parent: 'Compras', icon: '🔨' },
      
      // Serviços
      { name: 'Cabeleireiro', parent: 'Serviços', icon: '💇' },
      { name: 'Manicure/Pedicure', parent: 'Serviços', icon: '💅' },
      { name: 'Advocacia', parent: 'Serviços', icon: '⚖️' },
      { name: 'Contabilidade', parent: 'Serviços', icon: '📊' },
      { name: 'Consultoria', parent: 'Serviços', icon: '💼' },
      { name: 'Reparos Domésticos', parent: 'Serviços', icon: '🔧' },
      { name: 'Lavanderia', parent: 'Serviços', icon: '👔' },
      { name: 'Pet Shop', parent: 'Serviços', icon: '🐕' },
      
      // Investimentos
      { name: 'Ações', parent: 'Investimentos', icon: '📊' },
      { name: 'Fundos de Investimento', parent: 'Investimentos', icon: '🏦' },
      { name: 'Renda Fixa', parent: 'Investimentos', icon: '📈' },
      { name: 'Criptomoedas', parent: 'Investimentos', icon: '₿' },
      { name: 'Previdência Privada', parent: 'Investimentos', icon: '🏛️' },
      { name: 'Imóveis', parent: 'Investimentos', icon: '🏠' },
      
      // Impostos e Taxas
      { name: 'Imposto de Renda', parent: 'Impostos e Taxas', icon: '📋' },
      { name: 'IPTU', parent: 'Impostos e Taxas', icon: '🏠' },
      { name: 'Taxas Bancárias', parent: 'Impostos e Taxas', icon: '🏦' },
      { name: 'Cartório', parent: 'Impostos e Taxas', icon: '📜' },
      { name: 'Multas', parent: 'Impostos e Taxas', icon: '🚫' },
      
      // Seguros
      { name: 'Seguro Auto', parent: 'Seguros', icon: '🚗' },
      { name: 'Seguro Residencial', parent: 'Seguros', icon: '🏠' },
      { name: 'Seguro de Vida', parent: 'Seguros', icon: '👨‍👩‍👧‍👦' },
      { name: 'Seguro Viagem', parent: 'Seguros', icon: '✈️' },
      
      // Dívidas e Empréstimos
      { name: 'Cartão de Crédito', parent: 'Dívidas e Empréstimos', icon: '💳' },
      { name: 'Financiamento Imobiliário', parent: 'Dívidas e Empréstimos', icon: '🏠' },
      { name: 'Financiamento Veicular', parent: 'Dívidas e Empréstimos', icon: '🚗' },
      { name: 'Empréstimo Pessoal', parent: 'Dívidas e Empréstimos', icon: '💰' },
      { name: 'Crediário', parent: 'Dívidas e Empréstimos', icon: '🛍️' },
    ];

    for (const subcategory of subcategories) {
      const parentCategory = await this.prisma.category.findFirst({
        where: { name: subcategory.parent }
      });

      if (parentCategory) {
        await this.prisma.category.upsert({
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
      }
    }
  }

  async getHierarchy(): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async getCategoriesWithStats(userId: string, startDate?: Date, endDate?: Date): Promise<CategoryWithStats[]> {
    const categories = await this.prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: true,
      },
      orderBy: { name: 'asc' }
    });

    const categoriesWithStats: CategoryWithStats[] = [];

    for (const category of categories) {
      const categoryStats = await this.getCategoryStats(category.id, userId, startDate, endDate);
      const childrenWithStats: CategoryWithStats[] = [];

      for (const child of category.children) {
        const childStats = await this.getCategoryStats(child.id, userId, startDate, endDate);
        childrenWithStats.push({
          ...child,
          transactionCount: childStats.transactionCount,
          totalAmount: Number(childStats.totalAmount),
        });
      }

      categoriesWithStats.push({
        ...category,
        transactionCount: categoryStats.transactionCount,
        totalAmount: Number(categoryStats.totalAmount),
        children: childrenWithStats,
      });
    }

    return categoriesWithStats;
  }

  private async getCategoryStats(categoryId: string, userId: string, startDate?: Date, endDate?: Date) {
    const whereClause: any = {
      categoryId,
      userId,
    };

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = startDate;
      if (endDate) whereClause.date.lte = endDate;
    }

    const [transactionCount, totalAmountResult] = await Promise.all([
      this.prisma.transaction.count({ where: whereClause }),
      this.prisma.transaction.aggregate({
        where: whereClause,
        _sum: { amount: true }
      })
    ]);

    return {
      transactionCount,
      totalAmount: totalAmountResult._sum.amount || 0,
    };
  }

  async getMostUsedCategories(userId: string, limit: number = 10): Promise<CategoryWithStats[]> {
    const categoryStats = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { 
        userId,
        categoryId: { not: null }
      },
      _count: { categoryId: true },
      _sum: { amount: true },
      orderBy: { _count: { categoryId: 'desc' } },
      take: limit
    });

    const categoriesWithStats: CategoryWithStats[] = [];

    for (const stat of categoryStats) {
      if (stat.categoryId) {
        const category = await this.prisma.category.findUnique({
          where: { id: stat.categoryId },
          include: { parent: true }
        });

        if (category) {
          categoriesWithStats.push({
            ...category,
            transactionCount: stat._count.categoryId,
            totalAmount: Number(stat._sum.amount || 0),
          });
        }
      }
    }

    return categoriesWithStats;
  }

  async searchCategories(query: string): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query
            }
          },
          {
            parent: {
              name: {
                contains: query
              }
            }
          }
        ]
      },
      include: {
        parent: true,
        children: true,
      },
      orderBy: { name: 'asc' }
    });
  }
}