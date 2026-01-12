import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { QuotesService } from './quotes.service';
import { PortfolioService } from './portfolio.service';
import { 
  PortfolioAnalysis,
  DiversificationMetrics,
  RiskMetrics,
  BenchmarkComparison,
  VaRCalculation,
  CorrelationMatrix,
  OptimalAllocation,
  RebalancingStrategy
} from '../interfaces/portfolio-analysis.interface';
import { InvestmentType } from '../dto/create-investment.dto';

@Injectable()
export class PortfolioAnalysisService {
  private readonly logger = new Logger(PortfolioAnalysisService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly quotesService: QuotesService,
    private readonly portfolioService: PortfolioService,
  ) {}

  async getPortfolioAnalysis(userId: string): Promise<PortfolioAnalysis> {
    const portfolio = await this.portfolioService.getPortfolioSummary(userId);
    
    if (portfolio.investments.length === 0) {
      return this.getEmptyAnalysis();
    }

    const [
      diversificationMetrics,
      riskMetrics,
      benchmarkComparison,
      correlationMatrix
    ] = await Promise.all([
      this.calculateDiversificationMetrics(userId),
      this.calculateRiskMetrics(userId),
      this.calculateBenchmarkComparison(userId),
      this.calculateCorrelationMatrix(userId)
    ]);

    return {
      portfolio,
      diversificationMetrics,
      riskMetrics,
      benchmarkComparison,
      correlationMatrix,
      lastUpdated: new Date(),
    };
  }

  async calculateDiversificationMetrics(userId: string): Promise<DiversificationMetrics> {
    const portfolio = await this.portfolioService.getPortfolioSummary(userId);
    const assetAllocation = await this.portfolioService.getAssetAllocation(userId);

    // Calculate Herfindahl-Hirschman Index (HHI) for concentration
    const hhi = this.calculateHHI(portfolio.investments.map(inv => inv.weight));
    
    // Calculate effective number of assets
    const effectiveAssets = 1 / (portfolio.investments.reduce((sum, inv) => 
      sum + Math.pow(inv.weight / 100, 2), 0));

    // Calculate diversification ratio
    const diversificationRatio = this.calculateDiversificationRatio(portfolio.investments);

    // Sector concentration
    const sectorConcentration = this.calculateConcentration(assetAllocation.bySector);
    
    // Geographic concentration (if available)
    const geographicConcentration = this.calculateGeographicConcentration(portfolio.investments);

    return {
      herfindahlIndex: hhi,
      effectiveNumberOfAssets: effectiveAssets,
      diversificationRatio,
      sectorConcentration,
      geographicConcentration,
      concentrationRisk: this.assessConcentrationRisk(hhi),
      diversificationScore: this.calculateDiversificationScore(hhi, effectiveAssets, sectorConcentration),
    };
  }

  async calculateRiskMetrics(userId: string): Promise<RiskMetrics> {
    const portfolio = await this.portfolioService.getPortfolioSummary(userId);
    
    // Get historical returns for VaR calculation
    const historicalReturns = await this.getHistoricalReturns(userId, 252); // 1 year of daily returns
    
    // Calculate Value at Risk (VaR)
    const var95 = this.calculateVaR(historicalReturns, 0.95);
    const var99 = this.calculateVaR(historicalReturns, 0.99);
    
    // Calculate Conditional VaR (Expected Shortfall)
    const cvar95 = this.calculateCVaR(historicalReturns, 0.95);
    const cvar99 = this.calculateCVaR(historicalReturns, 0.99);

    // Calculate portfolio volatility
    const volatility = this.calculatePortfolioVolatility(historicalReturns);
    
    // Calculate downside deviation
    const downsideDeviation = this.calculateDownsideDeviation(historicalReturns);
    
    // Calculate maximum drawdown
    const maxDrawdown = this.calculateMaxDrawdown(historicalReturns);
    
    // Calculate Sortino ratio
    const sortinoRatio = this.calculateSortinoRatio(historicalReturns, 0.05); // 5% risk-free rate

    // Calculate beta (if benchmark data available)
    const beta = await this.calculatePortfolioBeta(userId);

    return {
      var95: {
        value: var95,
        amount: portfolio.totalValue * Math.abs(var95),
        confidenceLevel: 95,
      },
      var99: {
        value: var99,
        amount: portfolio.totalValue * Math.abs(var99),
        confidenceLevel: 99,
      },
      cvar95,
      cvar99,
      volatility: volatility * 100, // Convert to percentage
      downsideDeviation: downsideDeviation * 100,
      maxDrawdown: maxDrawdown * 100,
      sortinoRatio,
      beta,
      riskScore: this.calculateRiskScore(volatility, maxDrawdown, var95),
    };
  }

