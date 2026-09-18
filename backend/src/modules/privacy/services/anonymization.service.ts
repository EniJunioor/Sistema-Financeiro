import { Injectable, Logger } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../../common/prisma/prisma.service';

export interface AnonymizationResult {
  userId: string;
  anonymizedAt: Date;
  deleted: Record<string, number>;
}

/**
 * Anonimização irreversível do titular (LGPD, art. 12).
 *
 * A conta não é apagada fisicamente: os identificadores diretos são
 * destruídos e os registros financeiros são removidos, mas a linha do usuário
 * permanece para preservar a integridade referencial e os registros de
 * auditoria exigidos pelo art. 37. Depois disso não há como reidentificar o
 * titular, então o dado deixa de ser pessoal.
 */
@Injectable()
export class AnonymizationService {
  private readonly logger = new Logger(AnonymizationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Executa a anonimização em uma transação: ou tudo é apagado, ou nada é.
   * Idempotente — um usuário já anonimizado é devolvido sem alteração.
   */
  async anonymizeUser(userId: string): Promise<AnonymizationResult> {
    const existing = await this.prisma.user.findUnique({ where: { id: userId } });

    if (existing?.anonymizedAt) {
      this.logger.warn(`Usuário ${userId} já estava anonimizado — nada a fazer`);
      return { userId, anonymizedAt: existing.anonymizedAt, deleted: {} };
    }

    const anonymizedAt = new Date();

    const deleted = await this.prisma.$transaction(async (tx) => {
      // Dados financeiros e comportamentais: eliminados por completo.
      const counts: Record<string, number> = {};

      counts.transactions = (await tx.transaction.deleteMany({ where: { userId } })).count;
      counts.investments = (await tx.investment.deleteMany({ where: { userId } })).count;
      counts.goals = (await tx.goal.deleteMany({ where: { userId } })).count;
      counts.subscriptions = (await tx.subscription.deleteMany({ where: { userId } })).count;
      counts.accounts = (await tx.account.deleteMany({ where: { userId } })).count;
      counts.notifications = (await tx.notification.deleteMany({ where: { userId } })).count;
      counts.anomalyAlerts = (await tx.anomalyAlert.deleteMany({ where: { userId } })).count;
      counts.mlModels = (await tx.mLModel.deleteMany({ where: { userId } })).count;
      counts.fcmTokens = (await tx.fCMToken.deleteMany({ where: { userId } })).count;
      counts.behaviorProfile = (
        await tx.userBehaviorProfile.deleteMany({ where: { userId } })
      ).count;

      // Credenciais e sessões: revogadas.
      counts.sessions = (await tx.session.deleteMany({ where: { userId } })).count;
      counts.refreshTokens = (await tx.refreshToken.deleteMany({ where: { userId } })).count;
      counts.oauthAccounts = (await tx.oAuthAccount.deleteMany({ where: { userId } })).count;

      // Identificadores diretos: substituídos por valores irreversíveis.
      // O e-mail vira um hash com salt aleatório descartado em seguida, o que
      // mantém a unicidade da coluna sem permitir busca reversa.
      await tx.user.update({
        where: { id: userId },
        data: {
          email: this.buildAnonymousEmail(userId),
          name: null,
          avatar: null,
          password: null,
          smsPhone: null,
          twoFactorSecret: null,
          twoFactorBackupCodes: null,
          twoFactorEnabled: false,
          emailVerified: null,
          anonymizedAt,
        },
      });

      return counts;
    });

    this.logger.log(
      `Usuário ${userId} anonimizado. Registros removidos: ${JSON.stringify(deleted)}`,
    );

    return { userId, anonymizedAt, deleted };
  }

  /**
   * Gera um e-mail sintético único e não reversível.
   * O salt aleatório garante que nem o próprio userId permita recalcular o
   * valor a partir do e-mail original.
   */
  private buildAnonymousEmail(userId: string): string {
    const salt = randomBytes(16).toString('hex');
    const digest = createHash('sha256').update(`${userId}:${salt}`).digest('hex').slice(0, 32);

    return `anonymized-${digest}@deleted.invalid`;
  }
}
