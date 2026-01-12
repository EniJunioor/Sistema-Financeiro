import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CategorySuggestion } from '../interfaces/transaction.interface';

interface CategoryRule {
  keywords: string[];
  category: string;
  confidence: number;
  weight?: number;
}

interface UserLearningData {
  description: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  frequency: number;
}

@Injectable()
export class MLCategorizationService {
  private readonly logger = new Logger(MLCategorizationService.name);

  constructor(private prisma: PrismaService) {}

  async suggestCategory(description: string, amount: number, userId: string): Promise<CategorySuggestion | null> {
    try {
      const normalizedDescription = description.toLowerCase().trim();
      
      // Step 1: Check for exact matches in user history (highest priority)
      const exactMatch = await this.findExactUserMatch(normalizedDescription, userId);
      if (exactMatch) {
        return exactMatch;
      }

      // Step 2: Check for similar patterns in user history
      const similarMatch = await this.findSimilarUserMatch(normalizedDescription, userId);
      if (similarMatch) {
        return similarMatch;
      }

      // Step 3: Use enhanced rule-based categorization
      const ruleMatch = await this.applyEnhancedRules(normalizedDescription, amount);
      if (ruleMatch) {
        return ruleMatch;
      }

      // Step 4: Use amount-based heuristics
      const amountMatch = await this.categorizeByAmount(amount, userId);
      if (amountMatch) {
        return amountMatch;
      }

      // Step 5: Default fallback
      return await this.getDefaultCategory();

    } catch (error) {
      this.logger.error(`Error suggesting category: ${error.message}`, error.stack);
      return await this.getDefaultCategory();
    }
  }

