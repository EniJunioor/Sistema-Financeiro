import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PortfolioAnalysisService } from '../services/portfolio-analysis.service';
import {
  GetPortfolioAnalysisDto,
  RiskMetricsDto,
  OptimalAllocationDto,
  RebalancingStrategyDto,
  BenchmarkComparisonDto,
  MonteCarloSimulationDto,
  StressTestDto,
  CorrelationAnalysisDto,
  DiversificationAnalysisDto,
} from '../dto/portfolio-analysis.dto';

@ApiTags('Portfolio Analysis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('investments/analysis')
export class PortfolioAnalysisController {
  constructor(
    private readonly portfolioAnalysisService: PortfolioAnalysisService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get comprehensive portfolio analysis' })
  @ApiResponse({
    status: 200,
    description: 'Portfolio analysis retrieved successfully',
  })
  async getPortfolioAnalysis(
    @CurrentUser('id') userId: string,
    @Query() query: GetPortfolioAnalysisDto,
  ) {
    return this.portfolioAnalysisService.getPortfolioAnalysis(userId);
  }

  @Get('diversification')
  @ApiOperation({ summary: 'Get portfolio diversification metrics' })
  @ApiResponse({
    status: 200,
    description: 'Diversification metrics retrieved successfully',
  })
  async getDiversificationMetrics(
    @CurrentUser('id') userId: string,
    @Query() query: DiversificationAnalysisDto,
  ) {
    return this.portfolioAnalysisService.calculateDiversificationMetrics(userId);
  }

  @Get('risk')
  @ApiOperation({ summary: 'Get portfolio risk metrics including VaR' })
  @ApiResponse({
    status: 200,
    description: 'Risk metrics retrieved successfully',
  })
  async getRiskMetrics(
    @CurrentUser('id') userId: string,
    @Query() query: RiskMetricsDto,
  ) {
    return this.portfolioAnalysisService.calculateRiskMetrics(userId);
  }

  @Get('benchmarks')
  @ApiOperation({ summary: 'Compare portfolio performance against benchmarks' })
  @ApiResponse({
    status: 200,
    description: 'Benchmark comparison retrieved successfully',
  })
  async getBenchmarkComparison(
    @CurrentUser('id') userId: string,
    @Query() query: BenchmarkComparisonDto,
  ) {
    return this.portfolioAnalysisService.calculateBenchmarkComparison(userId);
  }

  @Get('correlations')
  @ApiOperation({ summary: 'Get asset correlation matrix' })
  @ApiResponse({
    status: 200,
    description: 'Correlation matrix retrieved successfully',
  })
  async getCorrelationMatrix(
    @CurrentUser('id') userId: string,
    @Query() query: CorrelationAnalysisDto,
  ) {
    return this.portfolioAnalysisService.calculateCorrelationMatrix(userId);
  }

  @Post('optimal-allocation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get optimal portfolio allocation suggestions' })
  @ApiResponse({
    status: 200,
    description: 'Optimal allocation calculated successfully',
  })
  async getOptimalAllocation(
    @CurrentUser('id') userId: string,
    @Body() dto: OptimalAllocationDto,
  ) {
    return this.portfolioAnalysisService.suggestOptimalAllocation(
      userId,
      dto.riskTolerance,
    );
  }

  @Post('rebalancing-strategy')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get detailed rebalancing strategy' })
  @ApiResponse({
    status: 200,
    description: 'Rebalancing strategy calculated successfully',
  })
  async getRebalancingStrategy(
    @CurrentUser('id') userId: string,
    @Body() dto: RebalancingStrategyDto,
  ) {
    return this.portfolioAnalysisService.getRebalancingStrategy(
      userId,
      dto.targetAllocation,
    );
  }

  @Post('monte-carlo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run Monte Carlo simulation for portfolio projections' })
  @ApiResponse({
    status: 200,
    description: 'Monte Carlo simulation completed successfully',
  })
  async runMonteCarloSimulation(
    @CurrentUser('id') userId: string,
    @Body() dto: MonteCarloSimulationDto,
  ) {
    return this.runMonteCarloAnalysis(userId, dto);
  }

  @Post('stress-test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run stress tests on portfolio' })
  @ApiResponse({
    status: 200,
    description: 'Stress test completed successfully',
  })
  async runStressTest(
    @CurrentUser('id') userId: string,
    @Body() dto: StressTestDto,
  ) {
    return this.runPortfolioStressTest(userId, dto);
  }

  @Get('risk-profile')
  @ApiOperation({ summary: 'Get recommended risk profile based on portfolio' })
  @ApiResponse({
    status: 200,
    description: 'Risk profile analysis completed successfully',
  })
  async getRiskProfile(@CurrentUser('id') userId: string) {
    return this.analyzeRiskProfile(userId);
  }

  @Get('efficiency-frontier')
  @ApiOperation({ summary: 'Calculate efficient frontier for portfolio optimization' })
  @ApiResponse({
    status: 200,
    description: 'Efficient frontier calculated successfully',
  })
  async getEfficientFrontier(@CurrentUser('id') userId: string) {
    return this.calculateEfficientFrontier(userId);
  }

  @Get('advanced-risk-metrics')
  @ApiOperation({ summary: 'Get advanced risk metrics including Sharpe, Treynor, and Calmar ratios' })
  @ApiResponse({
    status: 200,
    description: 'Advanced risk metrics calculated successfully',
  })
  async getAdvancedRiskMetrics(@CurrentUser('id') userId: string) {
    return this.portfolioAnalysisService.getAdvancedRiskMetrics(userId);
  }

  @Get('efficiency-metrics')
  @ApiOperation({ summary: 'Get portfolio efficiency metrics and improvement suggestions' })
  @ApiResponse({
    status: 200,
    description: 'Portfolio efficiency metrics calculated successfully',
  })
  async getPortfolioEfficiencyMetrics(@CurrentUser('id') userId: string) {
    return this.portfolioAnalysisService.getPortfolioEfficiencyMetrics(userId);
  }

  // Private helper methods for complex calculations

  private async runMonteCarloAnalysis(userId: string, dto: MonteCarloSimulationDto) {
    // Simplified Monte Carlo implementation
    const portfolio = await this.portfolioAnalysisService.getPortfolioAnalysis(userId);
    const scenarios = [];
    
    const annualReturn = 0.08; // 8% expected return
    const annualVolatility = 0.15; // 15% volatility
    const initialValue = dto.initialValue || portfolio.portfolio.totalValue;
    
    for (let i = 0; i < dto.scenarios; i++) {
      let value = initialValue;
      
      for (let year = 0; year < dto.timeHorizon; year++) {
        // Generate random return using normal distribution approximation
        const randomReturn = this.generateNormalRandom(annualReturn, annualVolatility);
        value *= (1 + randomReturn);
        value += dto.annualContribution || 0;
      }
      
      scenarios.push(value);
    }
    
    scenarios.sort((a, b) => a - b);
    
    const percentiles = {
      p5: scenarios[Math.floor(dto.scenarios * 0.05)],
      p25: scenarios[Math.floor(dto.scenarios * 0.25)],
      p50: scenarios[Math.floor(dto.scenarios * 0.50)],
      p75: scenarios[Math.floor(dto.scenarios * 0.75)],
      p95: scenarios[Math.floor(dto.scenarios * 0.95)],
    };
    
    const expectedValue = scenarios.reduce((sum, val) => sum + val, 0) / scenarios.length;
    const variance = scenarios.reduce((sum, val) => sum + Math.pow(val - expectedValue, 2), 0) / scenarios.length;
    const standardDeviation = Math.sqrt(variance);
    const probabilityOfLoss = scenarios.filter(val => val < initialValue).length / scenarios.length;
    
    return {
      scenarios: dto.scenarios,
      timeHorizon: dto.timeHorizon,
      percentiles,
      expectedValue,
      standardDeviation,
      probabilityOfLoss,
      initialValue,
      annualContribution: dto.annualContribution || 0,
    };
  }

  private async runPortfolioStressTest(userId: string, dto: StressTestDto) {
    const portfolio = await this.portfolioAnalysisService.getPortfolioAnalysis(userId);
    const scenarios = [];
    
    // Standard stress test scenarios
    if (dto.includeStandardScenarios) {
      const standardScenarios = [
        {
          name: 'Market Crash 2008',
          description: 'Global financial crisis scenario',
          shocks: { stock: -0.37, bond: 0.05, real_estate: -0.25, crypto: -0.50 },
        },
        {
          name: 'COVID-19 Pandemic',
          description: 'Pandemic-induced market volatility',
          shocks: { stock: -0.20, bond: 0.08, real_estate: -0.10, crypto: -0.30 },
        },
        {
          name: 'Interest Rate Spike',
          description: 'Rapid interest rate increases',
          shocks: { stock: -0.15, bond: -0.20, real_estate: -0.15, crypto: -0.25 },
        },
        {
          name: 'Inflation Surge',
          description: 'High inflation environment',
          shocks: { stock: -0.10, bond: -0.15, real_estate: 0.05, crypto: 0.10 },
        },
      ];
      
      scenarios.push(...standardScenarios);
    }
    
    // Add custom scenarios
    if (dto.customScenarios) {
      scenarios.push(...dto.customScenarios);
    }
    
    const results = scenarios.map(scenario => {
      let portfolioImpact = 0;
      
      // Calculate impact based on portfolio allocation
      portfolio.portfolio.investments.forEach(investment => {
        const shock = scenario.shocks[investment.type] || 0;
        const weight = investment.weight / 100;
        portfolioImpact += weight * shock;
      });
      
      return {
        ...scenario,
        portfolioImpact: portfolioImpact * 100, // Convert to percentage
        recoveryTime: Math.abs(portfolioImpact) * 12, // Simplified recovery time in months
      };
    });
    
    const worstCaseScenario = results.reduce((worst, current) => 
      current.portfolioImpact < worst.portfolioImpact ? current : worst
    );
    
    const averageImpact = results.reduce((sum, result) => sum + result.portfolioImpact, 0) / results.length;
    
    let resilience: 'low' | 'medium' | 'high' = 'medium';
    if (Math.abs(averageImpact) < 10) resilience = 'high';
    else if (Math.abs(averageImpact) > 25) resilience = 'low';
    
    return {
      scenarios: results,
      worstCaseScenario: worstCaseScenario.name,
      averageImpact,
      resilience,
    };
  }

  private async analyzeRiskProfile(userId: string) {
    const analysis = await this.portfolioAnalysisService.getPortfolioAnalysis(userId);
    const riskMetrics = analysis.riskMetrics;
    
    let recommendedProfile: 'conservative' | 'moderate' | 'aggressive' = 'moderate';
    
    // Determine risk profile based on current portfolio metrics
    if (riskMetrics.volatility < 10 && riskMetrics.maxDrawdown < 15) {
      recommendedProfile = 'conservative';
    } else if (riskMetrics.volatility > 20 || riskMetrics.maxDrawdown > 30) {
      recommendedProfile = 'aggressive';
    }
    
    const profiles = {
      conservative: {
        name: 'conservative' as const,
        description: 'Low risk, stable returns, capital preservation focused',
        expectedReturn: 6,
        expectedVolatility: 8,
        maxDrawdown: 10,
        timeHorizon: 3,
        targetAllocations: [
          { assetClass: 'bond', percentage: 60 },
          { assetClass: 'stock', percentage: 30 },
          { assetClass: 'real_estate', percentage: 10 },
        ],
      },
      moderate: {
        name: 'moderate' as const,
        description: 'Balanced risk and return, moderate growth focused',
        expectedReturn: 8,
        expectedVolatility: 12,
        maxDrawdown: 20,
        timeHorizon: 7,
        targetAllocations: [
          { assetClass: 'stock', percentage: 50 },
          { assetClass: 'bond', percentage: 35 },
          { assetClass: 'real_estate', percentage: 10 },
          { assetClass: 'crypto', percentage: 5 },
        ],
      },
      aggressive: {
        name: 'aggressive' as const,
        description: 'High risk, high return potential, growth focused',
        expectedReturn: 12,
        expectedVolatility: 18,
        maxDrawdown: 35,
        timeHorizon: 10,
        targetAllocations: [
          { assetClass: 'stock', percentage: 70 },
          { assetClass: 'bond', percentage: 15 },
          { assetClass: 'real_estate', percentage: 10 },
          { assetClass: 'crypto', percentage: 5 },
        ],
      },
    };
    
    return {
      currentProfile: this.determineCurrentProfile(riskMetrics),
      recommendedProfile,
      profiles,
      riskMetrics,
    };
  }

  private async calculateEfficientFrontier(userId: string) {
    // Simplified efficient frontier calculation
    const portfolio = await this.portfolioAnalysisService.getPortfolioAnalysis(userId);
    const points = [];
    
    // Generate points along the efficient frontier
    for (let targetReturn = 0.04; targetReturn <= 0.16; targetReturn += 0.01) {
      const risk = this.calculateRiskForReturn(targetReturn);
      const sharpeRatio = (targetReturn - 0.05) / risk; // Assuming 5% risk-free rate
      
      points.push({
        expectedReturn: targetReturn * 100,
        expectedRisk: risk * 100,
        sharpeRatio,
      });
    }
    
    // Find optimal portfolio (maximum Sharpe ratio)
    const optimalPoint = points.reduce((best, current) => 
      current.sharpeRatio > best.sharpeRatio ? current : best
    );
    
    return {
      efficientFrontier: points,
      optimalPortfolio: optimalPoint,
      currentPortfolio: {
        expectedReturn: 8, // Simplified
        expectedRisk: portfolio.riskMetrics.volatility,
        sharpeRatio: (8 - 5) / portfolio.riskMetrics.volatility,
      },
    };
  }

  // Helper methods

  private generateNormalRandom(mean: number, stdDev: number): number {
    // Box-Muller transformation for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + stdDev * z0;
  }

  private determineCurrentProfile(riskMetrics: any): 'conservative' | 'moderate' | 'aggressive' {
    if (riskMetrics.volatility < 10 && riskMetrics.maxDrawdown < 15) {
      return 'conservative';
    } else if (riskMetrics.volatility > 20 || riskMetrics.maxDrawdown > 30) {
      return 'aggressive';
    }
    return 'moderate';
  }

  private calculateRiskForReturn(targetReturn: number): number {
    // Simplified risk calculation based on target return
    // In practice, this would use portfolio optimization algorithms
    return Math.sqrt(targetReturn * 0.5); // Simplified relationship
  }
}