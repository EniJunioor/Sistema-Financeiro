import { Test, TestingModule } from '@nestjs/testing';
import { PortfolioAnalysisService } from './portfolio-analysis.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { QuotesService } from './quotes.service';
import { PortfolioService } from './portfolio.service';

describe('PortfolioAnalysisService', () => {
  let service: PortfolioAnalysisService;
  let prismaService: jest.Mocked<PrismaService>;
  let quotesService: jest.Mocked<QuotesService>;
  let portfolioService: jest.Mocked<PortfolioService>;

  const mockPortfolioSummary = {
    totalValue: 100000,
    totalCost: 90000,
    totalGainLoss: 10000,
    totalGainLossPercent: 11.11,
    currency: 'BRL',
    lastUpdated: new Date(),
    investments: [
      {
        id: '1',
        symbol: 'PETR4',
        name: 'Petrobras PN',
        type: 'stock',
        quantity: 100,
        averagePrice: 30,
        currentPrice: 35,
        totalValue: 3500,
        totalCost: 3000,
        gainLoss: 500,
        gainLossPercent: 16.67,
        weight: 35,
        currency: 'BRL',
        sector: 'Energy',
        broker: 'XP',
      },
      {
        id: '2',
        symbol: 'VALE3',
        name: 'Vale ON',
        type: 'stock',
        quantity: 200,
        averagePrice: 80,
        currentPrice: 85,
        totalValue: 17000,
        totalCost: 16000,
        gainLoss: 1000,
        gainLossPercent: 6.25,
        weight: 17,
        currency: 'BRL',
        sector: 'Materials',
        broker: 'XP',
      },
      {
        id: '3',
        symbol: 'ITUB4',
        name: 'Itaú Unibanco PN',
        type: 'stock',
        quantity: 500,
        averagePrice: 25,
        currentPrice: 28,
        totalValue: 14000,
        totalCost: 12500,
        gainLoss: 1500,
        gainLossPercent: 12,
        weight: 14,
        currency: 'BRL',
        sector: 'Financial',
        broker: 'Rico',
      },
      {
        id: '4',
        symbol: 'HASH11',
        name: 'Hashdex Nasdaq Crypto Index',
        type: 'etf',
        quantity: 1000,
        averagePrice: 10,
        currentPrice: 12,
        totalValue: 12000,
        totalCost: 10000,
        gainLoss: 2000,
        gainLossPercent: 20,
        weight: 12,
        currency: 'BRL',
        sector: 'Technology',
        broker: 'XP',
      },
      {
        id: '5',
        symbol: 'TESOURO_SELIC',
        name: 'Tesouro Selic 2029',
        type: 'bond',
        quantity: 10,
        averagePrice: 1000,
        currentPrice: 1050,
        totalValue: 10500,
        totalCost: 10000,
        gainLoss: 500,
        gainLossPercent: 5,
        weight: 10.5,
        currency: 'BRL',
        sector: 'Government',
        broker: 'Tesouro Direto',
      },
    ],
  };

  const mockAssetAllocation = {
    byType: [
      { name: 'stock', value: 34500, percentage: 34.5, count: 3 },
      { name: 'etf', value: 12000, percentage: 12, count: 1 },
      { name: 'bond', value: 10500, percentage: 10.5, count: 1 },
    ],
    bySector: [
      { name: 'Energy', value: 3500, percentage: 3.5, count: 1 },
      { name: 'Materials', value: 17000, percentage: 17, count: 1 },
      { name: 'Financial', value: 14000, percentage: 14, count: 1 },
      { name: 'Technology', value: 12000, percentage: 12, count: 1 },
      { name: 'Government', value: 10500, percentage: 10.5, count: 1 },
    ],
    byBroker: [
      { name: 'XP', value: 27500, percentage: 27.5, count: 3 },
      { name: 'Rico', value: 14000, percentage: 14, count: 1 },
      { name: 'Tesouro Direto', value: 10500, percentage: 10.5, count: 1 },
    ],
    byCurrency: [
      { name: 'BRL', value: 100000, percentage: 100, count: 5 },
    ],
  };

  beforeEach(async () => {
    const mockPrismaService = {
      investment: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const mockQuotesService = {
      getQuote: jest.fn(),
      getMultipleQuotes: jest.fn(),
      updateQuotes: jest.fn(),
    };

    const mockPortfolioService = {
      getPortfolioSummary: jest.fn().mockResolvedValue(mockPortfolioSummary),
      getAssetAllocation: jest.fn().mockResolvedValue(mockAssetAllocation),
      getRebalancingRecommendations: jest.fn(),
      updateCurrentPrices: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioAnalysisService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: QuotesService, useValue: mockQuotesService },
        { provide: PortfolioService, useValue: mockPortfolioService },
      ],
    }).compile();

    service = module.get<PortfolioAnalysisService>(PortfolioAnalysisService);
    prismaService = module.get(PrismaService);
    quotesService = module.get(QuotesService);
    portfolioService = module.get(PortfolioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPortfolioAnalysis', () => {
    it('should return comprehensive portfolio analysis', async () => {
      const userId = 'user-123';
      const result = await service.getPortfolioAnalysis(userId);

      expect(result).toBeDefined();
      expect(result.portfolio).toEqual(mockPortfolioSummary);
      expect(result.diversificationMetrics).toBeDefined();
      expect(result.riskMetrics).toBeDefined();
      expect(result.benchmarkComparison).toBeDefined();
      expect(result.correlationMatrix).toBeDefined();
      expect(result.lastUpdated).toBeInstanceOf(Date);
    });

    it('should return empty analysis for portfolio with no investments', async () => {
      const emptyPortfolio = {
        ...mockPortfolioSummary,
        totalValue: 0,
        investments: [],
      };
      portfolioService.getPortfolioSummary.mockResolvedValueOnce(emptyPortfolio);

      const userId = 'user-empty';
      const result = await service.getPortfolioAnalysis(userId);

      expect(result.portfolio.totalValue).toBe(0);
      expect(result.diversificationMetrics.herfindahlIndex).toBe(0);
      expect(result.riskMetrics.volatility).toBe(0);
    });
  });

  describe('calculateDiversificationMetrics', () => {
    it('should calculate diversification metrics correctly', async () => {
      const userId = 'user-123';
      const result = await service.calculateDiversificationMetrics(userId);

      expect(result).toBeDefined();
      expect(result.herfindahlIndex).toBeGreaterThan(0);
      expect(result.effectiveNumberOfAssets).toBeGreaterThan(0);
      expect(result.diversificationRatio).toBeGreaterThan(0);
      expect(result.sectorConcentration).toBeGreaterThan(0);
      expect(result.geographicConcentration).toBeGreaterThan(0);
      expect(['low', 'medium', 'high']).toContain(result.concentrationRisk);
      expect(result.diversificationScore).toBeGreaterThanOrEqual(0);
      expect(result.diversificationScore).toBeLessThanOrEqual(100);
    });

    it('should assess concentration risk correctly', async () => {
      // Test with highly concentrated portfolio
      const concentratedPortfolio = {
        ...mockPortfolioSummary,
        investments: [
          {
            ...mockPortfolioSummary.investments[0],
            weight: 90, // Very concentrated
          },
          {
            ...mockPortfolioSummary.investments[1],
            weight: 10,
          },
        ],
      };
      portfolioService.getPortfolioSummary.mockResolvedValueOnce(concentratedPortfolio);

      const userId = 'user-concentrated';
      const result = await service.calculateDiversificationMetrics(userId);

      expect(result.concentrationRisk).toBe('high');
      expect(result.herfindahlIndex).toBeGreaterThan(0.25);
    });
  });

  describe('calculateRiskMetrics', () => {
    it('should calculate risk metrics including VaR', async () => {
      const userId = 'user-123';
      const result = await service.calculateRiskMetrics(userId);

      expect(result).toBeDefined();
      expect(result.var95).toBeDefined();
      expect(result.var95.value).toBeLessThan(0); // VaR should be negative
      expect(result.var95.amount).toBeGreaterThan(0); // Amount should be positive
      expect(result.var95.confidenceLevel).toBe(95);
      
      expect(result.var99).toBeDefined();
      expect(result.var99.value).toBeLessThan(result.var95.value); // 99% VaR should be worse than 95%
      expect(result.var99.confidenceLevel).toBe(99);

      expect(result.volatility).toBeGreaterThan(0);
      expect(result.downsideDeviation).toBeGreaterThanOrEqual(0);
      expect(result.maxDrawdown).toBeGreaterThanOrEqual(0);
      expect(result.beta).toBeGreaterThan(0);
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);
    });

    it('should calculate Sortino ratio correctly', async () => {
      const userId = 'user-123';
      const result = await service.calculateRiskMetrics(userId);

      expect(result.sortinoRatio).toBeDefined();
      expect(typeof result.sortinoRatio).toBe('number');
    });
  });

  describe('calculateBenchmarkComparison', () => {
    it('should compare portfolio against benchmarks', async () => {
      const userId = 'user-123';
      const result = await service.calculateBenchmarkComparison(userId);

      expect(result).toBeDefined();
      expect(result.comparisons).toBeInstanceOf(Array);
      expect(result.comparisons.length).toBeGreaterThan(0);
      
      result.comparisons.forEach(comparison => {
        expect(comparison.benchmarkName).toBeDefined();
        expect(comparison.benchmarkSymbol).toBeDefined();
        expect(comparison.correlation).toBeGreaterThanOrEqual(-1);
        expect(comparison.correlation).toBeLessThanOrEqual(1);
        expect(typeof comparison.alpha).toBe('number');
        expect(typeof comparison.beta).toBe('number');
        expect(comparison.trackingError).toBeGreaterThanOrEqual(0);
        expect(typeof comparison.informationRatio).toBe('number');
        expect(typeof comparison.outperformance).toBe('number');
      });

      expect(result.bestPerformingBenchmark).toBeDefined();
      expect(typeof result.relativePerformance).toBe('number');
    });
  });

  describe('calculateCorrelationMatrix', () => {
    it('should calculate correlation matrix for portfolio assets', async () => {
      const userId = 'user-123';
      const result = await service.calculateCorrelationMatrix(userId);

      expect(result).toBeDefined();
      expect(result.correlations).toBeInstanceOf(Array);
      expect(result.averageCorrelation).toBeGreaterThanOrEqual(-1);
      expect(result.averageCorrelation).toBeLessThanOrEqual(1);

      result.correlations.forEach(correlation => {
        expect(correlation.asset1).toBeDefined();
        expect(correlation.asset2).toBeDefined();
        expect(correlation.correlation).toBeGreaterThanOrEqual(-1);
        expect(correlation.correlation).toBeLessThanOrEqual(1);
        expect(correlation.weight1).toBeGreaterThan(0);
        expect(correlation.weight2).toBeGreaterThan(0);
      });
    });

    it('should return empty correlation matrix for single asset portfolio', async () => {
      const singleAssetPortfolio = {
        ...mockPortfolioSummary,
        investments: [mockPortfolioSummary.investments[0]],
      };
      portfolioService.getPortfolioSummary.mockResolvedValueOnce(singleAssetPortfolio);

      const userId = 'user-single';
      const result = await service.calculateCorrelationMatrix(userId);

      expect(result.correlations).toHaveLength(0);
      expect(result.averageCorrelation).toBe(0);
    });
  });

  describe('suggestOptimalAllocation', () => {
    it('should suggest optimal allocation for conservative risk tolerance', async () => {
      const userId = 'user-123';
      const result = await service.suggestOptimalAllocation(userId, 'conservative');

      expect(result).toBeDefined();
      expect(result.riskTolerance).toBe('conservative');
      expect(result.targetAllocations).toBeInstanceOf(Array);
      expect(result.currentAllocation).toBeInstanceOf(Array);
      expect(result.rebalancingActions).toBeInstanceOf(Array);
      expect(result.expectedReturn).toBeGreaterThan(0);
      expect(result.expectedRisk).toBeGreaterThan(0);
      expect(typeof result.sharpeRatio).toBe('number');

      // Conservative portfolio should have higher bond allocation
      const bondAllocation = result.targetAllocations.find(alloc => alloc.assetClass === 'bond');
      expect(bondAllocation).toBeDefined();
      expect(bondAllocation.percentage).toBeGreaterThanOrEqual(50);
    });

    it('should suggest optimal allocation for aggressive risk tolerance', async () => {
      const userId = 'user-123';
      const result = await service.suggestOptimalAllocation(userId, 'aggressive');

      expect(result.riskTolerance).toBe('aggressive');
      
      // Aggressive portfolio should have higher stock allocation
      const stockAllocation = result.targetAllocations.find(alloc => alloc.assetClass === 'stock');
      expect(stockAllocation).toBeDefined();
      expect(stockAllocation.percentage).toBeGreaterThanOrEqual(60);
    });

    it('should generate rebalancing actions when allocation differs significantly', async () => {
      const userId = 'user-123';
      const result = await service.suggestOptimalAllocation(userId, 'moderate');

      expect(result.rebalancingActions).toBeInstanceOf(Array);
      
      result.rebalancingActions.forEach(action => {
        expect(action.assetClass).toBeDefined();
        expect(typeof action.currentPercentage).toBe('number');
        expect(typeof action.targetPercentage).toBe('number');
        expect(typeof action.difference).toBe('number');
        expect(typeof action.suggestedAmount).toBe('number');
        expect(['buy', 'sell']).toContain(action.action);
        expect(Math.abs(action.difference)).toBeGreaterThan(2); // Only suggest if difference > 2%
      });
    });
  });

  describe('getRebalancingStrategy', () => {
    it('should provide detailed rebalancing strategy', async () => {
      const userId = 'user-123';
      const targetAllocation = {
        stock: 60,
        bond: 30,
        etf: 10,
      };

      const mockRebalancingRecommendations = {
        currentAllocation: mockAssetAllocation.byType,
        targetAllocation: Object.entries(targetAllocation).map(([name, percentage]) => ({
          name,
          value: (percentage / 100) * mockPortfolioSummary.totalValue,
          percentage,
          count: 1,
        })),
        recommendations: [
          {
            symbol: 'PETR4',
            action: 'sell' as const,
            currentWeight: 35,
            targetWeight: 20,
            suggestedAmount: 15000,
            suggestedQuantity: 428.57,
          },
        ],
        totalRebalanceAmount: 15000,
      };

      portfolioService.getRebalancingRecommendations.mockResolvedValueOnce(mockRebalancingRecommendations);

      const result = await service.getRebalancingStrategy(userId, targetAllocation);

      expect(result).toBeDefined();
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.estimatedCosts).toBeGreaterThanOrEqual(0);
      expect(result.taxImplications).toBeGreaterThanOrEqual(0);
      expect(result.prioritizedActions).toBeInstanceOf(Array);
      expect(result.totalRebalanceAmount).toBeGreaterThan(0);
      expect(result.implementationOrder).toBeInstanceOf(Array);

      result.recommendations.forEach(recommendation => {
        expect(recommendation.symbol).toBeDefined();
        expect(['buy', 'sell']).toContain(recommendation.action);
        expect(typeof recommendation.currentWeight).toBe('number');
        expect(typeof recommendation.targetWeight).toBe('number');
        expect(recommendation.suggestedAmount).toBeGreaterThan(0);
        expect(recommendation.suggestedQuantity).toBeGreaterThan(0);
      });
    });

    it('should calculate transaction costs correctly', async () => {
      const userId = 'user-123';
      const targetAllocation = { stock: 50, bond: 50 };

      const mockRebalancingRecommendations = {
        currentAllocation: mockAssetAllocation.byType,
        targetAllocation: [],
        recommendations: [
          {
            symbol: 'PETR4',
            action: 'sell' as const,
            currentWeight: 35,
            targetWeight: 25,
            suggestedAmount: 10000,
            suggestedQuantity: 285.71,
          },
        ],
        totalRebalanceAmount: 10000,
      };

      portfolioService.getRebalancingRecommendations.mockResolvedValueOnce(mockRebalancingRecommendations);

      const result = await service.getRebalancingStrategy(userId, targetAllocation);

      expect(result.estimatedCosts).toBeGreaterThan(0);
      expect(result.estimatedCosts).toBeLessThan(result.totalRebalanceAmount); // Costs should be less than total amount
    });
  });

  describe('Advanced Risk Metrics', () => {
    it('should calculate advanced risk metrics correctly', async () => {
      const userId = 'user-123';
      const result = await service.getAdvancedRiskMetrics(userId);

      expect(result).toBeDefined();
      expect(typeof result.sharpeRatio).toBe('number');
      expect(typeof result.treynorRatio).toBe('number');
      expect(typeof result.informationRatio).toBe('number');
      expect(typeof result.calmarRatio).toBe('number');
      expect(typeof result.omegaRatio).toBe('number');
      expect(typeof result.ulcerIndex).toBe('number');
      
      expect(result.ulcerIndex).toBeGreaterThanOrEqual(0);
      expect(result.omegaRatio).toBeGreaterThanOrEqual(0);
    });

    it('should calculate portfolio Sharpe ratio correctly', async () => {
      const userId = 'user-123';
      const sharpeRatio = await service.calculatePortfolioSharpeRatio(userId, 0.05);

      expect(typeof sharpeRatio).toBe('number');
      expect(sharpeRatio).toBeGreaterThanOrEqual(-5); // Reasonable bounds
      expect(sharpeRatio).toBeLessThanOrEqual(5);
    });

    it('should calculate portfolio Treynor ratio correctly', async () => {
      const userId = 'user-123';
      const treynorRatio = await service.calculatePortfolioTreynorRatio(userId, 0.05);

      expect(typeof treynorRatio).toBe('number');
    });
  });

  describe('Portfolio Efficiency Metrics', () => {
    it('should calculate portfolio efficiency metrics', async () => {
      const userId = 'user-123';
      const result = await service.getPortfolioEfficiencyMetrics(userId);

      expect(result).toBeDefined();
      expect(typeof result.isEfficientFrontier).toBe('boolean');
      expect(result.efficiencyScore).toBeGreaterThanOrEqual(0);
      expect(result.efficiencyScore).toBeLessThanOrEqual(100);
      expect(result.improvementSuggestions).toBeInstanceOf(Array);
      
      result.improvementSuggestions.forEach(suggestion => {
        expect(typeof suggestion).toBe('string');
        expect(suggestion.length).toBeGreaterThan(0);
      });
    });

    it('should provide improvement suggestions for poorly diversified portfolio', async () => {
      const concentratedPortfolio = {
        ...mockPortfolioSummary,
        investments: [
          {
            ...mockPortfolioSummary.investments[0],
            weight: 95, // Very concentrated
          },
          {
            ...mockPortfolioSummary.investments[1],
            weight: 5,
          },
        ],
      };
      portfolioService.getPortfolioSummary.mockResolvedValueOnce(concentratedPortfolio);

      const userId = 'user-concentrated';
      const result = await service.getPortfolioEfficiencyMetrics(userId);

      expect(result.improvementSuggestions.length).toBeGreaterThan(0);
      expect(result.improvementSuggestions.some(s => 
        s.includes('diversificar') || s.includes('concentração')
      )).toBe(true);
    });
  });
    it('should handle empty portfolio gracefully', async () => {
      const emptyPortfolio = {
        totalValue: 0,
        totalCost: 0,
        totalGainLoss: 0,
        totalGainLossPercent: 0,
        currency: 'BRL',
        lastUpdated: new Date(),
        investments: [],
      };
      portfolioService.getPortfolioSummary.mockResolvedValueOnce(emptyPortfolio);

      const userId = 'user-empty';
      const result = await service.getPortfolioAnalysis(userId);

      expect(result.portfolio.totalValue).toBe(0);
      expect(result.diversificationMetrics.effectiveNumberOfAssets).toBe(0);
      expect(result.riskMetrics.volatility).toBe(0);
      expect(result.correlationMatrix.correlations).toHaveLength(0);
    });

  describe('Edge Cases', () => {
    it('should handle empty portfolio gracefully', async () => {
      const emptyPortfolio = {
        totalValue: 0,
        totalCost: 0,
        totalGainLoss: 0,
        totalGainLossPercent: 0,
        currency: 'BRL',
        lastUpdated: new Date(),
        investments: [],
      };
      portfolioService.getPortfolioSummary.mockResolvedValueOnce(emptyPortfolio);

      const userId = 'user-empty';
      const result = await service.getPortfolioAnalysis(userId);

      expect(result.portfolio.totalValue).toBe(0);
      expect(result.diversificationMetrics.effectiveNumberOfAssets).toBe(0);
      expect(result.riskMetrics.volatility).toBe(0);
      expect(result.correlationMatrix.correlations).toHaveLength(0);
    });

    it('should handle single asset portfolio', async () => {
      const singleAssetPortfolio = {
        ...mockPortfolioSummary,
        investments: [
          {
            ...mockPortfolioSummary.investments[0],
            weight: 100,
          },
        ],
      };
      portfolioService.getPortfolioSummary.mockResolvedValueOnce(singleAssetPortfolio);

      const userId = 'user-single';
      const result = await service.calculateDiversificationMetrics(userId);

      expect(result.effectiveNumberOfAssets).toBe(1);
      expect(result.diversificationRatio).toBe(1.0);
      expect(result.concentrationRisk).toBe('high');
    });
  });
});