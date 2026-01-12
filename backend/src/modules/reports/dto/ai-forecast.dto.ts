import { ApiProperty } from '@nestjs/swagger';

export class ForecastDataPointDto {
  @ApiProperty({ description: 'Date for this forecast point' })
  date: Date;

  @ApiProperty({ description: 'Predicted amount' })
  predictedAmount: number;

  @ApiProperty({ description: 'Lower bound of confidence interval' })
  lowerBound: number;

  @ApiProperty({ description: 'Upper bound of confidence interval' })
  upperBound: number;

  @ApiProperty({ description: 'Confidence level (0-1)' })
  confidence: number;
}

export class SpendingPredictionDto extends ForecastDataPointDto {
  @ApiProperty({ 
    description: 'Factors influencing this prediction',
    type: [String],
    example: ['holiday-season', 'increasing-trend']
  })
  factors: string[];
}

export class IncomePredictionDto extends ForecastDataPointDto {
  @ApiProperty({ description: 'Predicted growth rate for this period' })
  growthRate: number;
}

export class CategoryForecastDto {
  @ApiProperty({ description: 'Category ID' })
  categoryId: string;

  @ApiProperty({ description: 'Category name' })
  categoryName: string;

  @ApiProperty({ description: 'Predicted spending amount for next month' })
  predictedAmount: number;

  @ApiProperty({ description: 'Historical average spending' })
  historicalAverage: number;

  @ApiProperty({ description: 'Spending volatility (0-1)' })
  volatility: number;

  @ApiProperty({ description: 'Prediction confidence (0-1)' })
  confidence: number;

  @ApiProperty({ 
    description: 'Spending trend direction',
    enum: ['increasing', 'decreasing', 'stable']
  })
  trend: 'increasing' | 'decreasing' | 'stable';

  @ApiProperty({ description: 'Recommended budget for this category' })
  recommendedBudget: number;
}

export class AnomalyDetectionDto {
  @ApiProperty({ description: 'Date when anomaly occurred' })
  date: Date;

  @ApiProperty({ description: 'Actual amount that was anomalous' })
  actualAmount: number;

  @ApiProperty({ description: 'Expected amount based on patterns' })
  expectedAmount: number;

  @ApiProperty({ description: 'Deviation from expected amount' })
  deviation: number;

  @ApiProperty({ 
    description: 'Severity of the anomaly',
    enum: ['low', 'medium', 'high']
  })
  severity: 'low' | 'medium' | 'high';

  @ApiProperty({ 
    description: 'Type of anomaly',
    enum: ['spike', 'drop']
  })
  type: 'spike' | 'drop';

  @ApiProperty({ description: 'Confidence in anomaly detection (0-1)' })
  confidence: number;
}

export class SeasonalAdjustmentDto {
  @ApiProperty({ description: 'Month number (1-12)' })
  month: number;

  @ApiProperty({ description: 'Month name' })
  monthName: string;

  @ApiProperty({ description: 'Seasonal factor (multiplier)' })
  seasonalFactor: number;

  @ApiProperty({ description: 'Adjustment amount' })
  adjustment: number;

  @ApiProperty({ description: 'Adjustment percentage' })
  adjustmentPercentage: number;

  @ApiProperty({ description: 'Confidence in seasonal pattern (0-1)' })
  confidence: number;
}

export class AIForecastDto {
  @ApiProperty({
    description: 'Spending predictions for future periods',
    type: [SpendingPredictionDto],
  })
  spendingPredictions: SpendingPredictionDto[];

  @ApiProperty({
    description: 'Income predictions for future periods',
    type: [IncomePredictionDto],
  })
  incomePredictions: IncomePredictionDto[];

  @ApiProperty({
    description: 'Category-wise spending forecasts',
    type: [CategoryForecastDto],
  })
  categoryForecasts: CategoryForecastDto[];

  @ApiProperty({
    description: 'Detected anomalies in historical data',
    type: [AnomalyDetectionDto],
  })
  anomalies: AnomalyDetectionDto[];

  @ApiProperty({
    description: 'Seasonal adjustment factors',
    type: [SeasonalAdjustmentDto],
  })
  seasonalAdjustments: SeasonalAdjustmentDto[];

  @ApiProperty({ description: 'Overall confidence score (0-1)' })
  confidenceScore: number;

  @ApiProperty({ description: 'Model accuracy score (0-1)' })
  modelAccuracy: number;

  @ApiProperty({
    description: 'AI-generated insights and recommendations',
    type: [String],
  })
  insights: string[];

  @ApiProperty({ description: 'Number of months forecasted' })
  forecastPeriodMonths: number;

  @ApiProperty({ description: 'When this forecast was generated' })
  generatedAt: Date;
}

export class AIForecastQueryDto {
  @ApiProperty({ 
    description: 'Number of months to forecast ahead',
    minimum: 1,
    maximum: 12,
    default: 6,
    required: false
  })
  forecastMonths?: number;

  @ApiProperty({ 
    description: 'Include anomaly detection',
    default: true,
    required: false
  })
  includeAnomalies?: boolean;

  @ApiProperty({ 
    description: 'Include seasonal adjustments',
    default: true,
    required: false
  })
  includeSeasonalAdjustments?: boolean;

  @ApiProperty({ 
    description: 'Include category forecasts',
    default: true,
    required: false
  })
  includeCategoryForecasts?: boolean;
}