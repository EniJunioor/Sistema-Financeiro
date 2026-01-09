import { 
  Controller, 
  Post, 
  Get,
  Body, 
  UseGuards, 
  HttpCode, 
  HttpStatus, 
  Req, 
  Res,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { TwoFactorService } from '../services/two-factor.service';
import { 
  LoginDto, 
  RegisterDto, 
  AuthResponseDto, 
  RefreshTokenDto,
  RefreshTokenResponseDto,
  Enable2FADto,
  Verify2FADto,
  Disable2FADto,
  Generate2FABackupCodesDto,
} from '../dto';
import { Public, CurrentUser } from '../decorators';
import { 
  GoogleOAuthGuard,
  FacebookOAuthGuard,
  MicrosoftOAuthGuard,
  RateLimitGuard,
} from '../guards';

@ApiTags('Authentication')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async login(@Body() loginDto: LoginDto, @Req() req: Request): Promise<AuthResponseDto> {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent');
    return this.authService.login(loginDto, ipAddress, userAgent);
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ 
    status: 201, 
    description: 'User created successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ 
    status: 200, 
    description: 'Token refreshed successfully',
    type: RefreshTokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Body() refreshTokenDto: RefreshTokenDto): Promise<{ message: string }> {
    await this.authService.revokeRefreshToken(refreshTokenDto.refreshToken);
    return { message: 'Logout realizado com sucesso' };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from all devices' })
  @ApiResponse({ status: 200, description: 'Logout from all devices successful' })
  async logoutAll(@CurrentUser() user: any): Promise<{ message: string }> {
    await this.authService.revokeAllRefreshTokens(user.sub);
    return { message: 'Logout de todos os dispositivos realizado com sucesso' };
  }

  // OAuth2 Routes
  @Public()
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({ summary: 'Google OAuth login' })
  async googleAuth(): Promise<void> {
    // Guard redirects to Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    const tokens = await this.authService.generateTokens(req.user);
    
    // Redirect to frontend with tokens
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${tokens.access_token}&refresh=${tokens.refresh_token}`);
  }

  @Public()
  @Get('facebook')
  @UseGuards(FacebookOAuthGuard)
  @ApiOperation({ summary: 'Facebook OAuth login' })
  async facebookAuth(): Promise<void> {
    // Guard redirects to Facebook
  }

  @Public()
  @Get('facebook/callback')
  @UseGuards(FacebookOAuthGuard)
  @ApiOperation({ summary: 'Facebook OAuth callback' })
  async facebookAuthCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    const tokens = await this.authService.generateTokens(req.user);
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${tokens.access_token}&refresh=${tokens.refresh_token}`);
  }

  @Public()
  @Get('microsoft')
  @UseGuards(MicrosoftOAuthGuard)
  @ApiOperation({ summary: 'Microsoft OAuth login' })
  async microsoftAuth(): Promise<void> {
    // Guard redirects to Microsoft
  }

  @Public()
  @Get('microsoft/callback')
  @UseGuards(MicrosoftOAuthGuard)
  @ApiOperation({ summary: 'Microsoft OAuth callback' })
  async microsoftAuthCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    const tokens = await this.authService.generateTokens(req.user);
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${tokens.access_token}&refresh=${tokens.refresh_token}`);
  }

  // 2FA Routes
  @Post('2fa/generate-totp')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate TOTP secret for 2FA setup' })
  @ApiResponse({ status: 200, description: 'TOTP secret generated' })
  async generateTOTP(@CurrentUser() user: any): Promise<{ secret: string; qrCodeUrl: string }> {
    return this.twoFactorService.generateTOTPSecret(user.sub);
  }

  @Post('2fa/enable-totp')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable TOTP 2FA' })
  @ApiResponse({ status: 200, description: '2FA enabled successfully' })
  async enableTOTP(
    @CurrentUser() user: any,
    @Body() verifyDto: Verify2FADto,
  ): Promise<{ backupCodes: string[] }> {
    const backupCodes = await this.twoFactorService.enableTOTP(user.sub, verifyDto.token);
    return { backupCodes };
  }

  @Post('2fa/enable-sms')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable SMS 2FA' })
  @ApiResponse({ status: 200, description: 'SMS 2FA setup initiated' })
  async enableSMS(
    @CurrentUser() user: any,
    @Body() enableDto: Enable2FADto,
  ): Promise<{ message: string }> {
    await this.twoFactorService.enableSMS(user.sub, enableDto.phoneNumber!);
    return { message: 'Código de verificação enviado por SMS' };
  }

  @Post('2fa/send-sms')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send SMS 2FA code' })
  @ApiResponse({ status: 200, description: 'SMS code sent' })
  async sendSMSCode(@CurrentUser() user: any): Promise<{ message: string }> {
    await this.twoFactorService.sendSMSCode(user.sub);
    return { message: 'Código enviado por SMS' };
  }

  @Post('2fa/send-email')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send email 2FA code' })
  @ApiResponse({ status: 200, description: 'Email code sent' })
  async sendEmailCode(@CurrentUser() user: any): Promise<{ message: string }> {
    await this.twoFactorService.sendEmailCode(user.sub);
    return { message: 'Código enviado por email' };
  }

  @Post('2fa/disable')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable 2FA' })
  @ApiResponse({ status: 200, description: '2FA disabled successfully' })
  async disable2FA(
    @CurrentUser() user: any,
    @Body() disableDto: Disable2FADto,
  ): Promise<{ message: string }> {
    await this.twoFactorService.disable2FA(user.sub, disableDto.password, disableDto.token);
    return { message: '2FA desabilitado com sucesso' };
  }

  @Post('2fa/regenerate-backup-codes')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Regenerate 2FA backup codes' })
  @ApiResponse({ status: 200, description: 'Backup codes regenerated' })
  async regenerateBackupCodes(
    @CurrentUser() user: any,
    @Body() generateDto: Generate2FABackupCodesDto,
  ): Promise<{ backupCodes: string[] }> {
    const backupCodes = await this.twoFactorService.regenerateBackupCodes(user.sub, generateDto.password);
    return { backupCodes };
  }
}