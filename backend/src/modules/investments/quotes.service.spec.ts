import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { QuotesService } from './services/quotes.service';
import { InvestmentType } from './dto';
import { of } from 'rxjs';

describe('QuotesService', () => {
  let service: QuotesService;
  let httpService: HttpService;
  let configService: ConfigService;

  const mockHttpService = {
    get: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotesService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<QuotesService>(QuotesService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getQuote', () => {
    it('should get quote for stock from Yahoo Finance', async () => {
      const mockYahooResponse = {
        data: {
          chart: {
            result: [{
              meta: {
                regularMarketPrice: 150.25,
                previousClose: 148.50,
                currency: 'USD',
                regularMarketVolume: 1000000,
              },
            }],
          },
        },
      };

      mockHttpService.get.mockReturnValue(of(mockYahooResponse));

      const result = await service.getQuote('AAPL', InvestmentType.STOCK);

      expect(result).toEqual({
        symbol: 'AAPL',
        price: 150.25,
        currency: 'USD',
        timestamp: expect.any(Date),
        change: 1.75,
        changePercent: expect.any(Number),
        volume: 1000000,
        provider: 'Yahoo Finance',
      });
    });

    it('should return null if no quote is available', async () => {
      mockHttpService.get.mockReturnValue(of({ data: {} }));

      const result = await service.getQuote('INVALID', InvestmentType.STOCK);

      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      mockHttpService.get.mockReturnValue(of({ data: null }));

      const result = await service.getQuote('AAPL', InvestmentType.STOCK);

      expect(result).toBeNull();
    });
  });

  describe('getMultipleQuotes', () => {
    it('should get quotes for multiple symbols', async () => {
      const symbols = [
        { symbol: 'AAPL', type: InvestmentType.STOCK },
        { symbol: 'GOOGL', type: InvestmentType.STOCK },
      ];

      const mockYahooResponse = {
        data: {
          chart: {
            result: [{
              meta: {
                regularMarketPrice: 150.25,
                previousClose: 148.50,
                currency: 'USD',
              },
            }],
          },
        },
      };

      mockHttpService.get.mockReturnValue(of(mockYahooResponse));

      const result = await service.getMultipleQuotes(symbols);

      expect(result.size).toBe(2);
      expect(result.has('AAPL')).toBe(true);
      expect(result.has('GOOGL')).toBe(true);
    });
  });
});