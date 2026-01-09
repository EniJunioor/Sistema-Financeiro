import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { Category } from '@prisma/client';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

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

  async createDefaultCategories(): Promise<void> {
    const defaultCategories = [
      // Main categories
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
      // Alimentação
      { name: 'Supermercado', parent: 'Alimentação', icon: '🛒' },
      { name: 'Restaurante', parent: 'Alimentação', icon: '🍽️' },
      { name: 'Delivery', parent: 'Alimentação', icon: '🚚' },
      
      // Transporte
      { name: 'Combustível', parent: 'Transporte', icon: '⛽' },
      { name: 'Transporte Público', parent: 'Transporte', icon: '🚌' },
      { name: 'Uber/Taxi', parent: 'Transporte', icon: '🚕' },
      
      // Moradia
      { name: 'Aluguel', parent: 'Moradia', icon: '🏠' },
      { name: 'Condomínio', parent: 'Moradia', icon: '🏢' },
      { name: 'Energia Elétrica', parent: 'Moradia', icon: '⚡' },
      { name: 'Água', parent: 'Moradia', icon: '💧' },
      { name: 'Internet', parent: 'Moradia', icon: '🌐' },
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
}