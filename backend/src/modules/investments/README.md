# Investments Module

## Overview

The Investments Module provides comprehensive investment management functionality for the financial platform, including multi-asset support, real-time price quotations, portfolio analysis, and performance calculations.

## Features

### Multi-Asset Support
- **Stocks**: Traditional equity investments
- **ETFs**: Exchange-traded funds
- **Funds**: Mutual funds and investment funds
- **Crypto**: Cryptocurrency investments
- **Bonds**: Fixed-income securities
- **Derivatives**: Options, futures, and other derivatives

### Quote Providers
- **Yahoo Finance**: Primary provider for stocks, ETFs, and funds
- **Alpha Vantage**: Secondary provider with API key support
- **CoinGecko**: Cryptocurrency price data

### Portfolio Management
- Real-time portfolio valuation
- Asset allocation analysis
- Performance metrics calculation
- Rebalancing recommendations
- Risk analysis (Sharpe ratio, volatility, max drawdown)

### Automatic Price Updates
- Scheduled updates every 2 hours during market hours (9 AM - 5 PM, Mon-Fri)
- Fallback mechanism across multiple quote providers
- Batch processing to respect API rate limits

## API Endpoints

### Investments
- `POST /investments` - Create new investment
- `GET /investments` - List all investments with filters
- `GET /investments/:id` - Get investment details
- `PATCH /investments/:id` - Update investment
- `DELETE /investments/:id` - Delete investment

### Portfolio
- `GET /investments/portfolio` - Get portfolio summary
- `GET /investments/allocation` - Get asset allocation breakdown
- `GET /investments/performance` - Get portfolio performance metrics
- `GET /investments/stats` - Get investment statistics

### Transactions
- `POST /investments/transactions` - Add investment transaction (buy/sell/dividend)

### Utilities
- `GET /investments/types` - Get supported investment types
- `POST /investments/rebalance` - Get rebalancing recommendations
- `POST /investments/quotes/update` - Manually update quotes

## Data Models

### Investment
```typescript
{
  id: string;
  userId: string;
  symbol: string;
  name: string;
  type: 'stock' | 'fund' | 'etf' | 'crypto' | 'bond' | 'derivative';
  quantity: number;
  averagePrice: number;
  currentPrice?: number;
  currency: string;
  broker?: string;
  sector?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Investment Transaction
```typescript
{
  id: string;
  investmentId: string;
  type: 'buy' | 'sell' | 'dividend';
  quantity: number;
  price: number;
  fees?: number;
  date: Date;
  createdAt: Date;
}
```

## Services

### InvestmentsService
Main service for investment CRUD operations and orchestration.

### QuotesService
Handles integration with multiple quote providers:
- Implements fallback mechanism
- Respects API rate limits
- Supports batch quote retrieval

### PortfolioService
Manages portfolio-level operations:
- Portfolio summary calculation
- Asset allocation analysis
- Rebalancing recommendations

### PerformanceService
Calculates investment performance metrics:
- Total return and annualized return
- Volatility and Sharpe ratio
- Maximum drawdown
- Win rate and best/worst days

## Configuration

### Environment Variables
```env
# Alpha Vantage API Key (optional)
ALPHA_VANTAGE_API_KEY=your_api_key_here

# Redis configuration for caching
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis123
```

### Quote Provider Configuration
The service automatically initializes available quote providers:
1. Yahoo Finance (always available)
2. Alpha Vantage (if API key is provided)
3. CoinGecko (always available for crypto)

## Testing

The module includes comprehensive tests:
- Unit tests for all services
- Controller tests
- Integration tests for quote providers

Run tests:
```bash
npm test -- --testPathPattern=investments
```

## Performance Considerations

### Caching
- Quote data is cached to reduce API calls
- Portfolio calculations are cached for performance

### Rate Limiting
- Batch processing for multiple quotes
- Delays between API calls to respect limits
- Fallback providers to ensure availability

### Scheduled Updates
- Automatic price updates during market hours
- Configurable via cron expressions
- Error handling and retry logic

## Error Handling

The module implements comprehensive error handling:
- API failures with fallback providers
- Invalid investment data validation
- Transaction consistency checks
- Graceful degradation when quotes are unavailable

## Future Enhancements

- Real-time WebSocket price feeds
- Advanced technical analysis indicators
- Options and derivatives pricing models
- Integration with more brokers and exchanges
- Machine learning for price prediction
- Advanced portfolio optimization algorithms