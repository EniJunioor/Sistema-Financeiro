import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AnonymizationService } from './anonymization.service';
import { RequestDeletionDto } from '../dto';

/** Carência padrão, em dias, antes da eliminação efetiva. */
const DEFAULT_GRACE_PERIOD_DAYS = 30;

/**
 * Direito de eliminação (LGPD, art. 18, VI).
 *
 * A exclusão não é imediata: fica pendente por um período de carência em que
 * o titular pode se arrepender e cancelar. Passado o prazo, o agendador
 * executa a anonimização, que é irreversível.
 */
@Injectable()
export class DataDeletionService {
  private readonly logger = new Logger(DataDeletionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly anonymization: AnonymizationService,
  ) {}

  private get gracePeriodDays(): number {
    return this.configService.get<number>(
      'LGPD_DELETION_GRACE_PERIOD_DAYS',
      DEFAULT_GRACE_PERIOD_DAYS,
    );
  }

  /** Abre a solicitação. Um titular só pode ter uma pendente por vez. */
  async requestDeletion(userId: string, dto: RequestDeletionDto = {}) {
    const pending = await this.prisma.dataDeletionRequest.findFirst({
      where: { userId, status: 'pending' },
    });

    if (pending) {
      throw new BadRequestException(
        `Já existe uma solicitação de exclusão pendente, agendada para ` +
          `${pending.scheduledFor.toISOString()}. Cancele-a antes de abrir outra.`,
      );
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user.anonymizedAt) {
      throw new BadRequestException('Os dados deste usuário já foram eliminados');
    }

    const scheduledFor = new Date(
      Date.now() + this.gracePeriodDays * 24 * 60 * 60 * 1000,
    );

    const request = await this.prisma.dataDeletionRequest.create({
      data: { userId, reason: dto.reason, scheduledFor },
    });

    this.logger.log(
      `Exclusão solicitada pelo usuário ${userId}, agendada para ${scheduledFor.toISOString()}`,
    );

    return request;
  }

  /** Cancela a solicitação pendente dentro do período de carência. */
  async cancelDeletion(userId: string) {
    const pending = await this.prisma.dataDeletionRequest.findFirst({
      where: { userId, status: 'pending' },
    });

    if (!pending) {
      throw new NotFoundException('Nenhuma solicitação de exclusão pendente');
    }

    const cancelled = await this.prisma.dataDeletionRequest.update({
      where: { id: pending.id },
      data: { status: 'cancelled', cancelledAt: new Date() },
    });

    this.logger.log(`Exclusão cancelada pelo usuário ${userId}`);

    return cancelled;
  }

  /** Solicitação pendente do titular, se houver. */
  async getPendingRequest(userId: string) {
    return this.prisma.dataDeletionRequest.findFirst({
      where: { userId, status: 'pending' },
    });
  }

  /** Histórico de solicitações do titular. */
  async listRequests(userId: string) {
    return this.prisma.dataDeletionRequest.findMany({
      where: { userId },
      orderBy: { requestedAt: 'desc' },
    });
  }

  /**
   * Executa a eliminação de uma solicitação específica.
   * Chamado pelo agendador; a anonimização em si é irreversível.
   */
  async executeDeletion(requestId: string) {
    const request = await this.prisma.dataDeletionRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Solicitação não encontrada');
    }

    if (request.status !== 'pending') {
      throw new BadRequestException(
        `Solicitação não está pendente (status: ${request.status})`,
      );
    }

    try {
      await this.anonymization.anonymizeUser(request.userId);

      return await this.prisma.dataDeletionRequest.update({
        where: { id: requestId },
        data: { status: 'completed', completedAt: new Date() },
      });
    } catch (error) {
      this.logger.error(
        `Falha ao executar exclusão ${requestId}`,
        error?.stack,
      );

      await this.prisma.dataDeletionRequest.update({
        where: { id: requestId },
        data: { status: 'failed', error: error?.message ?? 'Erro desconhecido' },
      });

      throw error;
    }
  }

  /**
   * Processa todas as solicitações cuja carência já venceu.
   * Uma falha isolada não interrompe as demais.
   */
  async processDueDeletions(): Promise<{ processed: number; failed: number }> {
    const due = await this.prisma.dataDeletionRequest.findMany({
      where: { status: 'pending', scheduledFor: { lte: new Date() } },
    });

    let processed = 0;
    let failed = 0;

    for (const request of due) {
      try {
        await this.executeDeletion(request.id);
        processed++;
      } catch (error) {
        failed++;
      }
    }

    if (due.length > 0) {
      this.logger.log(
        `Exclusões processadas: ${processed} concluídas, ${failed} com falha`,
      );
    }

    return { processed, failed };
  }
}
