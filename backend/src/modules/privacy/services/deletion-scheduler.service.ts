import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { DataDeletionService } from './data-deletion.service';

/**
 * Executa as rotinas periódicas de retenção exigidas pela LGPD.
 */
@Injectable()
export class DeletionSchedulerService {
  private readonly logger = new Logger(DeletionSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dataDeletion: DataDeletionService,
  ) {}

  /**
   * Executa as exclusões cuja carência venceu.
   * Roda de madrugada, quando o volume de escrita é menor.
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async processDueDeletions() {
    const { processed, failed } = await this.dataDeletion.processDueDeletions();

    if (processed > 0 || failed > 0) {
      this.logger.log(
        `Rotina de exclusão: ${processed} concluídas, ${failed} com falha`,
      );
    }
  }

  /**
   * Descarta o conteúdo de exports vencidos.
   * O registro da solicitação permanece como trilha de auditoria; só o
   * payload — que contém dados pessoais — é eliminado.
   */
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async expireOldExports() {
    const { count } = await this.prisma.dataExportRequest.updateMany({
      where: {
        status: 'completed',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'expired', payload: null },
    });

    if (count > 0) {
      this.logger.log(`${count} exportação(ões) expirada(s) e purgada(s)`);
    }
  }
}
