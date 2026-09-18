import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

/** Por quantos dias o arquivo exportado fica disponível para download. */
const EXPORT_TTL_DAYS = 7;

/** Campos que nunca saem no export: são segredos, não dados do titular. */
const REDACTED = '[redacted]';

export interface ExportedData {
  exportedAt: string;
  format: string;
  subject: Record<string, any>;
  accounts: any[];
  transactions: any[];
  investments: any[];
  goals: any[];
  subscriptions: any[];
  notifications: any[];
  consents: any[];
  sessions: any[];
  oauthAccounts: any[];
}

/**
 * Exportação dos dados do titular (LGPD, art. 18, II e V — acesso e
 * portabilidade). O resultado é um JSON legível por máquina, sem segredos
 * (senhas, tokens, chaves de 2FA), que são substituídos por marcador.
 */
@Injectable()
export class DataExportService {
  private readonly logger = new Logger(DataExportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria a solicitação e já processa o export. Se a coleta falhar, a
   * solicitação fica registrada com status "failed" e a mensagem de erro.
   */
  async requestExport(userId: string) {
    const request = await this.prisma.dataExportRequest.create({
      data: { userId, status: 'processing' },
    });

    try {
      const data = await this.collectUserData(userId);
      const payload = JSON.stringify(data, null, 2);

      return await this.prisma.dataExportRequest.update({
        where: { id: request.id },
        data: {
          status: 'completed',
          payload,
          sizeBytes: Buffer.byteLength(payload, 'utf8'),
          completedAt: new Date(),
          expiresAt: new Date(Date.now() + EXPORT_TTL_DAYS * 24 * 60 * 60 * 1000),
        },
      });
    } catch (error) {
      this.logger.error(`Falha ao exportar dados do usuário ${userId}`, error?.stack);

      await this.prisma.dataExportRequest.update({
        where: { id: request.id },
        data: { status: 'failed', error: error?.message ?? 'Erro desconhecido' },
      });

      throw error;
    }
  }

  /** Lista as solicitações do titular, sem o payload (que pode ser grande). */
  async listRequests(userId: string) {
    return this.prisma.dataExportRequest.findMany({
      where: { userId },
      orderBy: { requestedAt: 'desc' },
      select: {
        id: true,
        status: true,
        format: true,
        sizeBytes: true,
        error: true,
        requestedAt: true,
        completedAt: true,
        expiresAt: true,
      },
    });
  }

  /**
   * Recupera o conteúdo exportado. Só o próprio titular tem acesso, e apenas
   * enquanto o export não expirou.
   */
  async download(userId: string, requestId: string): Promise<ExportedData> {
    const request = await this.prisma.dataExportRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Solicitação de exportação não encontrada');
    }

    if (request.userId !== userId) {
      throw new ForbiddenException('Esta exportação pertence a outro titular');
    }

    if (request.status !== 'completed' || !request.payload) {
      throw new NotFoundException(
        `Exportação ainda não disponível (status: ${request.status})`,
      );
    }

    if (request.expiresAt && request.expiresAt < new Date()) {
      await this.prisma.dataExportRequest.update({
        where: { id: requestId },
        data: { status: 'expired', payload: null },
      });

      throw new NotFoundException(
        'Esta exportação expirou. Solicite uma nova em POST /privacy/export.',
      );
    }

    return JSON.parse(request.payload) as ExportedData;
  }

  /**
   * Coleta tudo que a plataforma armazena sobre o titular.
   *
   * Qualquer model novo com dado pessoal precisa ser adicionado aqui — é o
   * ponto único que sustenta o direito de acesso.
   */
  async collectUserData(userId: string): Promise<ExportedData> {
    const [
      user,
      accounts,
      transactions,
      investments,
      goals,
      subscriptions,
      notifications,
      consents,
      sessions,
      oauthAccounts,
    ] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.account.findMany({ where: { userId } }),
      this.prisma.transaction.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
      }),
      this.prisma.investment.findMany({
        where: { userId },
        include: { transactions: true },
      }),
      this.prisma.goal.findMany({ where: { userId } }),
      this.prisma.subscription.findMany({ where: { userId } }),
      this.prisma.notification.findMany({ where: { userId } }),
      this.prisma.consentRecord.findMany({ where: { userId } }),
      this.prisma.session.findMany({ where: { userId } }),
      this.prisma.oAuthAccount.findMany({ where: { userId } }),
    ]);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return {
      exportedAt: new Date().toISOString(),
      format: 'json',
      subject: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        smsPhone: user.smsPhone,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        password: user.password ? REDACTED : null,
        twoFactorSecret: user.twoFactorSecret ? REDACTED : null,
        twoFactorBackupCodes: user.twoFactorBackupCodes ? REDACTED : null,
      },
      // Tokens de Open Banking são credenciais do provedor, não dados do titular.
      accounts: accounts.map(({ accessToken, refreshToken, ...account }) => ({
        ...account,
        accessToken: accessToken ? REDACTED : null,
        refreshToken: refreshToken ? REDACTED : null,
      })),
      transactions,
      investments,
      goals,
      subscriptions,
      notifications,
      consents,
      sessions: sessions.map(({ token, ...session }) => ({ ...session, token: REDACTED })),
      oauthAccounts: oauthAccounts.map(
        ({ accessToken, refreshToken, idToken, ...oauth }) => ({
          ...oauth,
          accessToken: accessToken ? REDACTED : null,
          refreshToken: refreshToken ? REDACTED : null,
          idToken: idToken ? REDACTED : null,
        }),
      ),
    };
  }
}
