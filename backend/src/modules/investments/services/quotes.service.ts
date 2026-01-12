import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';
import { QuoteProvider, QuoteData } from '../interfaces/investment.interface';
import { InvestmentType } from '../dto/create-investment.dto';

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);
  private providers: QuoteProvider[] = [];

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize Yahoo Finance provider
    this.providers.push(new YahooFinanceProvider(this.httpService));
    
    // Initialize Alpha Vantage provider if API key is available
    const alphaVantageKey = this.configService.get('ALPHA_VANTAGE_API_KEY');
    if (alphaVantageKey) {
      this.providers.push(new AlphaVantageProvider(this.httpService, alphaVantageKey));
    }

    // Initialize CoinGecko provider for crypto
    this.providers.push(new CoinGeckoProvider(this.httpService));
  }

  async getQuote(symbol: string, type: InvestmentType): Promise<QuoteData | null> {
    for (const provider of this.providers) {
      if (provider.isSupported(symbol, type)) {
        try {
          const quote = await provider.getQuote(symbol, type);
          if (quote) {
            this.logger.log(`Quote retrieved for ${symbol} from ${provider.name}`);
            return quote;
          }
        } catch (error) {
          this.logger.warn(`Failed to get quote for ${symbol} from ${provider.name}: ${error.message}`);
        }
      }
    }

    this.logger.error(`No quote available for ${symbol} (${type})`);
    return null;
  }

  async getMultipleQuotes(symbols: { symbol: string; type: InvestmentType }[]): Promise<Map<string, QuoteData>> {
    const quotes = new Map<string, QuoteData>();
    
    // Process quotes in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const batchPromises = batch.map(async ({ symbol, type }) => {
        const quote = await this.getQuote(symbol, type);
        if (quote) {
          quotes.set(symbol, quote);
        }
      });

      await Promise.all(batchPromises);
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return quotes;
  }
}

// Yahoo Finance Provider
class YahooFinanceProvider implements QuoteProvider {
  name = 'Yahoo Finance';

  constructor(private httpService: HttpService) {}

  isSupported(symbol: string, type: string): boolean {
    // Yahoo Finance supports most stock types but not all crypto
    return ['stock', 'fund', 'etf', 'bond'].includes(type);
  }

  async getQuote(symbol: string, type: string): Promise<QuoteData | null> {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
      const response = await firstValueFrom(this.httpService.get(url));
      
      const data = response.data?.chart?.result?.[0];
      if (!data) return null;

      const meta = data.meta;
      const currentPrice = meta.regularMarketPrice || meta.previousClose;
      
      if (!currentPrice) return null;

      return {
        symbol,
        price: currentPrice,
        currency: meta.currency || 'USD',
        timestamp: new Date(),
        change: meta.regularMarketPrice - meta.previousClose,
        changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
        volume: meta.regularMarketVolume,
        provider: this.name,
      };
    } catch (error) {
      throw new Error(`Yahoo Finance API error: ${error.message}`);
    }
  }
}

// Alpha Vantage Provider
class AlphaVantageProvider implements QuoteProvider {
  name = 'Alpha Vantage';

  constructor(
    private httpService: HttpService,
    private apiKey: string,
  ) {}

  isSupported(symbol: string, type: string): boolean {
    // Alpha Vantage supports stocks, ETFs, and some funds
    return ['stock', 'etf', 'fund'].includes(type);
  }

  async getQuote(symbol: string, type: string): Promise<QuoteData | null> {
    try {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.apiKey}`;
      const response = await firstValueFrom(this.httpService.get(url));
      
      const quote = response.data['Global Quote'];
      if (!quote || !quote['05. price']) return null;

      const price = parseFloat(quote['05. price']);
      const change = parseFloat(quote['09. change']);
      const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));

      return {
        symbol,
        price,
        currency: 'USD', // Alpha Vantage typically returns USD
        timestamp: new Date(),
        change,
        changePercent,
        provider: this.name,
      };
    } catch (error) {
      throw new Error(`Alpha Vantage API error: ${error.message}`);
    }
  }
}

// CoinGecko Provider for Crypto
class CoinGeckoProvider implements QuoteProvider {
  name = 'CoinGecko';

  constructor(private httpService: HttpService) {}

  isSupported(symbol: string, type: string): boolean {
    return type === 'crypto';
  }

  async getQuote(symbol: string, type: string): Promise<QuoteData | null> {
    try {
      // Convert symbol to CoinGecko ID format (e.g., BTC -> bitcoin)
      const coinId = this.symbolToCoinId(symbol);
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd,brl&include_24hr_change=true&include_market_cap=true`;
      
      const response = await firstValueFrom(this.httpService.get(url));
      const data = response.data[coinId];
      
      if (!data) return null;

      return {
        symbol,
        price: data.usd,
        currency: 'USD',
        timestamp: new Date(),
        changePercent: data.usd_24h_change,
        marketCap: data.usd_market_cap,
        provider: this.name,
      };
    } catch (error) {
      throw new Error(`CoinGecko API error: ${error.message}`);
    }
  }

  private symbolToCoinId(symbol: string): string {
    // Map common crypto symbols to CoinGecko IDs
    const symbolMap: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'ADA': 'cardano',
      'DOT': 'polkadot',
      'LINK': 'chainlink',
      'BNB': 'binancecoin',
      'SOL': 'solana',
      'MATIC': 'matic-network',
      'AVAX': 'avalanche-2',
      'ATOM': 'cosmos',
    };

    return symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
  }
}