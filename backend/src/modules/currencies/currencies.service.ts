import { Injectable, Logger, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';

const FRANKFURTER_URL = 'https://api.frankfurter.app';
const CACHE_KEY = 'currencies:rates';
const CACHE_TTL = 60 * 60 * 1000; // 1 hora em ms

export interface CurrencyRates {
  base: string;
  date: string;
  rates: Record<string, number>;
}

@Injectable()
export class CurrenciesService {
  private readonly logger = new Logger(CurrenciesService.name);

  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async getRates(base = 'BRL', symbols = 'USD,EUR,CAD'): Promise<CurrencyRates> {
    const cacheKey = `${CACHE_KEY}:${base}:${symbols}`;
    try {
      const cached = await this.cache.get<CurrencyRates>(cacheKey);
      if (cached) return cached;
    } catch {
      this.logger.warn('Cache read failed, fetching fresh');
    }

    try {
      const url = `${FRANKFURTER_URL}/latest?from=${base}&to=${symbols}`;
      const { data } = await firstValueFrom(
        this.httpService.get<{ base: string; date: string; rates: Record<string, number> }>(url),
      );
      const result: CurrencyRates = {
        base: data.base,
        date: data.date,
        rates: data.rates || {},
      };
      try {
        await this.cache.set(cacheKey, result, CACHE_TTL);
      } catch {
        this.logger.warn('Cache set failed');
      }
      return result;
    } catch (err: any) {
      this.logger.error('Frankfurter API failed', err?.message);
      // fallback estático em caso de erro
      return {
        base: 'BRL',
        date: new Date().toISOString().slice(0, 10),
        rates: { USD: 0.18, EUR: 0.17, CAD: 0.24 },
      };
    }
  }
}
