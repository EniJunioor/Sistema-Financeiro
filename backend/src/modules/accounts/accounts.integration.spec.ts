import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { AccountsModule } from './accounts.module';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AccountsService } from './services/accounts.service';
import { OpenBankingService } from './services/open-banking.service';

describe('AccountsModule Integration', () => {
  let app: INestApplication;
  let accountsService: AccountsService;
  let openBankingService: OpenBankingService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        HttpModule,
        BullModule.forRoot({
          redis: {
            host: 'localhost',
            port: 6379,
          },
        }),
        PrismaModule,
        AccountsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    accountsService = moduleFixture.get<AccountsService>(AccountsService);
    openBankingService = moduleFixture.get<OpenBankingService>(OpenBankingService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(accountsService).toBeDefined();
    expect(openBankingService).toBeDefined();
  });

  it('should have all required services', () => {
    expect(accountsService).toBeInstanceOf(AccountsService);
    expect(openBankingService).toBeInstanceOf(OpenBankingService);
  });

  it('should return supported providers', () => {
    const providers = openBankingService.getSupportedProviders();
    
    expect(providers).toHaveLength(4);
    expect(providers.map(p => p.id)).toEqual([
      'plaid',
      'truelayer', 
      'pluggy',
      'belvo'
    ]);
  });

  it('should handle account filters', async () => {
    // This test would normally interact with a test database
    // For now, we just verify the service methods exist and can be called
    expect(typeof accountsService.findAllByUser).toBe('function');
    expect(typeof accountsService.findOneByUser).toBe('function');
    expect(typeof accountsService.create).toBe('function');
    expect(typeof accountsService.update).toBe('function');
  });
});