  async calculateBenchmarkComparison(userId: string): Promise<BenchmarkComparison> {
    const portfolio = await this.portfolioService.getPortfolioSummary(userId);
    
    // Define benchmarks (in a real implementation, these would come from external APIs)
    const benchmarks = [
      { name: 'IBOVESPA', symbol: '^BVSP', type: 'index' },
      { name: 'CDI', symbol: 'CDI', type: 'fixed_income' },
      { name: 'S&P 500', symbol: '^GSPC', type: 'index' },
      { name: 'IFIX', symbol: '^IFIX', type: 'real_estate' },
    ];

    const comparisons = [];
    
    for (const benchmark of benchmarks) {
      const benchmarkData = await this.getBenchmarkData(benchmark.symbol, 252);
      const portfolioReturns = await this.getHistoricalReturns(userId, 252);
      
      if (benchmarkData && portfolioReturns.length > 0) {
        const correlation = this.calculateCorrelation(portfolioReturns, benchmarkData.returns);
        const alpha = this.calculateAlpha(portfolioReturns, benchmarkData.returns, 0.05);
        const beta = this.calculateBeta(portfolioReturns, benchmarkData.returns);
        const trackingError = this.calculateTrackingError(portfolioReturns, benchmarkData.returns);
        const informationRatio = this.calculateInformationRatio(portfolioReturns, benchmarkData.returns);

        comparisons.push({
          benchmarkName: benchmark.name,
          benchmarkSymbol: benchmark.symbol,
          correlation,
          alpha: alpha * 100,
          beta,
          trackingError: trackingError * 100,
          informationRatio,
          outperformance: this.calculateOutperformance(portfolioReturns, benchmarkData.returns),
        });
      }
    }

    return {
      comparisons,
      bestPerformingBenchmark: this.findBestBenchmark(comparisons),
      relativePerformance: this.calculateRelativePerformance(comparisons),
    };
  }

  async calculateCorrelationMatrix(userId: string): Promise<CorrelationMatrix> {
    const portfolio = await this.portfolioService.getPortfolioSummary(userId);
    
    if (portfolio.investments.length < 2) {
      return { correlations: [], averageCorrelation: 0 };
    }

    const correlations = [];
    
    // Calculate pairwise correlations between investments
    for (let i = 0; i < portfolio.investments.length; i++) {
      for (let j = i + 1; j < portfolio.investments.length; j++) {
        const asset1 = portfolio.investments[i];
        const asset2 = portfolio.investments[j];
        
        const returns1 = await this.getAssetReturns(asset1.symbol, asset1.type, 252);
        const returns2 = await this.getAssetReturns(asset2.symbol, asset2.type, 252);
        
        if (returns1.length > 0 && returns2.length > 0) {
          const correlation = this.calculateCorrelation(returns1, returns2);
          
          correlations.push({
            asset1: asset1.symbol,
            asset2: asset2.symbol,
            correlation,
            weight1: asset1.weight,
            weight2: asset2.weight,
          });
        }
      }
    }

    const averageCorrelation = correlations.length > 0 
      ? correlations.reduce((sum, corr) => sum + corr.correlation, 0) / correlations.length
      : 0;

    return {
      correlations,
      averageCorrelation,
    };
  }

  async suggestOptimalAllocation(userId: string, riskTolerance: 'conservative' | 'moderate' | 'aggressive'): Promise<OptimalAllocation> {
    const portfolio = await this.portfolioService.getPortfolioSummary(userId);
    const riskMetrics = await this.calculateRiskMetrics(userId);
    
    // Define target allocations based on risk tolerance
    const targetAllocations = this.getTargetAllocations(riskTolerance);
    
    // Calculate current allocation
    const currentAllocation = await this.portfolioService.getAssetAllocation(userId);
    
    // Generate rebalancing suggestions
    const rebalancingActions = [];
    
    for (const target of targetAllocations) {
      const current = currentAllocation.byType.find(item => item.name === target.assetClass);
      const currentPercentage = current ? current.percentage : 0;
      const difference = target.percentage - currentPercentage;
      
      if (Math.abs(difference) > 2) { // Only suggest if difference > 2%
        const targetValue = (target.percentage / 100) * portfolio.totalValue;
        const currentValue = current ? current.value : 0;
        const suggestedAmount = targetValue - currentValue;
        
        rebalancingActions.push({
          assetClass: target.assetClass,
          currentPercentage,
          targetPercentage: target.percentage,
          difference,
          suggestedAmount,
          action: suggestedAmount > 0 ? 'buy' : 'sell',
        });
      }
    }

    return {
      riskTolerance,
      targetAllocations,
      currentAllocation: currentAllocation.byType,
      rebalancingActions,
      expectedReturn: this.calculateExpectedReturn(targetAllocations),
      expectedRisk: this.calculateExpectedRisk(targetAllocations),
      sharpeRatio: this.calculateExpectedSharpeRatio(targetAllocations),
    };
  }