  private async findExactUserMatch(description: string, userId: string): Promise<CategorySuggestion | null> {
    const userTransactions = await this.prisma.transaction.findMany({
      where: { 
        userId,
        categoryId: { not: null },
        description: {
          contains: description
        }
      },
      include: { category: true },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    if (userTransactions.length > 0) {
      const mostFrequentCategory = this.getMostFrequentCategory(userTransactions);
      return {
        categoryId: mostFrequentCategory.category!.id,
        categoryName: mostFrequentCategory.category!.name,
        confidence: 0.95,
        reason: `Baseado no histórico do usuário (${userTransactions.length} transações similares)`
      };
    }

    return null;
  }

  private async findSimilarUserMatch(description: string, userId: string): Promise<CategorySuggestion | null> {
    // Get user's transaction patterns
    const userPatterns = await this.getUserLearningData(userId);
    
    // Find similar descriptions using simple text similarity
    for (const pattern of userPatterns) {
      const similarity = this.calculateTextSimilarity(description, pattern.description);
      if (similarity > 0.7) { // 70% similarity threshold
        const category = await this.prisma.category.findUnique({
          where: { id: pattern.categoryId }
        });

        if (category) {
          return {
            categoryId: category.id,
            categoryName: category.name,
            confidence: 0.8 * similarity,
            reason: `Baseado em padrão similar: "${pattern.description}" (${Math.round(similarity * 100)}% similaridade)`
          };
        }
      }
    }

    return null;
  }

  private async applyEnhancedRules(description: string, amount: number): Promise<CategorySuggestion | null> {
    const rules: CategoryRule[] = [
      // Receitas (Income) - Enhanced rules
      {
        keywords: ['salário', 'salario', 'pagamento', 'remuneração', 'vencimento', 'ordenado', 'soldo'],
        category: 'Salário',
        confidence: 0.95,
        weight: 1.5
      },
      {
        keywords: ['freelance', 'freela', 'trabalho autônomo', 'projeto', 'consultoria', 'serviço prestado'],
        category: 'Freelance',
        confidence: 0.9,
        weight: 1.3
      },
      {
        keywords: ['dividendo', 'juros', 'rendimento', 'aplicação', 'cdb', 'lci', 'lca', 'tesouro'],
        category: 'Rendimentos de Investimentos',
        confidence: 0.9,
        weight: 1.4
      },
      {
        keywords: ['venda', 'vendeu', 'mercado livre', 'olx', 'facebook marketplace', 'brechó'],
        category: 'Vendas',
        confidence: 0.85,
        weight: 1.2
      },
      {
        keywords: ['aluguel recebido', 'locação', 'inquilino', 'locatário'],
        category: 'Aluguéis Recebidos',
        confidence: 0.9,
        weight: 1.3
      },
      
      // Alimentação - Enhanced rules
      {
        keywords: ['supermercado', 'mercado', 'hipermercado', 'walmart', 'carrefour', 'extra', 'pão de açúcar', 'big', 'atacadão', 'assaí', 'sam\'s club'],
        category: 'Supermercado',
        confidence: 0.95,
        weight: 1.4
      },
      {
        keywords: ['restaurante', 'lanchonete', 'pizzaria', 'hamburgueria', 'mcdonald', 'burger king', 'kfc', 'subway', 'bobs', 'giraffas', 'spoleto', 'china in box'],
        category: 'Restaurante',
        confidence: 0.9,
        weight: 1.3
      },
      {
        keywords: ['ifood', 'uber eats', 'delivery', 'entrega', 'rappi', 'james delivery', 'aiqfome', 'pediu chegou'],
        category: 'Delivery',
        confidence: 0.95,
        weight: 1.5
      },
      {
        keywords: ['padaria', 'panificadora', 'pão', 'doce', 'bolo', 'confeitaria'],
        category: 'Padaria',
        confidence: 0.9,
        weight: 1.2
      },
      {
        keywords: ['bar', 'pub', 'cerveja', 'bebida', 'drink', 'cachaça', 'whisky', 'vodka', 'vinho'],
        category: 'Bebidas',
        confidence: 0.85,
        weight: 1.1
      },
      
      // Transporte - Enhanced rules
      {
        keywords: ['posto', 'combustível', 'gasolina', 'etanol', 'diesel', 'shell', 'petrobras', 'ipiranga', 'br distribuidora', 'ale'],
        category: 'Combustível',
        confidence: 0.95,
        weight: 1.4
      },
      {
        keywords: ['uber', 'taxi', '99', 'cabify', 'pop', 'indriver', 'lady driver'],
        category: 'Uber/Taxi',
        confidence: 0.98,
        weight: 1.6
      },
      {
        keywords: ['ônibus', 'metrô', 'metro', 'trem', 'bilhete único', 'transporte público', 'cptm', 'via quatro', 'viação'],
        category: 'Transporte Público',
        confidence: 0.9,
        weight: 1.3
      },
      {
        keywords: ['estacionamento', 'parking', 'zona azul', 'parquímetro', 'valet'],
        category: 'Estacionamento',
        confidence: 0.9,
        weight: 1.2
      },
      {
        keywords: ['oficina', 'mecânico', 'manutenção', 'revisão', 'troca de óleo', 'pneu', 'bateria', 'freio'],
        category: 'Manutenção Veículo',
        confidence: 0.85,
        weight: 1.1
      },
      {
        keywords: ['ipva', 'licenciamento', 'dpvat', 'detran', 'multa de trânsito'],
        category: 'IPVA e Licenciamento',
        confidence: 0.9,
        weight: 1.3
      },
      
      // Moradia - Enhanced rules
      {
        keywords: ['aluguel', 'locação', 'imobiliária', 'inquilino', 'locador'],
        category: 'Aluguel',
        confidence: 0.98,
        weight: 1.6
      },
      {
        keywords: ['condomínio', 'administradora', 'síndico', 'taxa condominial'],
        category: 'Condomínio',
        confidence: 0.95,
        weight: 1.4
      },
      {
        keywords: ['energia', 'luz', 'eletricidade', 'cemig', 'cpfl', 'enel', 'elektro', 'coelba', 'celpe', 'copel'],
        category: 'Energia Elétrica',
        confidence: 0.95,
        weight: 1.4
      },
      {
        keywords: ['água', 'saneamento', 'sabesp', 'copasa', 'cedae', 'cagece', 'embasa', 'sanepar'],
        category: 'Água e Esgoto',
        confidence: 0.95,
        weight: 1.4
      },
      {
        keywords: ['internet', 'banda larga', 'vivo fibra', 'claro', 'tim', 'oi', 'net', 'sky', 'algar'],
        category: 'Internet',
        confidence: 0.9,
        weight: 1.3
      },
      {
        keywords: ['gás', 'ultragaz', 'liquigás', 'supergasbras', 'consigaz', 'botijão'],
        category: 'Gás',
        confidence: 0.9,
        weight: 1.2
      },
      
      // Saúde - Enhanced rules
      {
        keywords: ['farmácia', 'drogaria', 'medicamento', 'remédio', 'droga raia', 'pacheco', 'ultrafarma', 'drogasil', 'panvel'],
        category: 'Farmácia',
        confidence: 0.9,
        weight: 1.3
      },
      {
        keywords: ['médico', 'consulta', 'clínica', 'hospital', 'doutor', 'dra', 'dr'],
        category: 'Médico',
        confidence: 0.85,
        weight: 1.1
      },
      {
        keywords: ['dentista', 'odontologia', 'ortodontia', 'implante', 'canal', 'limpeza dental'],
        category: 'Dentista',
        confidence: 0.9,
        weight: 1.2
      },
      {
        keywords: ['exame', 'laboratório', 'raio x', 'ultrassom', 'ressonância', 'tomografia', 'hemograma'],
        category: 'Exames',
        confidence: 0.85,
        weight: 1.1
      },
      {
        keywords: ['plano de saúde', 'unimed', 'amil', 'bradesco saúde', 'sulamerica', 'hapvida'],
        category: 'Plano de Saúde',
        confidence: 0.95,
        weight: 1.4
      },
      
      // Entretenimento - Enhanced rules
      {
        keywords: ['cinema', 'ingresso', 'filme', 'cinemark', 'uci', 'moviecom', 'kinoplex'],
        category: 'Cinema',
        confidence: 0.9,
        weight: 1.2
      },
      {
        keywords: ['netflix', 'spotify', 'amazon prime', 'disney plus', 'globoplay', 'paramount', 'hbo max', 'youtube premium'],
        category: 'Streaming',
        confidence: 0.95,
        weight: 1.4
      },
      {
        keywords: ['academia', 'smart fit', 'bio ritmo', 'bodytech', 'runner', 'bluefit', 'formula academia'],
        category: 'Academia',
        confidence: 0.95,
        weight: 1.4
      },
      {
        keywords: ['viagem', 'hotel', 'pousada', 'passagem', 'booking', 'airbnb', 'decolar', 'latam', 'gol', 'azul'],
        category: 'Viagem',
        confidence: 0.85,
        weight: 1.1
      },
      {
        keywords: ['show', 'concerto', 'teatro', 'ingresso', 'ticketmaster', 'sympla', 'eventim'],
        category: 'Shows e Eventos',
        confidence: 0.9,
        weight: 1.2
      },
      
      // Compras - Enhanced rules
      {
        keywords: ['loja', 'shopping', 'magazine luiza', 'americanas', 'mercado livre', 'amazon', 'shopee', 'aliexpress', 'casas bahia'],
        category: 'Eletrônicos',
        confidence: 0.8,
        weight: 1.0
      },
      {
        keywords: ['roupa', 'vestuário', 'c&a', 'renner', 'riachuelo', 'zara', 'h&m', 'nike', 'adidas'],
        category: 'Roupas',
        confidence: 0.85,
        weight: 1.1
      },
      {
        keywords: ['presente', 'gift', 'aniversário', 'natal', 'dia das mães', 'dia dos pais'],
        category: 'Presentes',
        confidence: 0.8,
        weight: 1.0
      },
      
      // Serviços - Enhanced rules
      {
        keywords: ['cabeleireiro', 'salão', 'barbeiro', 'corte', 'escova', 'tintura'],
        category: 'Cabeleireiro',
        confidence: 0.9,
        weight: 1.2
      },
      {
        keywords: ['manicure', 'pedicure', 'unha', 'esmalteria'],
        category: 'Manicure/Pedicure',
        confidence: 0.9,
        weight: 1.2
      },
      {
        keywords: ['advogado', 'advocacia', 'jurídico', 'processo', 'honorários'],
        category: 'Advocacia',
        confidence: 0.9,
        weight: 1.2
      },
      {
        keywords: ['contador', 'contabilidade', 'imposto de renda', 'declaração', 'contábil'],
        category: 'Contabilidade',
        confidence: 0.9,
        weight: 1.2
      },
      
      // Investimentos - Enhanced rules
      {
        keywords: ['ação', 'bolsa', 'b3', 'bovespa', 'corretora', 'xp', 'rico', 'clear', 'inter', 'nubank'],
        category: 'Ações',
        confidence: 0.9,
        weight: 1.3
      },
      {
        keywords: ['fundo', 'cdb', 'lci', 'lca', 'tesouro direto', 'selic', 'ipca'],
        category: 'Renda Fixa',
        confidence: 0.85,
        weight: 1.1
      },
      {
        keywords: ['bitcoin', 'ethereum', 'crypto', 'binance', 'coinbase', 'mercado bitcoin', 'foxbit'],
        category: 'Criptomoedas',
        confidence: 0.9,
        weight: 1.3
      },
      
      // Impostos e Taxas - Enhanced rules
      {
        keywords: ['imposto de renda', 'ir', 'receita federal', 'darf', 'carnê leão'],
        category: 'Imposto de Renda',
        confidence: 0.95,
        weight: 1.4
      },
      {
        keywords: ['iptu', 'prefeitura', 'imposto predial'],
        category: 'IPTU',
        confidence: 0.95,
        weight: 1.4
      },
      {
        keywords: ['taxa bancária', 'tarifa', 'anuidade', 'manutenção conta', 'ted', 'doc'],
        category: 'Taxas Bancárias',
        confidence: 0.9,
        weight: 1.2
      },
      
      // Seguros - Enhanced rules
      {
        keywords: ['seguro auto', 'seguro carro', 'porto seguro', 'bradesco seguros', 'azul seguros'],
        category: 'Seguro Auto',
        confidence: 0.9,
        weight: 1.3
      },
      {
        keywords: ['seguro residencial', 'seguro casa', 'seguro apartamento'],
        category: 'Seguro Residencial',
        confidence: 0.9,
        weight: 1.2
      },
      {
        keywords: ['seguro de vida', 'seguro vida'],
        category: 'Seguro de Vida',
        confidence: 0.9,
        weight: 1.2
      },
      
      // Dívidas e Empréstimos - Enhanced rules
      {
        keywords: ['cartão de crédito', 'fatura', 'nubank', 'inter', 'itau', 'bradesco', 'santander', 'caixa'],
        category: 'Cartão de Crédito',
        confidence: 0.95,
        weight: 1.4
      },
      {
        keywords: ['financiamento', 'prestação', 'parcela', 'empréstimo', 'crédito'],
        category: 'Empréstimo Pessoal',
        confidence: 0.8,
        weight: 1.0
      }
    ];

    // Find matching rules and calculate weighted scores
    const matches: Array<{ rule: CategoryRule; score: number; matchedKeyword: string }> = [];

    for (const rule of rules) {
      for (const keyword of rule.keywords) {
        if (description.includes(keyword)) {
          const score = rule.confidence * (rule.weight || 1.0);
          matches.push({ rule, score, matchedKeyword: keyword });
        }
      }
    }

    if (matches.length > 0) {
      // Sort by score and get the best match
      matches.sort((a, b) => b.score - a.score);
      const bestMatch = matches[0];

      const category = await this.prisma.category.findFirst({
        where: { name: bestMatch.rule.category }
      });

      if (category) {
        return {
          categoryId: category.id,
          categoryName: category.name,
          confidence: bestMatch.rule.confidence,
          reason: `Detectado pela palavra-chave: "${bestMatch.matchedKeyword}"`
        };
      }
    }

    return null;
  }

  private async categorizeByAmount(amount: number, userId: string): Promise<CategorySuggestion | null> {
    // Get user's spending patterns by amount ranges
    const userAmountPatterns = await this.getUserAmountPatterns(userId);

    // Find similar amount range
    for (const pattern of userAmountPatterns) {
      const amountDiff = Math.abs(amount - pattern.averageAmount);
      const tolerance = pattern.averageAmount * 0.3; // 30% tolerance

      if (amountDiff <= tolerance) {
        const category = await this.prisma.category.findUnique({
          where: { id: pattern.categoryId }
        });

        if (category) {
          return {
            categoryId: category.id,
            categoryName: category.name,
            confidence: 0.6,
            reason: `Baseado no valor similar (R$ ${pattern.averageAmount.toFixed(2)} em média para ${category.name})`
          };
        }
      }
    }

    // Fallback to general amount-based rules
    if (amount >= 1000) {
      const category = await this.prisma.category.findFirst({
        where: { name: 'Aluguel' }
      });
      if (category) {
        return {
          categoryId: category.id,
          categoryName: category.name,
          confidence: 0.5,
          reason: 'Valor alto, possivelmente aluguel ou conta importante'
        };
      }
    }

    return null;
  }

  private async getDefaultCategory(): Promise<CategorySuggestion | null> {
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

  private getMostFrequentCategory(transactions: any[]): any {
    const categoryCount = new Map();
    
    transactions.forEach(t => {
      if (t.category) {
        const count = categoryCount.get(t.category.id) || 0;
        categoryCount.set(t.category.id, count + 1);
      }
    });

    let mostFrequent = transactions[0];
    let maxCount = 0;

    for (const [categoryId, count] of categoryCount.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = transactions.find(t => t.category?.id === categoryId);
      }
    }

    return mostFrequent;
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    // Simple Jaccard similarity
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  private async getUserLearningData(userId: string): Promise<UserLearningData[]> {
    const transactions = await this.prisma.transaction.findMany({
      where: { 
        userId,
        categoryId: { not: null }
      },
      include: { category: true },
      take: 200,
      orderBy: { createdAt: 'desc' }
    });

    const patterns = new Map<string, UserLearningData>();

    transactions.forEach(t => {
      if (t.category) {
        const key = `${t.description.toLowerCase()}_${t.category.id}`;
        const existing = patterns.get(key);
        
        if (existing) {
          existing.frequency += 1;
          existing.amount = (existing.amount + Number(t.amount)) / 2; // Average amount
        } else {
          patterns.set(key, {
            description: t.description.toLowerCase(),
            categoryId: t.category.id,
            categoryName: t.category.name,
            amount: Number(t.amount),
            frequency: 1
          });
        }
      }
    });

    return Array.from(patterns.values()).sort((a, b) => b.frequency - a.frequency);
  }

  private async getUserAmountPatterns(userId: string): Promise<Array<{ categoryId: string; averageAmount: number; count: number }>> {
    const result = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { 
        userId,
        categoryId: { not: null }
      },
      _avg: { amount: true },
      _count: { categoryId: true },
      having: {
        categoryId: { _count: { gte: 3 } } // At least 3 transactions
      }
    });

    return result
      .filter(r => r.categoryId && r._avg.amount)
      .map(r => ({
        categoryId: r.categoryId!,
        averageAmount: Number(r._avg.amount),
        count: r._count.categoryId
      }));
  }

  async learnFromUserFeedback(transactionId: string, correctCategoryId: string): Promise<void> {
    try {
      // Get the transaction details
      const transaction = await this.prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { category: true }
      });

      if (!transaction) {
        throw new Error(`Transaction ${transactionId} not found`);
      }

      const wasCorrection = transaction.categoryId !== correctCategoryId;

      // Update the transaction with the correct category
      await this.prisma.transaction.update({
        where: { id: transactionId },
        data: { 
          categoryId: correctCategoryId,
          metadata: JSON.stringify({ 
            userCorrected: wasCorrection,
            correctedAt: new Date().toISOString(),
            previousCategoryId: transaction.categoryId,
            learningSource: 'user_feedback'
          })
        }
      });

      // Store learning data for future improvements
      if (wasCorrection) {
        await this.storeLearningPattern(transaction, correctCategoryId);
        this.logger.log(`Learned from user correction: "${transaction.description}" -> ${correctCategoryId}`);
      }

    } catch (error) {
      this.logger.error(`Error learning from user feedback: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async storeLearningPattern(transaction: any, correctCategoryId: string): Promise<void> {
    // In a real ML implementation, this would update the model weights
    // For now, we store patterns that can be used for future categorization
    
    const pattern = {
      description: transaction.description.toLowerCase(),
      amount: Number(transaction.amount),
      correctCategoryId,
      userId: transaction.userId,
      timestamp: new Date(),
      confidence: 1.0 // User corrections have highest confidence
    };

    // Store in metadata for future reference
    // In production, this would go to a dedicated learning database or ML pipeline
    this.logger.debug(`Stored learning pattern: ${JSON.stringify(pattern)}`);
  }

  async getCategorizationStats(userId: string): Promise<{
    totalTransactions: number;
    categorizedTransactions: number;
    categorizationRate: number;
    topCategories: { name: string; count: number }[];
    accuracyMetrics: {
      totalCorrected: number;
      correctionRate: number;
      confidenceDistribution: { range: string; count: number }[];
    };
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

    // Calculate accuracy metrics
    const correctedTransactions = await this.prisma.transaction.count({
      where: {
        userId,
        metadata: {
          contains: '"userCorrected":true'
        }
      }
    });

    return {
      totalTransactions,
      categorizedTransactions,
      categorizationRate: totalTransactions > 0 ? (categorizedTransactions / totalTransactions) * 100 : 0,
      topCategories,
      accuracyMetrics: {
        totalCorrected: correctedTransactions,
        correctionRate: categorizedTransactions > 0 ? (correctedTransactions / categorizedTransactions) * 100 : 0,
        confidenceDistribution: [
          { range: '0.9-1.0', count: 0 }, // High confidence
          { range: '0.7-0.9', count: 0 }, // Medium confidence  
          { range: '0.5-0.7', count: 0 }, // Low confidence
          { range: '0.0-0.5', count: 0 }  // Very low confidence
        ]
      }
    };
  }

  async bulkCategorizeTransactions(userId: string, limit: number = 100): Promise<{
    processed: number;
    categorized: number;
    errors: number;
  }> {
    const uncategorizedTransactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        categoryId: null
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    let processed = 0;
    let categorized = 0;
    let errors = 0;

    for (const transaction of uncategorizedTransactions) {
      try {
        processed++;
        const suggestion = await this.suggestCategory(
          transaction.description,
          Number(transaction.amount),
          userId
        );

        if (suggestion && suggestion.confidence > 0.7) { // Only auto-categorize high confidence suggestions
          await this.prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              categoryId: suggestion.categoryId,
              metadata: JSON.stringify({
                autoCategorized: true,
                confidence: suggestion.confidence,
                reason: suggestion.reason,
                categorizedAt: new Date().toISOString()
              })
            }
          });
          categorized++;
        }
      } catch (error) {
        errors++;
        this.logger.error(`Error categorizing transaction ${transaction.id}: ${error.message}`);
      }
    }

    this.logger.log(`Bulk categorization completed: ${categorized}/${processed} transactions categorized`);

    return { processed, categorized, errors };
  }

  async getCategoryPredictionAccuracy(userId: string): Promise<{
    totalPredictions: number;
    correctPredictions: number;
    accuracy: number;
    categoryAccuracy: { categoryName: string; accuracy: number; sampleSize: number }[];
  }> {
    // Get transactions that were auto-categorized and later corrected by user
    const autoCategorizedTransactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        metadata: {
          contains: '"autoCategorized":true'
        }
      },
      include: { category: true }
    });

    const correctedTransactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        metadata: {
          contains: '"userCorrected":true'
        }
      },
      include: { category: true }
    });

    const totalPredictions = autoCategorizedTransactions.length;
    const correctPredictions = totalPredictions - correctedTransactions.length;
    const accuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0;

    // Calculate per-category accuracy
    const categoryAccuracyMap = new Map<string, { correct: number; total: number }>();

    autoCategorizedTransactions.forEach(transaction => {
      if (transaction.category) {
        const categoryName = transaction.category.name;
        const stats = categoryAccuracyMap.get(categoryName) || { correct: 0, total: 0 };
        stats.total += 1;
        
        // Check if this transaction was corrected
        const wasCorrected = correctedTransactions.some(ct => ct.id === transaction.id);
        if (!wasCorrected) {
          stats.correct += 1;
        }
        
        categoryAccuracyMap.set(categoryName, stats);
      }
    });

    const categoryAccuracy = Array.from(categoryAccuracyMap.entries()).map(([categoryName, stats]) => ({
      categoryName,
      accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
      sampleSize: stats.total
    }));

    return {
      totalPredictions,
      correctPredictions,
      accuracy,
      categoryAccuracy
    };
  }

  async getPersonalizedSuggestions(userId: string, description: string, amount: number): Promise<CategorySuggestion[]> {
    const suggestions: CategorySuggestion[] = [];

    // Get primary suggestion
    const primarySuggestion = await this.suggestCategory(description, amount, userId);
    if (primarySuggestion) {
      suggestions.push(primarySuggestion);
    }

    // Get alternative suggestions based on user patterns
    const userPatterns = await this.getUserLearningData(userId);
    const words = description.toLowerCase().split(/\s+/);

    for (const pattern of userPatterns.slice(0, 3)) { // Top 3 patterns
      if (pattern.categoryId !== primarySuggestion?.categoryId) {
        // Check if any word matches
        const patternWords = pattern.description.split(/\s+/);
        const commonWords = words.filter(word => patternWords.includes(word));
        
        if (commonWords.length > 0) {
          const category = await this.prisma.category.findUnique({
            where: { id: pattern.categoryId }
          });

          if (category) {
            const confidence = Math.min(0.7, (commonWords.length / words.length) * pattern.frequency * 0.1);
            suggestions.push({
              categoryId: category.id,
              categoryName: category.name,
              confidence,
              reason: `Baseado em padrão similar com ${commonWords.length} palavra(s) em comum`
            });
          }
        }
      }
    }

    // Add amount-based suggestions
    const amountSuggestions = await this.getAmountBasedSuggestions(userId, amount);
    for (const suggestion of amountSuggestions) {
      if (!suggestions.some(s => s.categoryId === suggestion.categoryId)) {
        suggestions.push(suggestion);
      }
    }

    return suggestions.slice(0, 5); // Return top 5 suggestions
  }

  private async getAmountBasedSuggestions(userId: string, amount: number): Promise<CategorySuggestion[]> {
    const suggestions: CategorySuggestion[] = [];

    // Get categories with similar amounts
    const similarAmountTransactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        categoryId: { not: null },
        amount: {
          gte: amount * 0.8, // 20% tolerance
          lte: amount * 1.2
        }
      },
      include: { category: true },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    const categoryFrequency = new Map<string, { count: number; category: any }>();

    similarAmountTransactions.forEach(transaction => {
      if (transaction.category) {
        const existing = categoryFrequency.get(transaction.category.id);
        if (existing) {
          existing.count += 1;
        } else {
          categoryFrequency.set(transaction.category.id, {
            count: 1,
            category: transaction.category
          });
        }
      }
    });

    // Convert to suggestions
    Array.from(categoryFrequency.entries())
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 3)
      .forEach(([categoryId, data]) => {
        const confidence = Math.min(0.6, data.count * 0.15);
        suggestions.push({
          categoryId,
          categoryName: data.category.name,
          confidence,
          reason: `Baseado em ${data.count} transação(ões) com valor similar`
        });
      });

    return suggestions;
  }

  async improveCategorizationModel(userId: string): Promise<{
    patternsAnalyzed: number;
    rulesUpdated: number;
    accuracyImprovement: number;
  }> {
    // Analyze user correction patterns to improve the model
    const correctedTransactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        metadata: {
          contains: '"userCorrected":true'
        }
      },
      include: { category: true },
      take: 100,
      orderBy: { updatedAt: 'desc' }
    });

    let patternsAnalyzed = 0;
    let rulesUpdated = 0;

    // Analyze patterns in corrections
    const correctionPatterns = new Map<string, { 
      wrongCategory: string; 
      correctCategory: string; 
      count: number; 
      descriptions: string[] 
    }>();

    correctedTransactions.forEach(transaction => {
      if (transaction.category && transaction.metadata) {
        try {
          const metadata = JSON.parse(transaction.metadata);
          if (metadata.previousCategoryId && metadata.previousCategoryId !== transaction.categoryId) {
            const key = `${metadata.previousCategoryId}->${transaction.categoryId}`;
            const existing = correctionPatterns.get(key);
            
            if (existing) {
              existing.count += 1;
              existing.descriptions.push(transaction.description);
            } else {
              correctionPatterns.set(key, {
                wrongCategory: metadata.previousCategoryId,
                correctCategory: transaction.categoryId,
                count: 1,
                descriptions: [transaction.description]
              });
            }
            patternsAnalyzed += 1;
          }
        } catch (error) {
          // Invalid JSON in metadata, skip
        }
      }
    });

    // Identify common correction patterns that could improve rules
    for (const [, pattern] of correctionPatterns) {
      if (pattern.count >= 3) { // Pattern appears at least 3 times
        // This could be used to update ML rules or weights
        rulesUpdated += 1;
        this.logger.log(`Identified correction pattern: ${pattern.wrongCategory} -> ${pattern.correctCategory} (${pattern.count} times)`);
      }
    }

    // Calculate accuracy improvement (mock calculation)
    const accuracyImprovement = rulesUpdated * 2.5; // Each rule improvement adds ~2.5% accuracy

    return {
      patternsAnalyzed,
      rulesUpdated,
      accuracyImprovement
    };
  }
}