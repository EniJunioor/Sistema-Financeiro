import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CategorySuggestion } from '../interfaces/transaction.interface';

@Injectable()
export class MLCategorizationService {
  constructor(private prisma: PrismaService) {}

  async suggestCategory(description: string, amount: number, userId: string): Promise<CategorySuggestion | null> {
    // Simple rule-based categorization for now
    // In a real implementation, this would use ML models
    
    const normalizedDescription = description.toLowerCase().trim();
    
    // Get user's transaction history for learning
    const userTransactions = await this.prisma.transaction.findMany({
      where: { 
        userId,
        categoryId: { not: null }
      },
      include: { category: true },
      take: 100,
      orderBy: { createdAt: 'desc' }
    });

    // Check for exact matches in user history
    const exactMatch = userTransactions.find(t => 
      t.description.toLowerCase().includes(normalizedDescription) ||
      normalizedDescription.includes(t.description.toLowerCase())
    );

    if (exactMatch && exactMatch.category) {
      return {
        categoryId: exactMatch.category.id,
        categoryName: exactMatch.category.name,
        confidence: 0.95,
        reason: 'Baseado no histórico do usuário'
      };
    }

    // Rule-based categorization
    const rules = [
      // Alimentação
      {
        keywords: ['supermercado', 'mercado', 'padaria', 'açougue', 'hortifruti', 'walmart', 'carrefour', 'extra'],
        category: 'Supermercado',
        confidence: 0.9
      },
      {
        keywords: ['restaurante', 'lanchonete', 'pizzaria', 'hamburgueria', 'mcdonald', 'burger', 'kfc'],
        category: 'Restaurante',
        confidence: 0.85
      },
      {
        keywords: ['ifood', 'uber eats', 'delivery', 'entrega'],
        category: 'Delivery',
        confidence: 0.9
      },
      
      // Transporte
      {
        keywords: ['posto', 'combustível', 'gasolina', 'etanol', 'diesel', 'shell', 'petrobras'],
        category: 'Combustível',
        confidence: 0.9
      },
      {
        keywords: ['uber', 'taxi', '99', 'cabify'],
        category: 'Uber/Taxi',
        confidence: 0.95
      },
      {
        keywords: ['ônibus', 'metrô', 'trem', 'bilhete único', 'transporte público'],
        category: 'Transporte Público',
        confidence: 0.9
      },
      
      // Moradia
      {
        keywords: ['aluguel', 'imobiliária'],
        category: 'Aluguel',
        confidence: 0.95
      },
      {
        keywords: ['condomínio', 'administradora'],
        category: 'Condomínio',
        confidence: 0.9
      },
      {
        keywords: ['energia', 'luz', 'eletricidade', 'cemig', 'cpfl', 'enel'],
        category: 'Energia Elétrica',
        confidence: 0.9
      },
      {
        keywords: ['água', 'saneamento', 'sabesp', 'copasa'],
        category: 'Água',
        confidence: 0.9
      },
      {
        keywords: ['internet', 'banda larga', 'vivo', 'claro', 'tim', 'oi'],
        category: 'Internet',
        confidence: 0.85
      },
      
      // Saúde
      {
        keywords: ['farmácia', 'drogaria', 'medicamento', 'remédio'],
        category: 'Saúde',
        confidence: 0.85
      },
      
      // Entretenimento
      {
        keywords: ['cinema', 'netflix', 'spotify', 'amazon prime', 'disney'],
        category: 'Entretenimento',
        confidence: 0.85
      },
      
      // Compras
      {
        keywords: ['loja', 'shopping', 'magazine', 'americanas', 'mercado livre', 'amazon'],
        category: 'Compras',
        confidence: 0.8
      }
    ];

    // Find matching rule
    for (const rule of rules) {
      const hasKeyword = rule.keywords.some(keyword => 
        normalizedDescription.includes(keyword)
      );
      
      if (hasKeyword) {
        // Find the category in database
        const category = await this.prisma.category.findFirst({
          where: { name: rule.category }
        });
        
        if (category) {
          return {
            categoryId: category.id,
            categoryName: category.name,
            confidence: rule.confidence,
            reason: `Detectado pela palavra-chave: ${rule.keywords.find(k => normalizedDescription.includes(k))}`
          };
        }
      }
    }

    // Amount-based categorization for common ranges
    if (amount >= 1000) {
      const category = await this.prisma.category.findFirst({
        where: { name: 'Aluguel' }
      });
      if (category) {
        return {
          categoryId: category.id,
          categoryName: category.name,
          confidence: 0.6,
          reason: 'Valor alto, possivelmente aluguel ou conta importante'
        };
      }
    }

    // Default fallback
    const defaultCategory = await this.prisma.category.findFirst({
      where: { name: 'Outros' }
    });
    
    if (defaultCategory) {
      return {
        categoryId: defaultCategory.id,
        categoryName: defaultCategory.name,
        confidence: 0.3,
        reason: 'Categoria padrão - não foi possível determinar automaticamente'
      };
    }

    return null;
  }

  async learnFromUserFeedback(transactionId: string, correctCategoryId: string): Promise<void> {
    // In a real ML implementation, this would update the model
    // For now, we just store the correction for future reference
    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: { 
        categoryId: correctCategoryId,
        metadata: JSON.stringify({ 
          userCorrected: true, 
          correctedAt: new Date().toISOString() 
        })
      }
    });
  }

  async getCategorizationStats(userId: string): Promise<{
    totalTransactions: number;
    categorizedTransactions: number;
    categorizationRate: number;
    topCategories: { name: string; count: number }[];
  }> {
    const totalTransactions = await this.prisma.transaction.count({
      where: { userId }
    });

    const categorizedTransactions = await this.prisma.transaction.count({
      where: { 
        userId,
        categoryId: { not: null }
      }
    });

    const categoryStats = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { 
        userId,
        categoryId: { not: null }
      },
      _count: { categoryId: true },
      orderBy: { _count: { categoryId: 'desc' } },
      take: 5
    });

    const topCategories = await Promise.all(
      categoryStats.map(async (stat) => {
        const category = await this.prisma.category.findUnique({
          where: { id: stat.categoryId! }
        });
        return {
          name: category?.name || 'Unknown',
          count: stat._count.categoryId
        };
      })
    );

    return {
      totalTransactions,
      categorizedTransactions,
      categorizationRate: totalTransactions > 0 ? (categorizedTransactions / totalTransactions) * 100 : 0,
      topCategories
    };
  }
}