  async getRebalancingStrategy(userId: string, targetAllocation: { [key: string]: number }): Promise<RebalancingStrategy> {
    const portfolio = await this.portfolioService.getPortfolioSummary(userId);
    const recommendations = await this.portfolioService.getRebalancingRecommendations(userId, targetAllocation);
    
    // Calculate transaction costs
    const estimatedCosts = this.calculateTransactionCosts(recommendations.recommendations);
    
    // Calculate tax implications with Brazilian tax rules
    const taxImplications = this.calculateTaxImplications(recommendations.recommendations, portfolio.investments);
    
    // Prioritize actions by impact and cost
    const prioritizedActions = this.prioritizeRebalancingActions(recommendations.recommendations, estimatedCosts);

    return {
      recommendations: recommendations.recommendations,
      estimatedCosts,
      taxImplications,
      prioritizedActions,
      totalRebalanceAmount: recommendations.totalRebalanceAmount,
      implementationOrder: this.getImplementationOrder(prioritizedActions),
    };
  }

  // Private helper methods

  private calculateHHI(weights: number[]): number {
    return weights.reduce((sum, weight) => sum + Math.pow(weight, 2), 0);
  }

  private calculateDiversificationRatio(investments: any[]): number {
    // Calculate diversification ratio using actual portfolio weights and estimated correlations
    if (investments.length < 2) return 1.0;
    
    // Estimate individual asset volatilities based on asset type
    const assetVolatilities = investments.map(inv => {
      const baseVolatility = this.getAssetTypeVolatility(inv.type);
      return {
        weight: inv.weight / 100,
        volatility: baseVolatility,
      };
    });
    
    // Calculate weighted average of individual volatilities
    const weightedVolatilities = assetVolatilities.reduce((sum, asset) => 
      sum + asset.weight * asset.volatility, 0);
    
    // Estimate portfolio volatility considering correlations
    // Assuming average correlation of 0.3 between assets
    const avgCorrelation = 0.3;
    const portfolioVariance = assetVolatilities.reduce((variance, asset1, i) => {
      return variance + assetVolatilities.reduce((innerSum, asset2, j) => {
        const correlation = i === j ? 1.0 : avgCorrelation;
        return innerSum + asset1.weight * asset2.weight * asset1.volatility * asset2.volatility * correlation;
      }, 0);
    }, 0);
    
    const portfolioVolatility = Math.sqrt(portfolioVariance);
    
    return portfolioVolatility > 0 ? weightedVolatilities / portfolioVolatility : 1.0;
  }

  private calculateConcentration(allocation: any[]): number {
    return allocation.reduce((sum, item) => sum + Math.pow(item.percentage / 100, 2), 0);
  }

  private calculateGeographicConcentration(investments: any[]): number {
    // Calculate geographic concentration based on asset types and sectors
    const geographicWeights = new Map<string, number>();
    
    investments.forEach(inv => {
      // Estimate geographic exposure based on asset type and sector
      let region = 'Unknown';
      
      if (inv.type === 'stock' || inv.type === 'etf') {
        // For Brazilian stocks (ending with .SA or common Brazilian symbols)
        if (inv.symbol.endsWith('.SA') || this.isBrazilianStock(inv.symbol)) {
          region = 'Brazil';
        } else if (inv.symbol.length <= 4 && !inv.symbol.includes('.')) {
          region = 'US'; // Likely US stock
        } else {
          region = 'International';
        }
      } else if (inv.type === 'crypto') {
        region = 'Global'; // Crypto is global
      } else if (inv.type === 'bond') {
        region = inv.currency === 'BRL' ? 'Brazil' : 'International';
      } else {
        region = 'Brazil'; // Default for other types
      }
      
      const currentWeight = geographicWeights.get(region) || 0;
      geographicWeights.set(region, currentWeight + (inv.weight / 100));
    });
    
    // Calculate HHI for geographic concentration
    let hhi = 0;
    geographicWeights.forEach(weight => {
      hhi += weight * weight;
    });
    
    return hhi;
  }

  private isBrazilianStock(symbol: string): boolean {
    // Common Brazilian stock patterns
    const brazilianPatterns = [
      /^[A-Z]{4}[0-9]{1,2}$/, // PETR4, VALE3, etc.
      /^[A-Z]{3}[0-9]{1,2}$/, // B3SA3, etc.
    ];
    
    return brazilianPatterns.some(pattern => pattern.test(symbol));
  }

  private assessConcentrationRisk(hhi: number): 'low' | 'medium' | 'high' {
    if (hhi < 0.15) return 'low';
    if (hhi < 0.25) return 'medium';
    return 'high';
  }

  private calculateDiversificationScore(hhi: number, effectiveAssets: number, sectorConcentration: number): number {
    // Score from 0-100, higher is better diversification
    const hhiScore = Math.max(0, 100 - (hhi * 400));
    const assetScore = Math.min(100, effectiveAssets * 10);
    const sectorScore = Math.max(0, 100 - (sectorConcentration * 200));
    
    return (hhiScore + assetScore + sectorScore) / 3;
  }

