import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  CONSENT_PURPOSES,
  ConsentType,
  RecordConsentDto,
  REVOCABLE_CONSENTS,
} from '../dto';

export interface ConsentState {
  type: ConsentType;
  granted: boolean;
  version: string | null;
  purpose: string;
  revocable: boolean;
  updatedAt: Date | null;
}

/**
 * Gerencia os registros de consentimento (LGPD, art. 8º).
 *
 * Consentimentos nunca são atualizados no lugar: cada decisão do titular gera
 * uma nova linha, formando uma trilha auditável. O estado atual é sempre o
 * registro mais recente de cada tipo.
 */
@Injectable()
export class ConsentService {
  private readonly logger = new Logger(ConsentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /** Versão vigente dos documentos legais. */
  private get currentVersion(): string {
    return this.configService.get<string>('PRIVACY_POLICY_VERSION', '1.0.0');
  }

  /**
   * Registra a decisão do titular. Consentimentos obrigatórios (termos e
   * política de privacidade) não podem ser revogados isoladamente — para isso
   * o titular deve solicitar a eliminação da conta.
   */
  async record(
    userId: string,
    dto: RecordConsentDto,
    context: { ipAddress?: string; userAgent?: string } = {},
  ) {
    if (!dto.granted && !REVOCABLE_CONSENTS.includes(dto.type)) {
      throw new BadRequestException(
        `O consentimento "${dto.type}" é necessário para a prestação do serviço e não pode ` +
          'ser revogado isoladamente. Para encerrar o tratamento, solicite a exclusão da conta ' +
          'em POST /privacy/deletion.',
      );
    }

    const record = await this.prisma.consentRecord.create({
      data: {
        userId,
        type: dto.type,
        granted: dto.granted,
        version: dto.version ?? this.currentVersion,
        purpose: CONSENT_PURPOSES[dto.type],
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
    });

    this.logger.log(
      `Consentimento "${dto.type}" ${dto.granted ? 'concedido' : 'revogado'} pelo usuário ${userId}`,
    );

    return record;
  }

  /**
   * Estado atual de cada tipo de consentimento. Tipos nunca respondidos
   * aparecem como não concedidos, com updatedAt nulo.
   */
  async getCurrentState(userId: string): Promise<ConsentState[]> {
    const records = await this.prisma.consentRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return Object.values(ConsentType).map((type) => {
      const latest = records.find((record) => record.type === type);

      return {
        type,
        granted: latest?.granted ?? false,
        version: latest?.version ?? null,
        purpose: CONSENT_PURPOSES[type],
        revocable: REVOCABLE_CONSENTS.includes(type),
        updatedAt: latest?.createdAt ?? null,
      };
    });
  }

  /** Histórico completo, do mais recente para o mais antigo. */
  async getHistory(userId: string, type?: ConsentType) {
    return this.prisma.consentRecord.findMany({
      where: { userId, ...(type ? { type } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Verifica se um consentimento específico está ativo no momento. */
  async hasConsent(userId: string, type: ConsentType): Promise<boolean> {
    const latest = await this.prisma.consentRecord.findFirst({
      where: { userId, type },
      orderBy: { createdAt: 'desc' },
    });

    return latest?.granted ?? false;
  }
}
