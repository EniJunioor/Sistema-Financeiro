import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { InvestmentsController } from './controllers/investments.controller';
import { PortfolioAnalysisController } from './controllers/portfolio-analysis.controller';
import { InvestmentsService } from './services/investments.service';
import { QuotesService } from './services/quotes.service';
import { PortfolioService } from './services/portfolio.service';
import { PerformanceService } from './services/performance.service';
import { PortfolioAnalysisService } from './services/portfolio-analysis.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    HttpModule,
    BullModule.registerQueue({
      name: 'quotes-update',
    }),
  ],
  controllers: [InvestmentsController, PortfolioAnalysisController],
  providers: [
    InvestmentsService,
    QuotesService,
    PortfolioService,
    PerformanceService,
    PortfolioAnalysisService,
  ],
  exports: [InvestmentsService, PortfolioAnalysisService],
})
export class InvestmentsModule {}