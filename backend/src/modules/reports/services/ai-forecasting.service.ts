import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  AnalyticsQueryDto,
  AIForecastDto,
  ForecastDataPointDto,
  SpendingPredictionDto,
  IncomePredictionDto,
  CategoryForecastDto,
  AnomalyDetectionDto,
  SeasonalAdjustmentDto,
} from '../dto';

@Injectable()
export class AIForecastingService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async generateAIForecast(
    userId: string,
    query: AnalyticsQueryDto,
    forecastMonths: number = 6,
  ): Promise<AIForecastDto> {
    const cacheKey = `ai-forecast:${userId}:${JSON.stringify(query)}:${forecastMonths}`;
    
    const cached = await this.cacheManager.get<AIForecastDto>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get historical data for training
    const historicalData = await this.getHistoricalDataForTraining(userId, query);
    
    if (historicalData.length < 6) {
      throw new Error('Insufficient historical data for AI forecasting. Need at least 6 months of data.');
    }

    // Generate spending predictions using time series analysis
    const spendingPredictions = await this.generateSpendingPredictions(
      historicalData,
      forecastMonths,
    );

    // Generate income predictions
    const incomePredictions = await this.generateIncomePredictions(
      historicalData,
      forecastMonths,
    );

    // Generate category-wise forecasts
    const categoryForecasts = await this.generateCategoryForecasts(
      userId,
      query,
      forecastMonths,
    );

    // Detect anomalies in historical data
    const anomalies = await this.detectAnomalies(historicalData);

    // Apply seasonal adjustments
    const seasonalAdjustments = await this.calculateSeasonalAdjustments(userId);

    // Calculate confidence intervals
    const confidenceMetrics = this.calculateConfidenceMetrics(historicalData);

    // Generate insights and recommendations
    const insights = this.generateAIInsights(
      spendingPredictions,
      incomePredictions,
      categoryForecasts,
      anomalies,
    );

    const forecast: AIForecastDto = {
      spendingPredictions,
      incomePredictions,
      categoryForecasts,
      anomalies,
      seasonalAdjustments,
      confidenceScore: confidenceMetrics.overallConfidence,
      modelAccuracy: confidenceMetrics.accuracy,
      insights,
      forecastPeriodMonths: forecastMonths,
      generatedAt: new Date(),
    };

    // Cache for 30 minutes
    await this.cacheManager.set(cacheKey, forecast, 1800);

    return forecast;
  }

  async generateSpendingPredictions(
    historicalData: any[],
    forecastMonths: number,
  ): Promise<SpendingPredictionDto[]> {
    const expenseData = historicalData.map(d => ({
      date: d.date,
      amount: d.expenses,
    }));

    // Apply ARIMA-like time series forecasting
    const { trend, seasonal, residual } = this.decomposeTimeSeries(expenseData);
    
    const predictions: SpendingPredictionDto[] = [];
    const lastDate = new Date(expenseData[expenseData.length - 1].date);

    for (let i = 1; i <= forecastMonths; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setMonth(forecastDate.getMonth() + i);

      // Combine trend, seasonal, and noise components
      const trendValue = this.extrapolateTrend(trend, i);
      const seasonalValue = this.getSeasonalComponent(seasonal, forecastDate.getMonth());
      const noiseVariance = this.calculateNoiseVariance(residual);

      const predictedAmount = Math.max(0, trendValue + seasonalValue);
      
      // Calculate confidence intervals (95%)
      const standardError = Math.sqrt(noiseVariance * (1 + i * 0.1)); // Uncertainty increases with time
      const lowerBound = Math.max(0, predictedAmount - 1.96 * standardError);
      const upperBound = predictedAmount + 1.96 * standardError;

      // Confidence decreases with forecast distance
      const confidence = Math.max(0.3, 1 - (i * 0.08));

      predictions.push({
        date: forecastDate,
        predictedAmount,
        lowerBound,
        upperBound,
        confidence,
        factors: this.identifySpendingFactors(historicalData, forecastDate),
      });
    }

    return predictions;
  }

  async generateIncomePredictions(
    historicalData: any[],
    forecastMonths: number,
  ): Promise<IncomePredictionDto[]> {
    const incomeData = historicalData.map(d => ({
      date: d.date,
      amount: d.income,
    }));

    // Income is typically more stable than expenses
    const { trend, seasonal } = this.decomposeTimeSeries(incomeData);
    
    const predictions: IncomePredictionDto[] = [];
    const lastDate = new Date(incomeData[incomeData.length - 1].date);

    for (let i = 1; i <= forecastMonths; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setMonth(forecastDate.getMonth() + i);

      const trendValue = this.extrapolateTrend(trend, i);
      const seasonalValue = this.getSeasonalComponent(seasonal, forecastDate.getMonth());
      
      const predictedAmount = Math.max(0, trendValue + seasonalValue);
      
      // Income predictions are generally more stable
      const variance = this.calculateVariance(incomeData.map(d => d.amount));
      const standardError = Math.sqrt(variance * (1 + i * 0.05));
      const lowerBound = Math.max(0, predictedAmount - 1.96 * standardError);
      const upperBound = predictedAmount + 1.96 * standardError;

      const confidence = Math.max(0.4, 1 - (i * 0.06));

      predictions.push({
        date: forecastDate,
        predictedAmount,
        lowerBound,
        upperBound,
        confidence,
        growthRate: this.calculateGrowthRate(incomeData.slice(-6).map(d => d.amount)),
      });
    }

    return predictions;
  }

  async generateCategoryForecasts(
    userId: string,
    query: AnalyticsQueryDto,
    forecastMonths: number,
  ): Promise<CategoryForecastDto[]> {
    // Get category-wise historical data
    const categoryData = await this.getCategoryHistoricalData(userId, query);
    
    const forecasts: CategoryForecastDto[] = [];

    for (const [categoryId, data] of categoryData.entries()) {
      if (data.length < 3) continue; // Skip categories with insufficient data

      const { trend } = this.decomposeTimeSeries(data);
      const avgAmount = data.reduce((sum, d) => sum + d.amount, 0) / data.length;
      const volatility = this.calculateVolatility(data.map(d => d.amount));

      // Predict next month's spending for this category
      const nextMonthPrediction = Math.max(0, this.extrapolateTrend(trend, 1));
      const confidence = Math.max(0.2, 1 - volatility);

      // Get category info
      const category = await this.prisma.category.findUnique({
        where: { id: categoryId },
      });

      forecasts.push({
        categoryId,
        categoryName: category?.name || 'Unknown',
        predictedAmount: nextMonthPrediction,
        historicalAverage: avgAmount,
        volatility,
        confidence,
        trend: this.categorizeTrend(trend),
        recommendedBudget: this.calculateRecommendedBudget(data, nextMonthPrediction),
      });
    }

    return forecasts.sort((a, b) => b.predictedAmount - a.predictedAmount);
  }

  async detectAnomalies(historicalData: any[]): Promise<AnomalyDetectionDto[]> {
    const anomalies: AnomalyDetectionDto[] = [];
    
    // Calculate statistical thresholds for anomaly detection
    const expenses = historicalData.map(d => d.expenses);
    const mean = expenses.reduce((sum, val) => sum + val, 0) / expenses.length;
    const stdDev = Math.sqrt(
      expenses.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / expenses.length
    );

    // Z-score threshold for anomalies (2.5 standard deviations)
    const threshold = 2.5;

    historicalData.forEach((dataPoint, index) => {
      const zScore = Math.abs((dataPoint.expenses - mean) / stdDev);
      
      if (zScore > threshold) {
        anomalies.push({
          date: dataPoint.date,
          actualAmount: dataPoint.expenses,
          expectedAmount: mean,
          deviation: dataPoint.expenses - mean,
          severity: zScore > 3 ? 'high' : 'medium',
          type: dataPoint.expenses > mean ? 'spike' : 'drop',
          confidence: Math.min(0.95, zScore / 4), // Normalize confidence
        });
      }
    });

    return anomalies.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async calculateSeasonalAdjustments(userId: string): Promise<SeasonalAdjustmentDto[]> {
    // Get 2 years of data for seasonal analysis
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const seasonalData = await this.prisma.$queryRaw`
      SELECT 
        CAST(strftime('%m', date) as INTEGER) as month,
        AVG(CASE WHEN type = 'expense' THEN CAST(amount as REAL) ELSE 0 END) as avg_expenses,
        STDDEV(CASE WHEN type = 'expense' THEN CAST(amount as REAL) ELSE 0 END) as std_expenses,
        COUNT(*) as transaction_count
      FROM transactions 
      WHERE userId = ${userId}
        AND date >= ${twoYearsAgo.toISOString()}
        AND type = 'expense'
      GROUP BY month
      ORDER BY month ASC
    ` as any[];

    const overallAverage = seasonalData.reduce((sum, row) => sum + (Number(row.avg_expenses) || 0), 0) / 12;

    return seasonalData.map((row: any) => {
      const monthlyAverage = Number(row.avg_expenses) || 0;
      const adjustment = monthlyAverage - overallAverage;
      const adjustmentPercentage = overallAverage > 0 ? (adjustment / overallAverage) * 100 : 0;

      return {
        month: Number(row.month),
        monthName: this.getMonthName(Number(row.month)),
        seasonalFactor: monthlyAverage / overallAverage,
        adjustment,
        adjustmentPercentage,
        confidence: Math.min(0.9, (Number(row.transaction_count) || 0) / 50), // More transactions = higher confidence
      };
    });
  }

  private async getHistoricalDataForTraining(
    userId: string,
    query: AnalyticsQueryDto,
  ): Promise<any[]> {
    // Get 24 months of historical data for training
    const twentyFourMonthsAgo = new Date();
    twentyFourMonthsAgo.setFullYear(twentyFourMonthsAgo.getFullYear() - 2);

    // Build dynamic WHERE clauses
    const conditions: Prisma.Sql[] = [
      Prisma.sql`userId = ${userId}`,
      Prisma.sql`date >= ${twentyFourMonthsAgo.toISOString()}`,
    ];

    if (query.accountIds && query.accountIds.length > 0) {
      const accountIds = query.accountIds.map(id => Prisma.sql`${id}`);
      conditions.push(
        Prisma.sql`accountId IN (${Prisma.join(accountIds)})`
      );
    }

    if (query.categoryIds && query.categoryIds.length > 0) {
      const categoryIds = query.categoryIds.map(id => Prisma.sql`${id}`);
      conditions.push(
        Prisma.sql`categoryId IN (${Prisma.join(categoryIds)})`
      );
    }

    // Build WHERE clause
    let whereClause = conditions[0];
    for (let i = 1; i < conditions.length; i++) {
      whereClause = Prisma.sql`${whereClause} AND ${conditions[i]}`;
    }

    const result = await this.prisma.$queryRaw`
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(CASE WHEN type = 'income' THEN CAST(amount as REAL) ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN CAST(amount as REAL) ELSE 0 END) as expenses,
        COUNT(*) as transaction_count
      FROM transactions 
      WHERE ${whereClause}
      GROUP BY month
      ORDER BY month ASC
    ` as any[];

    return result.map((row: any) => ({
      date: new Date(row.month + '-01'),
      income: Number(row.income) || 0,
      expenses: Number(row.expenses) || 0,
      transactionCount: Number(row.transaction_count) || 0,
    }));
  }

  private async getCategoryHistoricalData(
    userId: string,
    query: AnalyticsQueryDto,
  ): Promise<Map<string, any[]>> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const result = await this.prisma.$queryRaw`
      SELECT 
        categoryId,
        strftime('%Y-%m', date) as month,
        SUM(CAST(amount as REAL)) as amount
      FROM transactions 
      WHERE userId = ${userId}
        AND date >= ${sixMonthsAgo.toISOString()}
        AND type = 'expense'
        AND categoryId IS NOT NULL
        ${query.accountIds ? `AND accountId IN (${query.accountIds.map(id => `'${id}'`).join(',')})` : ''}
      GROUP BY categoryId, month
      ORDER BY categoryId, month ASC
    ` as any[];

    const categoryMap = new Map<string, any[]>();

    result.forEach((row: any) => {
      const categoryId = row.categoryId;
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, []);
      }
      
      categoryMap.get(categoryId)!.push({
        date: new Date(row.month + '-01'),
        amount: Number(row.amount) || 0,
      });
    });

    return categoryMap;
  }

  private decomposeTimeSeries(data: any[]): {
    trend: number[];
    seasonal: number[];
    residual: number[];
  } {
    const values = data.map(d => d.amount);
    const n = values.length;

    // Simple trend calculation using linear regression
    const trend = this.calculateLinearTrend(values);

    // Calculate seasonal component (12-month cycle)
    const seasonal = this.calculateSeasonalComponent(values, 12);

    // Residual = Original - Trend - Seasonal
    const residual = values.map((val, i) => val - trend[i] - seasonal[i]);

    return { trend, seasonal, residual };
  }

  private calculateLinearTrend(values: number[]): number[] {
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + index * val, 0);
    const sumX2 = values.reduce((sum, _, index) => sum + index * index, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return values.map((_, index) => intercept + slope * index);
  }

  private calculateSeasonalComponent(values: number[], period: number): number[] {
    const seasonal = new Array(values.length).fill(0);
    
    // Calculate average for each position in the cycle
    const cycleAverages = new Array(period).fill(0);
    const cycleCounts = new Array(period).fill(0);

    values.forEach((value, index) => {
      const cyclePosition = index % period;
      cycleAverages[cyclePosition] += value;
      cycleCounts[cyclePosition]++;
    });

    // Normalize averages
    for (let i = 0; i < period; i++) {
      if (cycleCounts[i] > 0) {
        cycleAverages[i] /= cycleCounts[i];
      }
    }

    // Apply seasonal component
    values.forEach((_, index) => {
      seasonal[index] = cycleAverages[index % period];
    });

    return seasonal;
  }

  private extrapolateTrend(trend: number[], steps: number): number {
    if (trend.length < 2) return trend[0] || 0;

    // Calculate trend slope from last few points
    const recentTrend = trend.slice(-Math.min(6, trend.length));
    const slope = this.calculateGrowthRate(recentTrend);
    const lastValue = trend[trend.length - 1];

    return lastValue + slope * steps;
  }

  private getSeasonalComponent(seasonal: number[], month: number): number {
    // Get seasonal component for specific month (0-11)
    const seasonalIndex = month % seasonal.length;
    return seasonal[seasonalIndex] || 0;
  }

  private calculateNoiseVariance(residual: number[]): number {
    const mean = residual.reduce((sum, val) => sum + val, 0) / residual.length;
    return residual.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / residual.length;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < values.length; i++) {
      if (values[i - 1] > 0) {
        returns.push((values[i] - values[i - 1]) / values[i - 1]);
      }
    }

    const mean = returns.reduce((sum, val) => sum + val, 0) / returns.length;
    const variance = returns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  private calculateGrowthRate(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + index * val, 0);
    const sumX2 = values.reduce((sum, _, index) => sum + index * index, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avgY = sumY / n;

    return avgY > 0 ? slope / avgY : 0;
  }

  private identifySpendingFactors(historicalData: any[], forecastDate: Date): string[] {
    const factors: string[] = [];
    const month = forecastDate.getMonth();

    // Seasonal factors
    if ([11, 0, 1].includes(month)) {
      factors.push('holiday-season');
    }
    if ([5, 6, 7].includes(month)) {
      factors.push('summer-vacation');
    }
    if ([2, 8].includes(month)) {
      factors.push('back-to-school');
    }

    // Trend factors
    const recentData = historicalData.slice(-3);
    const avgRecent = recentData.reduce((sum, d) => sum + d.expenses, 0) / recentData.length;
    const overallAvg = historicalData.reduce((sum, d) => sum + d.expenses, 0) / historicalData.length;

    if (avgRecent > overallAvg * 1.1) {
      factors.push('increasing-trend');
    } else if (avgRecent < overallAvg * 0.9) {
      factors.push('decreasing-trend');
    }

    return factors;
  }

  private categorizeTrend(trend: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (trend.length < 2) return 'stable';

    const slope = this.calculateGrowthRate(trend);
    
    if (slope > 0.05) return 'increasing';
    if (slope < -0.05) return 'decreasing';
    return 'stable';
  }

  private calculateRecommendedBudget(data: any[], prediction: number): number {
    const historicalAvg = data.reduce((sum, d) => sum + d.amount, 0) / data.length;
    const volatility = this.calculateVolatility(data.map(d => d.amount));
    
    // Recommend budget with buffer for volatility
    return Math.round(Math.max(prediction, historicalAvg) * (1 + volatility * 0.5));
  }

  private calculateConfidenceMetrics(historicalData: any[]): {
    overallConfidence: number;
    accuracy: number;
  } {
    // Base confidence on data quality and quantity
    const dataPoints = historicalData.length;
    const dataQuality = Math.min(1, dataPoints / 24); // 24 months is ideal

    // Calculate accuracy based on variance in historical data
    const expenses = historicalData.map(d => d.expenses);
    const variance = this.calculateVariance(expenses);
    const mean = expenses.reduce((sum, val) => sum + val, 0) / expenses.length;
    const coefficientOfVariation = mean > 0 ? Math.sqrt(variance) / mean : 1;

    const accuracy = Math.max(0.3, 1 - coefficientOfVariation);
    const overallConfidence = (dataQuality + accuracy) / 2;

    return {
      overallConfidence: Math.round(overallConfidence * 100) / 100,
      accuracy: Math.round(accuracy * 100) / 100,
    };
  }

  private generateAIInsights(
    spendingPredictions: SpendingPredictionDto[],
    incomePredictions: IncomePredictionDto[],
    categoryForecasts: CategoryForecastDto[],
    anomalies: AnomalyDetectionDto[],
  ): string[] {
    const insights: string[] = [];

    // Spending trend insights
    const nextMonthSpending = spendingPredictions[0];
    if (nextMonthSpending) {
      if (nextMonthSpending.confidence > 0.7) {
        insights.push(
          `AI predicts your spending next month will be $${nextMonthSpending.predictedAmount.toFixed(2)} ` +
          `(${(nextMonthSpending.confidence * 100).toFixed(0)}% confidence)`
        );
      }

      const spendingTrend = this.calculateTrendDirection(spendingPredictions.map(p => p.predictedAmount));
      if (spendingTrend === 'increasing') {
        insights.push('Your spending is predicted to increase over the next few months. Consider reviewing your budget.');
      } else if (spendingTrend === 'decreasing') {
        insights.push('Great news! Your spending is predicted to decrease, improving your savings potential.');
      }
    }

    // Income insights
    const nextMonthIncome = incomePredictions[0];
    if (nextMonthIncome && nextMonthIncome.confidence > 0.6) {
      if (nextMonthIncome.growthRate > 0.05) {
        insights.push(`Your income is projected to grow by ${(nextMonthIncome.growthRate * 100).toFixed(1)}% next month.`);
      }
    }

    // Category insights
    const topSpendingCategory = categoryForecasts[0];
    if (topSpendingCategory && topSpendingCategory.confidence > 0.5) {
      insights.push(
        `${topSpendingCategory.categoryName} is predicted to be your largest expense category ` +
        `($${topSpendingCategory.predictedAmount.toFixed(2)})`
      );
    }

    // Anomaly insights
    const recentAnomalies = anomalies.filter(a => 
      new Date(a.date).getTime() > Date.now() - 90 * 24 * 60 * 60 * 1000 // Last 90 days
    );
    
    if (recentAnomalies.length > 0) {
      const highSeverityAnomalies = recentAnomalies.filter(a => a.severity === 'high');
      if (highSeverityAnomalies.length > 0) {
        insights.push(`Detected ${highSeverityAnomalies.length} unusual spending spike(s) in the last 3 months.`);
      }
    }

    // Budget recommendations
    const totalPredictedSpending = spendingPredictions.reduce((sum, p) => sum + p.predictedAmount, 0);
    const totalPredictedIncome = incomePredictions.reduce((sum, p) => sum + p.predictedAmount, 0);
    
    if (totalPredictedIncome > 0) {
      const savingsRate = (totalPredictedIncome - totalPredictedSpending) / totalPredictedIncome;
      if (savingsRate < 0.1) {
        insights.push('Consider increasing your savings rate. Aim for at least 10% of your income.');
      } else if (savingsRate > 0.2) {
        insights.push('Excellent! You\'re on track to save over 20% of your income.');
      }
    }

    return insights;
  }

  private calculateTrendDirection(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';

    const slope = this.calculateGrowthRate(values);
    
    if (slope > 0.05) return 'increasing';
    if (slope < -0.05) return 'decreasing';
    return 'stable';
  }

  private getMonthName(month: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || 'Unknown';
  }
}