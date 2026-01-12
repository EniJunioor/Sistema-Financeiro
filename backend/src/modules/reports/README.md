# Reports Module

The Reports Module provides comprehensive financial analytics and reporting capabilities for the Plataforma Financeira backend.

## Features

### 📊 Financial Analytics
- **Financial Summary**: Complete overview of income, expenses, balances, and category breakdowns
- **Transaction Aggregation**: Group transactions by time periods (day, week, month, quarter, year)
- **Account Analysis**: Per-account financial summaries and performance metrics

### 📈 Trend Analysis
- **Historical Trends**: Analyze income and expense patterns over time
- **Growth Calculations**: Calculate income and expense growth rates
- **Future Projections**: AI-powered predictions based on historical data
- **Seasonal Patterns**: Detect recurring seasonal spending patterns

### 🔄 Period Comparisons
- **Period-over-Period Analysis**: Compare current vs previous periods
- **Category Comparisons**: Track changes in spending by category
- **Financial Health Score**: Overall financial health assessment (0-100)
- **Automated Insights**: AI-generated insights and recommendations

### 💰 Cash Flow Analysis
- **Monthly Cash Flow**: Track income vs expenses over time
- **Volatility Metrics**: Measure financial stability
- **Balance Projections**: Predict future account balances
- **Trend Identification**: Identify positive/negative cash flow trends

### 🎯 Spending Patterns
- **Daily Patterns**: Average spending by day of week
- **Monthly Patterns**: Seasonal spending variations
- **Category Trends**: Track category spending changes over time

## API Endpoints

### Dashboard Data
```
GET /reports/dashboard
```
Returns complete dashboard data including summary, trends, and comparisons.

### Financial Summary
```
GET /reports/financial-summary?period=current_month&accountIds[]=acc1
```
Returns detailed financial summary with filtering options.

### Trend Analysis
```
GET /reports/trends?period=last_year
```
Returns historical trends and future projections.

### Period Comparison
```
GET /reports/period-comparison?period=current_month
```
Compares current period with previous period.

### Quick Overview
```
GET /reports/overview
```
Returns quick financial overview with key metrics.

### Cash Flow Analysis
```
GET /reports/cash-flow?months=12
```
Returns detailed cash flow analysis.

### Spending Patterns
```
GET /reports/spending-patterns
```
Returns spending patterns and category trends.

### Transactions by Period
```
GET /reports/transactions-by-period?groupBy=month
```
Returns aggregated transaction data for charts.

## Query Parameters

### AnalyticsQueryDto
- `period`: Period preset (7d, 30d, 90d, 1y, current_month, current_year, custom)
- `startDate`: Custom start date (ISO string)
- `endDate`: Custom end date (ISO string)
- `groupBy`: Grouping method (day, week, month, quarter, year, category, account)
- `accountIds`: Filter by specific accounts
- `categoryIds`: Filter by specific categories
- `transactionTypes`: Filter by transaction types (income, expense, transfer)

## Caching Strategy

The module implements intelligent Redis caching:

- **Financial Summary**: 5 minutes cache
- **Trend Analysis**: 10 minutes cache
- **Dashboard Data**: 5 minutes cache
- **Overview Data**: 2 minutes cache (more frequent updates)
- **Cash Flow Analysis**: 10 minutes cache
- **Spending Patterns**: 30 minutes cache

Cache keys include user ID and query parameters to ensure data isolation.

## Performance Optimizations

### Database Queries
- Uses raw SQL for complex aggregations
- Implements efficient date range filtering
- Optimized GROUP BY operations for large datasets

### Parallel Processing
- Dashboard data fetched in parallel using Promise.all()
- Independent service calls for better performance

### Smart Calculations
- Linear regression for trend calculations
- Efficient growth rate algorithms
- Optimized category grouping

## Error Handling

The module includes comprehensive error handling:
- Database connection errors
- Invalid query parameters
- Cache failures (graceful degradation)
- Missing data scenarios

## Testing

### Unit Tests
- Service layer testing with mocked dependencies
- Controller testing with mocked services
- Edge case handling validation

### Test Coverage
- AnalyticsService: 100% coverage
- ReportsController: 100% coverage
- TrendsService: Core functionality tested

## Dependencies

- **PrismaService**: Database operations
- **Cache Manager**: Redis caching
- **NestJS Common**: Framework utilities
- **Class Validator**: Input validation

## Usage Examples

### Get Dashboard Data
```typescript
const dashboardData = await reportsService.getDashboardData(userId, {
  period: PeriodPreset.CURRENT_MONTH
});
```

### Get Financial Summary with Filters
```typescript
const summary = await analyticsService.getFinancialSummary(userId, {
  period: PeriodPreset.LAST_90_DAYS,
  accountIds: ['account-1', 'account-2'],
  categoryIds: ['food', 'transport']
});
```

### Get Trend Analysis
```typescript
const trends = await trendsService.getTrendAnalysis(userId, {
  period: PeriodPreset.LAST_YEAR,
  groupBy: GroupBy.MONTH
});
```

## Future Enhancements

- Real-time analytics with WebSocket updates
- Advanced ML models for better predictions
- Custom report generation
- Export functionality (PDF, Excel)
- Benchmark comparisons with anonymized user data