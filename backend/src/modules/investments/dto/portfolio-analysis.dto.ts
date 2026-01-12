import { IsEnum, IsOptional, IsObject, IsNumber, Min, Max, IsArray, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetPortfolioAnalysisDto {
  @ApiPropertyOptional({ description: 'Include detailed correlation matrix' })
  @IsOptional()
  includeCorrelations?: boolean;

  @ApiPropertyOptional({ description: 'Include benchmark comparisons' })
  @IsOptional()
  includeBenchmarks?: boolean;

  @ApiPropertyOptional({ description: 'Number of days for historical analysis' })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(1095) // Max 3 years
  @Type(() => Number)
  historicalDays?: number = 252;
}

export class RiskMetricsDto {
  @ApiPropertyOptional({ description: 'Confidence level for VaR calculation' })
  @IsOptional()
  @IsNumber()
  @Min(90)
  @Max(99)
  @Type(() => Number)
  confidenceLevel?: number = 95;

  @ApiPropertyOptional({ description: 'Risk-free rate for Sharpe/Sortino ratio' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(0.2)
  @Type(() => Number)
  riskFreeRate?: number = 0.05;
}

export class OptimizationConstraintsDto {
  @ApiPropertyOptional({ description: 'Minimum weight per asset (symbol -> percentage)' })
  @IsOptional()
  @IsObject()
  minWeight?: { [symbol: string]: number };

  @ApiPropertyOptional({ description: 'Maximum weight per asset (symbol -> percentage)' })
  @IsOptional()
  @IsObject()
  maxWeight?: { [symbol: string]: number };

  @ApiPropertyOptional({ description: 'Maximum weight per sector (sector -> percentage)' })
  @IsOptional()
  @IsObject()
  maxSectorWeight?: { [sector: string]: number };

  @ApiPropertyOptional({ description: 'Assets to exclude from optimization' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludeAssets?: string[];

  @ApiPropertyOptional({ description: 'Maximum portfolio risk (volatility)' })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(1)
  @Type(() => Number)
  riskBudget?: number;

  @ApiPropertyOptional({ description: 'Maximum turnover allowed (0-1)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  turnoverLimit?: number;
}

export class OptimalAllocationDto {
  @ApiProperty({ 
    description: 'Risk tolerance level',
    enum: ['conservative', 'moderate', 'aggressive']
  })
  @IsEnum(['conservative', 'moderate', 'aggressive'])
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';

  @ApiPropertyOptional({ description: 'Investment time horizon in years' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  timeHorizon?: number = 10;

  @ApiPropertyOptional({ description: 'Custom constraints for optimization' })
  @IsOptional()
  @IsObject()
  constraints?: OptimizationConstraintsDto;
}

export class RebalancingStrategyDto {
  @ApiProperty({ description: 'Target allocation by asset type (type -> percentage)' })
  @IsObject()
  targetAllocation: { [assetType: string]: number };

  @ApiPropertyOptional({ description: 'Minimum rebalancing threshold (percentage)' })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(10)
  @Type(() => Number)
  threshold?: number = 2;

  @ApiPropertyOptional({ description: 'Consider transaction costs in recommendations' })
  @IsOptional()
  considerCosts?: boolean = true;

  @ApiPropertyOptional({ description: 'Consider tax implications in recommendations' })
  @IsOptional()
  considerTaxes?: boolean = true;
}

export class BenchmarkComparisonDto {
  @ApiPropertyOptional({ description: 'Benchmark symbols to compare against' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benchmarks?: string[] = ['^BVSP', 'CDI', '^GSPC', '^IFIX'];

  @ApiPropertyOptional({ description: 'Number of days for comparison' })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(1095)
  @Type(() => Number)
  days?: number = 252;
}

export class MonteCarloSimulationDto {
  @ApiProperty({ description: 'Number of simulation scenarios' })
  @IsNumber()
  @Min(1000)
  @Max(10000)
  @Type(() => Number)
  scenarios: number = 5000;

  @ApiProperty({ description: 'Time horizon in years' })
  @IsNumber()
  @Min(1)
  @Max(30)
  @Type(() => Number)
  timeHorizon: number;

  @ApiPropertyOptional({ description: 'Initial portfolio value' })
  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Type(() => Number)
  initialValue?: number;

  @ApiPropertyOptional({ description: 'Annual contribution amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  annualContribution?: number = 0;
}

export class StressTestDto {
  @ApiPropertyOptional({ description: 'Custom stress test scenarios' })
  @IsOptional()
  @IsArray()
  customScenarios?: StressTestScenarioDto[];

  @ApiPropertyOptional({ description: 'Include standard stress test scenarios' })
  @IsOptional()
  includeStandardScenarios?: boolean = true;
}

export class StressTestScenarioDto {
  @ApiProperty({ description: 'Scenario name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Scenario description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Asset class shocks (assetClass -> percentage change)' })
  @IsObject()
  shocks: { [assetClass: string]: number };
}

export class CorrelationAnalysisDto {
  @ApiPropertyOptional({ description: 'Minimum correlation threshold to report' })
  @IsOptional()
  @IsNumber()
  @Min(-1)
  @Max(1)
  @Type(() => Number)
  minCorrelation?: number = 0.3;

  @ApiPropertyOptional({ description: 'Number of days for correlation calculation' })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(1095)
  @Type(() => Number)
  days?: number = 252;

  @ApiPropertyOptional({ description: 'Include rolling correlations' })
  @IsOptional()
  includeRolling?: boolean = false;

  @ApiPropertyOptional({ description: 'Rolling window size in days' })
  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(252)
  @Type(() => Number)
  rollingWindow?: number = 60;
}

export class DiversificationAnalysisDto {
  @ApiPropertyOptional({ description: 'Include sector diversification analysis' })
  @IsOptional()
  includeSector?: boolean = true;

  @ApiPropertyOptional({ description: 'Include geographic diversification analysis' })
  @IsOptional()
  includeGeographic?: boolean = true;

  @ApiPropertyOptional({ description: 'Include currency diversification analysis' })
  @IsOptional()
  includeCurrency?: boolean = true;

  @ApiPropertyOptional({ description: 'Minimum weight threshold for analysis' })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(0.1)
  @Type(() => Number)
  minWeight?: number = 0.01; // 1%
}