import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { RateLimitService } from './rate-limit.service';
import { TwoFactorService } from './two-factor.service';
import { RegisterDto, LoginDto } from '../dto';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
    },
    session: {
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockRateLimitService = {
    isAccountLocked: jest.fn(),
    recordLoginAttempt: jest.fn(),
  };

  const mockTwoFactorService = {
    verifyTOTP: jest.fn(),
    verifyBackupCode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: RateLimitService,
          useValue: mockRateLimitService,
        },
        {
          provide: TwoFactorService,
          useValue: mockTwoFactorService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      const email = 'test@example.com';
      const password = 'ValidPass123!';
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const mockUser = {
        id: '1',
        email,
        password: hashedPassword,
        name: 'Test User',
        avatar: null,
        emailVerified: null,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser(email, password);

      expect(result).toEqual({
        id: '1',
        email,
        name: 'Test User',
        avatar: null,
        emailVerified: null,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should return null when user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      const email = 'test@example.com';
      const hashedPassword = await bcrypt.hash('correctpassword', 12);
      
      const mockUser = {
        id: '1',
        email,
        password: hashedPassword,
        name: 'Test User',
        avatar: null,
        emailVerified: null,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser(email, 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return auth response when credentials are valid', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'ValidPass123!',
      };

      const mockUser = {
        id: '1',
        email: loginDto.email,
        name: 'Test User',
        avatar: null,
        emailVerified: null,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
        smsPhone: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock rate limiting
      mockRateLimitService.isAccountLocked.mockResolvedValue({ locked: false });
      mockRateLimitService.recordLoginAttempt.mockResolvedValue(undefined);
      
      // Mock validateUser to return user
      jest.spyOn(service, 'validateUser').mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock-jwt-token');
      mockConfigService.get.mockReturnValue('24h');
      
      // Mock Prisma calls
      mockPrismaService.refreshToken.create.mockResolvedValue({ token: 'refresh-token' });
      mockPrismaService.session.create.mockResolvedValue({});

      const result = await service.login(loginDto, '127.0.0.1', 'test-agent');

      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        refresh_token: expect.any(String),
        token_type: 'Bearer',
        expires_in: 86400, // 24 hours in seconds
        user: {
          id: '1',
          email: loginDto.email,
          name: 'Test User',
          emailVerified: null,
          twoFactorEnabled: false,
        },
      });
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      // Mock rate limiting
      mockRateLimitService.isAccountLocked.mockResolvedValue({ locked: false });
      mockRateLimitService.recordLoginAttempt.mockResolvedValue(undefined);
      
      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(service.login(loginDto, '127.0.0.1', 'test-agent')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should create user and return auth response when data is valid', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'ValidPass123!',
        name: 'New User',
      };

      const mockCreatedUser = {
        id: '2',
        email: registerDto.email,
        name: registerDto.name,
        emailVerified: null,
        twoFactorEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null); // User doesn't exist
      mockPrismaService.user.create.mockResolvedValue(mockCreatedUser);
      mockPrismaService.refreshToken.create.mockResolvedValue({ token: 'refresh-token' });
      mockJwtService.sign.mockReturnValue('mock-jwt-token');
      mockConfigService.get.mockReturnValue('24h');

      const result = await service.register(registerDto);

      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        refresh_token: expect.any(String),
        token_type: 'Bearer',
        expires_in: 86400,
        user: {
          id: '2',
          email: registerDto.email,
          name: registerDto.name,
          emailVerified: null,
          twoFactorEnabled: false,
        },
      });

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: registerDto.email,
          password: expect.any(String), // Hashed password
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
    });

    it('should throw ConflictException when user already exists', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        password: 'ValidPass123!',
        name: 'Existing User',
      };

      const existingUser = {
        id: '1',
        email: registerDto.email,
        name: 'Existing User',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for weak password', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'weak', // Weak password
        name: 'New User',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should not throw for strong password', () => {
      expect(() => {
        (service as any).validatePasswordStrength('ValidPass123!');
      }).not.toThrow();
    });

    it('should throw for password without uppercase', () => {
      expect(() => {
        (service as any).validatePasswordStrength('validpass123!');
      }).toThrow(BadRequestException);
    });

    it('should throw for password without lowercase', () => {
      expect(() => {
        (service as any).validatePasswordStrength('VALIDPASS123!');
      }).toThrow(BadRequestException);
    });

    it('should throw for password without numbers', () => {
      expect(() => {
        (service as any).validatePasswordStrength('ValidPass!');
      }).toThrow(BadRequestException);
    });

    it('should throw for password without special characters', () => {
      expect(() => {
        (service as any).validatePasswordStrength('ValidPass123');
      }).toThrow(BadRequestException);
    });

    it('should throw for password too short', () => {
      expect(() => {
        (service as any).validatePasswordStrength('Val1!');
      }).toThrow(BadRequestException);
    });
  });

  describe('parseExpirationToSeconds', () => {
    it('should parse seconds correctly', () => {
      const result = (service as any).parseExpirationToSeconds('30s');
      expect(result).toBe(30);
    });

    it('should parse minutes correctly', () => {
      const result = (service as any).parseExpirationToSeconds('15m');
      expect(result).toBe(900); // 15 * 60
    });

    it('should parse hours correctly', () => {
      const result = (service as any).parseExpirationToSeconds('24h');
      expect(result).toBe(86400); // 24 * 60 * 60
    });

    it('should parse days correctly', () => {
      const result = (service as any).parseExpirationToSeconds('7d');
      expect(result).toBe(604800); // 7 * 24 * 60 * 60
    });

    it('should return default for invalid format', () => {
      const result = (service as any).parseExpirationToSeconds('invalid');
      expect(result).toBe(86400); // Default 24 hours
    });
  });
});