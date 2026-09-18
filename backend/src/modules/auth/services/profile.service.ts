import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  ChangePasswordDto,
  UpdatePreferencesDto,
  UpdateProfileDto,
} from '../dto/update-profile.dto';

const BCRYPT_ROUNDS = 12;

/** Preferências assumidas quando o usuário nunca salvou as suas. */
const DEFAULT_PREFERENCES = {
  language: 'pt-BR',
  currency: 'BRL',
  theme: 'system',
  timezone: 'America/Sao_Paulo',
  dateFormat: 'dd/MM/yyyy',
  notifications: {
    email: true,
    push: true,
    sms: false,
  },
};

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Perfil completo do titular, sem campos sensíveis. */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        emailVerified: true,
        twoFactorEnabled: true,
        smsPhone: true,
        phone: true,
        birthDate: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        bio: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const { preferences, ...profile } = user;

    return {
      ...profile,
      // A senha pode ser nula em contas criadas só via OAuth; a tela de
      // segurança precisa saber disso para esconder "alterar senha".
      preferences: this.parsePreferences(preferences),
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...dto,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      },
    });

    return this.getProfile(userId);
  }

  async getPreferences(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return this.parsePreferences(user.preferences);
  }

  /**
   * Mescla as preferências enviadas com as já salvas, para que a tela possa
   * atualizar um único campo sem reenviar o objeto inteiro.
   */
  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    const current = await this.getPreferences(userId);

    const merged = {
      ...current,
      ...dto,
      notifications: {
        ...current.notifications,
        ...(dto.notifications ?? {}),
      },
    };

    await this.prisma.user.update({
      where: { id: userId },
      data: { preferences: JSON.stringify(merged) },
    });

    return merged;
  }

  /**
   * Troca a senha e derruba as demais sessões: se a troca foi motivada por
   * suspeita de acesso indevido, manter os refresh tokens antigos anularia o efeito.
   */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (!user.password) {
      throw new BadRequestException(
        'Esta conta usa login social e não possui senha. Defina uma senha via "esqueci minha senha".',
      );
    }

    const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Senha atual incorreta');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('A nova senha deve ser diferente da atual');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      }),
      this.prisma.refreshToken.deleteMany({ where: { userId } }),
      this.prisma.session.updateMany({
        where: { userId },
        data: { isActive: false },
      }),
    ]);

    this.logger.log(`Senha alterada para o usuário ${userId}; sessões revogadas`);

    return { message: 'Senha alterada com sucesso. Faça login novamente.' };
  }

  /** Sessões ativas e não expiradas, para a tela de segurança. */
  async getActiveSessions(userId: string) {
    return this.prisma.session.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { isActive: false },
    });

    return { message: 'Sessão encerrada com sucesso' };
  }

  /**
   * Tentativas de login recentes, para a linha do tempo de segurança.
   * Inclui as falhas: é justamente nelas que o titular percebe acesso indevido.
   */
  async getSecurityEvents(userId: string, limit = 20) {
    return this.prisma.loginAttempt.findMany({
      where: { userId },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        success: true,
        failureReason: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    });
  }

  /** Encerra todas as sessões e invalida os refresh tokens do usuário. */
  async revokeAllSessions(userId: string) {
    await this.prisma.$transaction([
      this.prisma.session.updateMany({
        where: { userId },
        data: { isActive: false },
      }),
      this.prisma.refreshToken.deleteMany({ where: { userId } }),
    ]);

    return { message: 'Todas as sessões foram encerradas' };
  }

  /**
   * Preferências mal formadas no banco não devem quebrar a tela: o default
   * é devolvido e o problema fica registrado no log.
   */
  private parsePreferences(raw: string | null) {
    if (!raw) return DEFAULT_PREFERENCES;

    try {
      const parsed = JSON.parse(raw);

      return {
        ...DEFAULT_PREFERENCES,
        ...parsed,
        notifications: {
          ...DEFAULT_PREFERENCES.notifications,
          ...(parsed.notifications ?? {}),
        },
      };
    } catch {
      this.logger.warn('Preferências inválidas no banco; usando os valores padrão');
      return DEFAULT_PREFERENCES;
    }
  }
}
