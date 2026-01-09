import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { RegisterDto, LoginDto, AuthResponseDto, OAuthUserDto, RefreshTokenDto, RefreshTokenResponseDto } from '../dto';
import { RateLimitService } from './rate-limit.service';
import { TwoFactorService } from './two-factor.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly rateLimitService: RateLimitService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // Remove password from returned user object
    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto, ipAddress: string, userAgent?: string): Promise<AuthResponseDto> {
    // Check if account is locked
    const lockStatus = await this.rateLimitService.isAccountLocked(loginDto.email);
    if (lockStatus.locked) {
      await this.rateLimitService.recordLoginAttempt({
        email: loginDto.email,
        ipAddress,
        userAgent,
        success: false,
        failureReason: 'Account locked',
      });
      
      throw new UnauthorizedException(
        `Conta bloqueada devido a muitas tentativas falhadas. Tente novamente em ${lockStatus.remainingTime} minutos.`
      );
    }

    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      await this.rateLimitService.recordLoginAttempt({
        email: loginDto.email,
        ipAddress,
        userAgent,
        success: false,
        failureReason: 'Invalid credentials',
      });
      
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled && !loginDto.twoFactorToken) {
      await this.rateLimitService.recordLoginAttempt({
        email: loginDto.email,
        ipAddress,
        userAgent,
        success: false,
        failureReason: '2FA token required',
      });
      
      throw new UnauthorizedException('Token de autenticação de dois fatores é obrigatório');
    }

    // Verify 2FA token if provided
    if (user.twoFactorEnabled && loginDto.twoFactorToken) {
      const is2FAValid = await this.twoFactorService.verifyTOTP(user.id, loginDto.twoFactorToken) ||
                        await this.twoFactorService.verifyBackupCode(user.id, loginDto.twoFactorToken);
      
      if (!is2FAValid) {
        await this.rateLimitService.recordLoginAttempt({
          email: loginDto.email,
          ipAddress,
          userAgent,
          success: false,
          failureReason: 'Invalid 2FA token',
        });
        
        throw new UnauthorizedException('Token de autenticação de dois fatores inválido');
      }
    }

    // Record successful login
    await this.rateLimitService.recordLoginAttempt({
      email: loginDto.email,
      ipAddress,
      userAgent,
      success: true,
    });

    return this.generateTokens(user, ipAddress, userAgent);
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Usuário já existe com este email');
    }

    // Validate password strength (additional validation beyond DTO)
    this.validatePasswordStrength(registerDto.password);

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        name: registerDto.name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.generateTokens(user);
  }

  async findOrCreateOAuthUser(oauthData: OAuthUserDto): Promise<any> {
    // Check if OAuth account already exists
    let oauthAccount = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: oauthData.provider,
          providerAccountId: oauthData.providerAccountId,
        },
      },
      include: { user: true },
    });

    if (oauthAccount) {
      // Update tokens
      await this.prisma.oAuthAccount.update({
        where: { id: oauthAccount.id },
        data: {
          accessToken: oauthData.accessToken,
          refreshToken: oauthData.refreshToken,
        },
      });
      
      return oauthAccount.user;
    }

    // Check if user exists with the same email
    let user = await this.prisma.user.findUnique({
      where: { email: oauthData.email },
    });

    if (!user) {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          email: oauthData.email,
          name: oauthData.name,
          avatar: oauthData.avatar,
          emailVerified: new Date(), // OAuth emails are considered verified
        },
      });
    }

    // Create OAuth account link
    await this.prisma.oAuthAccount.create({
      data: {
        userId: user.id,
        provider: oauthData.provider,
        providerAccountId: oauthData.providerAccountId,
        accessToken: oauthData.accessToken,
        refreshToken: oauthData.refreshToken,
      },
    });

    return user;
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
    const refreshTokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenDto.refreshToken },
      include: { user: true },
    });

    if (!refreshTokenRecord || refreshTokenRecord.isRevoked || refreshTokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Token de refresh inválido ou expirado');
    }

    // Revoke old refresh token
    await this.prisma.refreshToken.update({
      where: { id: refreshTokenRecord.id },
      data: { isRevoked: true },
    });

    // Generate new tokens
    const tokens = await this.generateTokens(refreshTokenRecord.user);
    
    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token!,
      token_type: 'Bearer',
      expires_in: tokens.expires_in,
    };
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { token },
      data: { isRevoked: true },
    });
  }

  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }

  async generateTokens(user: any, ipAddress?: string, userAgent?: string): Promise<AuthResponseDto> {
    const payload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload);
    
    // Generate refresh token
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const refreshTokenExpiresAt = new Date();
    refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 30); // 30 days

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: refreshTokenExpiresAt,
      },
    });

    // Create session record
    if (ipAddress) {
      const sessionExpiresAt = new Date();
      sessionExpiresAt.setHours(sessionExpiresAt.getHours() + 24); // 24 hours

      await this.prisma.session.create({
        data: {
          userId: user.id,
          token: access_token,
          deviceInfo: userAgent,
          ipAddress,
          expiresAt: sessionExpiresAt,
        },
      });
    }
    
    // Get token expiration from config
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '24h');
    const expiresInSeconds = this.parseExpirationToSeconds(expiresIn);

    return {
      access_token,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: expiresInSeconds,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    };
  }

  private validatePasswordStrength(password: string): void {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);

    if (password.length < minLength) {
      throw new BadRequestException('Senha deve ter pelo menos 8 caracteres');
    }

    if (!hasUpperCase) {
      throw new BadRequestException('Senha deve conter pelo menos uma letra maiúscula');
    }

    if (!hasLowerCase) {
      throw new BadRequestException('Senha deve conter pelo menos uma letra minúscula');
    }

    if (!hasNumbers) {
      throw new BadRequestException('Senha deve conter pelo menos um número');
    }

    if (!hasSpecialChar) {
      throw new BadRequestException('Senha deve conter pelo menos um símbolo especial (@$!%*?&)');
    }
  }

  private parseExpirationToSeconds(expiration: string): number {
    const unit = expiration.slice(-1);
    const value = parseInt(expiration.slice(0, -1));

    // If parsing fails, return default
    if (isNaN(value)) {
      return 86400; // Default to 24 hours
    }

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 86400; // Default to 24 hours
    }
  }
}