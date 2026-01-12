import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AccountsController } from './controllers/accounts.controller';
import { AccountsService } from './services/accounts.service';
import { OpenBankingService } from './services/open-banking.service';
import { SyncService } from './services/sync.service';
import { TokenEncryptionService } from './services/token-encryption.service';
import { PlaidService } from './services/providers/plaid.service';
import { TrueLayerService } from './services/providers/truelayer.service';
import { PluggyService } from './services/providers/pluggy.service';
import { BelvoService } from './services/providers/belvo.service';
import { SyncProcessor } from './processors/sync.processor';

@Module({
  imports: [
    PrismaModule,
    HttpModule,
    BullModule.registerQueue({
      name: 'account-sync',
    }),
  ],
  controllers: [AccountsController],
  providers: [
    AccountsService,
    OpenBankingService,
    SyncService,
    TokenEncryptionService,
    PlaidService,
    TrueLayerService,
    PluggyService,
    BelvoService,
    SyncProcessor,
  ],
  exports: [AccountsService, OpenBankingService, SyncService],
})
export class AccountsModule {}