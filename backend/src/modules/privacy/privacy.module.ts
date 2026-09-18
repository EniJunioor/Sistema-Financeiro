import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { PrivacyController } from './controllers/privacy.controller';
import { ConsentService } from './services/consent.service';
import { DataExportService } from './services/data-export.service';
import { DataDeletionService } from './services/data-deletion.service';
import { AnonymizationService } from './services/anonymization.service';
import { DeletionSchedulerService } from './services/deletion-scheduler.service';

@Module({
  imports: [PrismaModule],
  controllers: [PrivacyController],
  providers: [
    ConsentService,
    DataExportService,
    DataDeletionService,
    AnonymizationService,
    DeletionSchedulerService,
  ],
  exports: [ConsentService, DataExportService, DataDeletionService, AnonymizationService],
})
export class PrivacyModule {}