  private calculateVaR(returns: number[], confidenceLevel: number): number {
    const sortedReturns = returns.sort((a, b) => a - b);
    const index = Math.floor((1 - confidenceLevel) * returns.length);
    return sortedReturns[index] || 0;
  }

  private calculateCVaR(returns: number[], confidenceLevel: number): number {
    const varValue = this.calculateVaR(returns, confidenceLevel);
    const tailReturns = returns.filter(ret => ret <= varValue);
    return tailReturns.length > 0 
      ? tailReturns.reduce((sum, ret) => sum + ret, 0) / tailReturns.length
      : 0;
  }

  private calculatePortfolioVolatility(returns: number[]): number {
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    return Math.sqrt(variance * 252); // Annualized
  }

  private calculateDownsideDeviation(returns: number[]): number {
    const negativeReturns = returns.filter(ret => ret < 0);
    if (negativeReturns.length === 0) return 0;
    
    const variance = negativeReturns.reduce((sum, ret) => sum + Math.pow(ret, 2), 0) / negativeReturns.length;
    return Math.sqrt(variance * 252); // Annualized
  }

  private calculateMaxDrawdown(returns: number[]): number {
    let peak = 1;
    let maxDrawdown = 0;
    let currentValue = 1;

    for (const ret of returns) {
      currentValue *= (1 + ret);
      if (currentValue > peak) peak = currentValue;
      const drawdown = (peak - currentValue) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    return maxDrawdown;
  }

  private calculateSortinoRatio(returns: number[], riskFreeRate: number): number {
    const excessReturns = returns.map(ret => ret - riskFreeRate / 252);
    const meanExcessReturn = excessReturns.reduce((sum, ret) => sum + ret, 0) / excessReturns.length;
    const downsideDeviation = this.calculateDownsideDeviation(excessReturns);
    
    return downsideDeviation > 0 ? (meanExcessReturn * 252) / downsideDeviation : 0;
  }

  private async calculatePortfolioBeta(userId: string): Promise<number> {
    // Calculate portfolio beta against IBOVESPA (main Brazilian market index)
    const portfolio = await this.portfolioService.getPortfolioSummary(userId);
    
    if (portfolio.investments.length === 0) return 1.0;
    
    let portfolioBeta = 0;
    
    // Calculate weighted average beta based on asset types
    portfolio.investments.forEach(investment => {
      const assetBeta = this.getAssetTypeBeta(investment.type, investment.sector);
      const weight = investment.weight / 100;
      portfolioBeta += weight * assetBeta;
    });
    
    return portfolioBeta;
  }

  private getAssetTypeBeta(assetType: string, sector?: string): number {
    // Estimated betas by asset type relative to IBOVESPA
    const baseBetas = {
      stock: 1.0,
      etf: 0.95,
      fund: 0.8,
      crypto: 1.5, // Higher volatility
      bond: 0.2,
      real_estate: 0.7,
    };
    
    let beta = baseBetas[assetType] || 1.0;
    
    // Adjust beta based on sector (for stocks)
    if (assetType === 'stock' && sector) {
      const sectorAdjustments = {
        'Technology': 1.2,
        'Financial': 1.1,
        'Energy': 1.3,
        'Healthcare': 0.8,
        'Utilities': 0.6,
        'Consumer': 0.9,
        'Industrial': 1.0,
      };
      
      const adjustment = sectorAdjustments[sector] || 1.0;
      beta *= adjustment;
    }
    
    return beta;
  }

  private getAssetTypeVolatility(assetType: string): number {
    // Estimated annual volatilities by asset type
    const volatilities = {
      stock: 0.25,
      etf: 0.20,
      fund: 0.15,
      crypto: 0.60,
      bond: 0.08,
      real_estate: 0.18,
    };
    
    return volatilities[assetType] || 0.20;
  }

  private calculateRiskScore(volatility: number, maxDrawdown: number, var95: number): number {
    // Score from 0-100, higher is riskier
    const volScore = Math.min(100, volatility * 200);
    const drawdownScore = Math.min(100, maxDrawdown * 200);
    const varScore = Math.min(100, Math.abs(var95) * 500);
    
    return (volScore + drawdownScore + varScore) / 3;
  }

  private calculateCorrelation(returns1: number[], returns2: number[]): number {
    const n = Math.min(returns1.length, returns2.length);
    if (n < 2) return 0;

    const mean1 = returns1.slice(0, n).reduce((sum, ret) => sum + ret, 0) / n;
    const mean2 = returns2.slice(0, n).reduce((sum, ret) => sum + ret, 0) / n;

    let numerator = 0;
    let sum1Sq = 0;
    let sum2Sq = 0;

    for (let i = 0; i < n; i++) {
      const diff1 = returns1[i] - mean1;
      const diff2 = returns2[i] - mean2;
      numerator += diff1 * diff2;
      sum1Sq += diff1 * diff1;
      sum2Sq += diff2 * diff2;
    }

    const denominator = Math.sqrt(sum1Sq * sum2Sq);
    return denominator > 0 ? numerator / denominator : 0;
  }

  private calculateAlpha(portfolioReturns: number[], benchmarkReturns: number[], riskFreeRate: number): number {
    const beta = this.calculateBeta(portfolioReturns, benchmarkReturns);
    const portfolioReturn = portfolioReturns.reduce((sum, ret) => sum + ret, 0) / portfolioReturns.length;
    const benchmarkReturn = benchmarkReturns.reduce((sum, ret) => sum + ret, 0) / benchmarkReturns.length;
    
    return portfolioReturn - (riskFreeRate / 252 + beta * (benchmarkReturn - riskFreeRate / 252));
  }

  private calculateBeta(portfolioReturns: number[], benchmarkReturns: number[]): number {
    const correlation = this.calculateCorrelation(portfolioReturns, benchmarkReturns);
    const portfolioVol = this.calculatePortfolioVolatility(portfolioReturns);
    const benchmarkVol = this.calculatePortfolioVolatility(benchmarkReturns);
    
    return benchmarkVol > 0 ? correlation * (portfolioVol / benchmarkVol) : 0;
  }

  private calculateTrackingError(portfolioReturns: number[], benchmarkReturns: number[]): number {
    const n = Math.min(portfolioReturns.length, benchmarkReturns.length);
    const differences = [];
    
    for (let i = 0; i < n; i++) {
      differences.push(portfolioReturns[i] - benchmarkReturns[i]);
    }
    
    return this.calculatePortfolioVolatility(differences);
  }

  private calculateInformationRatio(portfolioReturns: number[], benchmarkReturns: number[]): number {
    const trackingError = this.calculateTrackingError(portfolioReturns, benchmarkReturns);
    const excessReturn = portfolioReturns.reduce((sum, ret, i) => 
      sum + (ret - (benchmarkReturns[i] || 0)), 0) / portfolioReturns.length;
    
    return trackingError > 0 ? (excessReturn * 252) / trackingError : 0;
  }

  private calculateOutperformance(portfolioReturns: number[], benchmarkReturns: number[]): number {
    const portfolioReturn = portfolioReturns.reduce((sum, ret) => sum + ret, 0);
    const benchmarkReturn = benchmarkReturns.reduce((sum, ret) => sum + ret, 0);
    return (portfolioReturn - benchmarkReturn) * 100;
  }

  private findBestBenchmark(comparisons: any[]): string {
    return comparisons.reduce((best, current) => 
      current.outperformance > best.outperformance ? current : best,
      comparisons[0] || { benchmarkName: 'None' }
    ).benchmarkName;
  }

  private calculateRelativePerformance(comparisons: any[]): number {
    return comparisons.length > 0 
      ? comparisons.reduce((sum, comp) => sum + comp.outperformance, 0) / comparisons.length
      : 0;
  }

  private getTargetAllocations(riskTolerance: string) {
    const allocations = {
      conservative: [
        { assetClass: 'bond', percentage: 60 },
        { assetClass: 'stock', percentage: 30 },
        { assetClass: 'real_estate', percentage: 10 },
      ],
      moderate: [
        { assetClass: 'stock', percentage: 50 },
        { assetClass: 'bond', percentage: 35 },
        { assetClass: 'real_estate', percentage: 10 },
        { assetClass: 'crypto', percentage: 5 },
      ],
      aggressive: [
        { assetClass: 'stock', percentage: 70 },
        { assetClass: 'bond', percentage: 15 },
        { assetClass: 'real_estate', percentage: 10 },
        { assetClass: 'crypto', percentage: 5 },
      ],
    };
    
    return allocations[riskTolerance] || allocations.moderate;
  }

  private calculateExpectedReturn(allocations: any[]): number {
    // More realistic expected returns by asset class based on Brazilian market
    const expectedReturns = {
      stock: 0.12, // Brazilian stocks historical average
      bond: 0.08,  // Brazilian government bonds (Selic + spread)
      real_estate: 0.10, // REITs (FIIs)
      crypto: 0.20, // High risk, high return
      etf: 0.11,
      fund: 0.09,
    };
    
    return allocations.reduce((sum, alloc) => 
      sum + (alloc.percentage / 100) * (expectedReturns[alloc.assetClass] || 0.08), 0) * 100;
  }

  async calculatePortfolioSharpeRatio(userId: string, riskFreeRate: number = 0.05): Promise<number> {
    const riskMetrics = await this.calculateRiskMetrics(userId);
    const portfolio = await this.portfolioService.getPortfolioSummary(userId);
    
    if (portfolio.investments.length === 0 || riskMetrics.volatility === 0) {
      return 0;
    }

    // Calculate portfolio return based on current gains
    const portfolioReturn = portfolio.totalGainLossPercent / 100;
    const annualizedReturn = portfolioReturn; // Assuming this is already annualized
    
    return (annualizedReturn - riskFreeRate) / (riskMetrics.volatility / 100);
  }

  async calculatePortfolioTreynorRatio(userId: string, riskFreeRate: number = 0.05): Promise<number> {
    const riskMetrics = await this.calculateRiskMetrics(userId);
    const portfolio = await this.portfolioService.getPortfolioSummary(userId);
    
    if (portfolio.investments.length === 0 || riskMetrics.beta === 0) {
      return 0;
    }

    const portfolioReturn = portfolio.totalGainLossPercent / 100;
    return (portfolioReturn - riskFreeRate) / riskMetrics.beta;
  }

  async getAdvancedRiskMetrics(userId: string): Promise<{
    sharpeRatio: number;
    treynorRatio: number;
    informationRatio: number;
    calmarRatio: number;
    omegaRatio: number;
    ulcerIndex: number;
  }> {
    const portfolioReturns = await this.getHistoricalReturns(userId, 252);
    const benchmarkData = await this.getBenchmarkData('^BVSP', 252);
    const informationRatio = benchmarkData ? 
      this.calculateInformationRatio(portfolioReturns, benchmarkData.returns) : 0;

    const [sharpeRatio, treynorRatio] = await Promise.all([
      this.calculatePortfolioSharpeRatio(userId),
      this.calculatePortfolioTreynorRatio(userId),
    ]);

    const riskMetrics = await this.calculateRiskMetrics(userId);
    const portfolio = await this.portfolioService.getPortfolioSummary(userId);
    
    // Calculate Calmar Ratio (Annual Return / Max Drawdown)
    const annualReturn = portfolio.totalGainLossPercent / 100;
    const calmarRatio = riskMetrics.maxDrawdown > 0 ? 
      annualReturn / (riskMetrics.maxDrawdown / 100) : 0;

    // Calculate Omega Ratio (simplified version)
    const historicalReturns = await this.getHistoricalReturns(userId, 252);
    const threshold = 0.05 / 252; // Daily risk-free rate
    const omegaRatio = this.calculateOmegaRatio(historicalReturns, threshold);

    // Calculate Ulcer Index
    const ulcerIndex = this.calculateUlcerIndex(historicalReturns);

    return {
      sharpeRatio,
      treynorRatio,
      informationRatio,
      calmarRatio,
      omegaRatio,
      ulcerIndex,
    };
  }

  private calculateOmegaRatio(returns: number[], threshold: number): number {
    const excessReturns = returns.map(ret => ret - threshold);
    const gains = excessReturns.filter(ret => ret > 0).reduce((sum, ret) => sum + ret, 0);
    const losses = Math.abs(excessReturns.filter(ret => ret < 0).reduce((sum, ret) => sum + ret, 0));
    
    return losses > 0 ? gains / losses : gains > 0 ? Infinity : 0;
  }

  private calculateUlcerIndex(returns: number[]): number {
    let peak = 1;
    let sumSquaredDrawdowns = 0;
    let currentValue = 1;

    for (const ret of returns) {
      currentValue *= (1 + ret);
      if (currentValue > peak) peak = currentValue;
      
      const drawdown = (peak - currentValue) / peak;
      sumSquaredDrawdowns += drawdown * drawdown;
    }

    return Math.sqrt(sumSquaredDrawdowns / returns.length) * 100;
  }

  async getPortfolioEfficiencyMetrics(userId: string): Promise<{
    isEfficientFrontier: boolean;
    efficiencyScore: number;
    improvementSuggestions: string[];
  }> {
    const analysis = await this.getPortfolioAnalysis(userId);
    const advancedMetrics = await this.getAdvancedRiskMetrics(userId);
    
    // Simple efficiency scoring based on risk-adjusted returns
    const riskAdjustedReturn = advancedMetrics.sharpeRatio;
    const diversificationScore = analysis.diversificationMetrics.diversificationScore;
    
    // Efficiency score combines risk-adjusted returns and diversification
    const efficiencyScore = (riskAdjustedReturn * 40 + diversificationScore * 0.6);
    
    const improvementSuggestions: string[] = [];
    
    if (analysis.diversificationMetrics.concentrationRisk === 'high') {
      improvementSuggestions.push('Considere diversificar mais sua carteira para reduzir o risco de concentração');
    }
    
    if (advancedMetrics.sharpeRatio < 0.5) {
      improvementSuggestions.push('O retorno ajustado ao risco está baixo. Considere revisar a alocação de ativos');
    }
    
    if (analysis.riskMetrics.maxDrawdown > 20) {
      improvementSuggestions.push('O drawdown máximo está alto. Considere adicionar ativos defensivos');
    }
    
    if (analysis.diversificationMetrics.effectiveNumberOfAssets < 5) {
      improvementSuggestions.push('Considere aumentar o número efetivo de ativos na carteira');
    }

    return {
      isEfficientFrontier: efficiencyScore > 70,
      efficiencyScore: Math.min(100, Math.max(0, efficiencyScore)),
      improvementSuggestions,
    };
  }

  private calculateExpectedRisk(allocations: any[]): number {
    // More realistic risk estimates by asset class
    const risks = {
      stock: 0.25,
      bond: 0.08,
      real_estate: 0.18,
      crypto: 0.60,
      etf: 0.20,
      fund: 0.15,
    };
    
    // Calculate portfolio risk considering correlations
    let portfolioVariance = 0;
    const avgCorrelation = 0.4; // Estimated average correlation
    
    for (let i = 0; i < allocations.length; i++) {
      for (let j = 0; j < allocations.length; j++) {
        const weight1 = allocations[i].percentage / 100;
        const weight2 = allocations[j].percentage / 100;
        const risk1 = risks[allocations[i].assetClass] || 0.15;
        const risk2 = risks[allocations[j].assetClass] || 0.15;
        const correlation = i === j ? 1.0 : avgCorrelation;
        
        portfolioVariance += weight1 * weight2 * risk1 * risk2 * correlation;
      }
    }
    
    return Math.sqrt(portfolioVariance) * 100;
  }

  private calculateExpectedSharpeRatio(allocations: any[]): number {
    const expectedReturn = this.calculateExpectedReturn(allocations) / 100;
    const expectedRisk = this.calculateExpectedRisk(allocations) / 100;
    const riskFreeRate = 0.05;
    
    return expectedRisk > 0 ? (expectedReturn - riskFreeRate) / expectedRisk : 0;
  }

  private calculateTransactionCosts(actions: any[]): number {
    // More realistic transaction cost calculation based on Brazilian market
    return actions.reduce((sum, action) => {
      let costRate = 0.005; // Default 0.5%
      
      // Different cost rates by asset type
      if (action.assetClass === 'stock') {
        costRate = 0.003; // 0.3% for stocks (brokerage + taxes)
      } else if (action.assetClass === 'crypto') {
        costRate = 0.01; // 1% for crypto (higher fees)
      } else if (action.assetClass === 'bond') {
        costRate = 0.002; // 0.2% for bonds
      } else if (action.assetClass === 'fund') {
        costRate = 0.001; // 0.1% for funds
      }
      
      return sum + Math.abs(action.suggestedAmount) * costRate;
    }, 0);
  }

  private calculateTaxImplications(actions: any[], investments: any[]): number {
    // Brazilian tax calculation for investment gains
    return actions
      .filter(action => action.action === 'sell')
      .reduce((sum, action) => {
        const investment = investments.find(inv => inv.symbol === action.symbol);
        if (investment && investment.gainLoss > 0) {
          let taxRate = 0.15; // Default 15% capital gains tax
          
          // Different tax rates by asset type in Brazil
          if (investment.type === 'stock') {
            // Stocks: 15% for gains, but exempt up to R$ 20,000/month in sales
            const monthlySalesLimit = 20000; // R$ 20,000
            if (action.suggestedAmount <= monthlySalesLimit) {
              taxRate = 0; // Exempt
            } else {
              taxRate = 0.15;
            }
          } else if (investment.type === 'fund') {
            // Investment funds: 15% to 22.5% depending on time held
            taxRate = 0.15; // Assuming > 2 years
          } else if (investment.type === 'crypto') {
            // Crypto: 15% for gains, exempt up to R$ 35,000/month
            const cryptoLimit = 35000;
            if (action.suggestedAmount <= cryptoLimit) {
              taxRate = 0;
            } else {
              taxRate = 0.15;
            }
          }
          
          return sum + investment.gainLoss * taxRate;
        }
        return sum;
      }, 0);
  }

  private prioritizeRebalancingActions(actions: any[], costs: number): any[] {
    return actions
      .map(action => ({
        ...action,
        priority: Math.abs(action.currentWeight - action.targetWeight) / (costs / actions.length),
      }))
      .sort((a, b) => b.priority - a.priority);
  }

  private getImplementationOrder(actions: any[]): string[] {
    // Sell first, then buy
    const sellActions = actions.filter(a => a.action === 'sell').map(a => a.symbol);
    const buyActions = actions.filter(a => a.action === 'buy').map(a => a.symbol);
    return [...sellActions, ...buyActions];
  }

  // Historical data methods - improved with more realistic data generation
  private async getHistoricalReturns(userId: string, days: number): Promise<number[]> {
    // In production, this would fetch actual historical portfolio values
    // For now, generate more realistic returns based on user's actual portfolio
    const portfolio = await this.portfolioService.getPortfolioSummary(userId);
    
    if (portfolio.investments.length === 0) {
      return [];
    }
    
    // Calculate portfolio-weighted expected return and volatility
    let expectedReturn = 0;
    let portfolioVolatility = 0;
    
    portfolio.investments.forEach(inv => {
      const weight = inv.weight / 100;
      const assetReturn = this.getAssetTypeExpectedReturn(inv.type);
      const assetVolatility = this.getAssetTypeVolatility(inv.type);
      
      expectedReturn += weight * assetReturn;
      portfolioVolatility += weight * weight * assetVolatility * assetVolatility;
    });
    
    portfolioVolatility = Math.sqrt(portfolioVolatility);
    
    // Generate returns with realistic autocorrelation and volatility clustering
    const returns = [];
    let previousReturn = 0;
    const autocorrelation = 0.1; // Slight positive autocorrelation
    
    for (let i = 0; i < days; i++) {
      // Add some volatility clustering (GARCH-like behavior)
      const volatilityMultiplier = 1 + 0.3 * Math.abs(previousReturn);
      const dailyVolatility = (portfolioVolatility / Math.sqrt(252)) * volatilityMultiplier;
      const dailyReturn = (expectedReturn / 252) + dailyVolatility * this.generateNormalRandom(0, 1);
      
      // Add autocorrelation
      const correlatedReturn = dailyReturn + autocorrelation * previousReturn;
      returns.push(correlatedReturn);
      previousReturn = correlatedReturn;
    }
    
    return returns;
  }

  private async getBenchmarkData(symbol: string, days: number): Promise<{ returns: number[] } | null> {
    // Generate benchmark returns based on the specific benchmark
    const benchmarkParams = this.getBenchmarkParameters(symbol);
    if (!benchmarkParams) return null;
    
    const returns = [];
    let previousReturn = 0;
    
    for (let i = 0; i < days; i++) {
      const dailyReturn = (benchmarkParams.expectedReturn / 252) + 
        (benchmarkParams.volatility / Math.sqrt(252)) * this.generateNormalRandom(0, 1);
      
      // Add some autocorrelation for more realistic behavior
      const correlatedReturn = dailyReturn + 0.05 * previousReturn;
      returns.push(correlatedReturn);
      previousReturn = correlatedReturn;
    }
    
    return { returns };
  }

  private async getAssetReturns(symbol: string, type: string, days: number): Promise<number[]> {
    // Generate asset-specific returns
    const expectedReturn = this.getAssetTypeExpectedReturn(type);
    const volatility = this.getAssetTypeVolatility(type);
    
    const returns = [];
    let previousReturn = 0;
    
    for (let i = 0; i < days; i++) {
      const dailyReturn = (expectedReturn / 252) + 
        (volatility / Math.sqrt(252)) * this.generateNormalRandom(0, 1);
      
      // Add autocorrelation based on asset type
      const autocorr = type === 'crypto' ? 0.05 : type === 'stock' ? 0.1 : 0.02;
      const correlatedReturn = dailyReturn + autocorr * previousReturn;
      returns.push(correlatedReturn);
      previousReturn = correlatedReturn;
    }
    
    return returns;
  }

  private getAssetTypeExpectedReturn(assetType: string): number {
    const expectedReturns = {
      stock: 0.12,
      etf: 0.11,
      fund: 0.09,
      crypto: 0.20,
      bond: 0.08,
      real_estate: 0.10,
    };
    
    return expectedReturns[assetType] || 0.08;
  }

  private getBenchmarkParameters(symbol: string): { expectedReturn: number; volatility: number } | null {
    const benchmarks = {
      '^BVSP': { expectedReturn: 0.10, volatility: 0.25 }, // IBOVESPA
      'CDI': { expectedReturn: 0.08, volatility: 0.02 },   // CDI
      '^GSPC': { expectedReturn: 0.09, volatility: 0.18 }, // S&P 500
      '^IFIX': { expectedReturn: 0.08, volatility: 0.15 }, // IFIX (REITs)
    };
    
    return benchmarks[symbol] || null;
  }

  private generateNormalRandom(mean: number = 0, stdDev: number = 1): number {
    // Box-Muller transformation for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + stdDev * z0;
  }

  private getEmptyAnalysis(): PortfolioAnalysis {
    return {
      portfolio: {
        totalValue: 0,
        totalCost: 0,
        totalGainLoss: 0,
        totalGainLossPercent: 0,
        currency: 'BRL',
        lastUpdated: new Date(),
        investments: [],
      },
      diversificationMetrics: {
        herfindahlIndex: 0,
        effectiveNumberOfAssets: 0,
        diversificationRatio: 0,
        sectorConcentration: 0,
        geographicConcentration: 0,
        concentrationRisk: 'low',
        diversificationScore: 0,
      },
      riskMetrics: {
        var95: { value: 0, amount: 0, confidenceLevel: 95 },
        var99: { value: 0, amount: 0, confidenceLevel: 99 },
        cvar95: 0,
        cvar99: 0,
        volatility: 0,
        downsideDeviation: 0,
        maxDrawdown: 0,
        sortinoRatio: 0,
        beta: 0,
        riskScore: 0,
      },
      benchmarkComparison: {
        comparisons: [],
        bestPerformingBenchmark: 'None',
        relativePerformance: 0,
      },
      correlationMatrix: {
        correlations: [],
        averageCorrelation: 0,
      },
      lastUpdated: new Date(),
    };
  }
}