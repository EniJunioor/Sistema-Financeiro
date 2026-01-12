import { Test, TestingModule } from '@nestjs/testing';
import { AccountsService } from './accounts.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

describe('AccountsService', () => {
  let service: AccountsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    account: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByUser', () => {
    it('should return user accounts', async () => {
      const userId = 'user-123';
      const mockAccounts = [
        {
          id: 'acc-1',
          userId,
          name: 'Test Account',
          type: 'checking',
          balance: 1000,
          _count: { transactions: 5 },
        },
      ];

      mockPrismaService.account.findMany.mockResolvedValue(mockAccounts);

      const result = await service.findAllByUser(userId);

      expect(result).toEqual({
        accounts: mockAccounts,
        total: 1,
      });
      expect(mockPrismaService.account.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { transactions: true },
          },
        },
      });
    });

    it('should apply filters correctly', async () => {
      const userId = 'user-123';
      const filters = { type: 'checking' as any, isActive: true };

      mockPrismaService.account.findMany.mockResolvedValue([]);

      await service.findAllByUser(userId, filters);

      expect(mockPrismaService.account.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          type: 'checking',
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { transactions: true },
          },
        },
      });
    });
  });

  describe('findOneByUser', () => {
    it('should return account if found', async () => {
      const userId = 'user-123';
      const accountId = 'acc-1';
      const mockAccount = {
        id: accountId,
        userId,
        name: 'Test Account',
        _count: { transactions: 5 },
      };

      mockPrismaService.account.findFirst.mockResolvedValue(mockAccount);

      const result = await service.findOneByUser(userId, accountId);

      expect(result).toEqual(mockAccount);
      expect(mockPrismaService.account.findFirst).toHaveBeenCalledWith({
        where: { id: accountId, userId },
        include: {
          _count: {
            select: { transactions: true },
          },
        },
      });
    });

    it('should throw NotFoundException if account not found', async () => {
      const userId = 'user-123';
      const accountId = 'acc-1';

      mockPrismaService.account.findFirst.mockResolvedValue(null);

      await expect(service.findOneByUser(userId, accountId)).rejects.toThrow(
        'Account not found',
      );
    });
  });

  describe('create', () => {
    it('should create account successfully', async () => {
      const accountData = {
        user: { connect: { id: 'user-123' } },
        name: 'Test Account',
        type: 'checking',
        balance: 1000,
      };
      const mockCreatedAccount = { id: 'acc-1', ...accountData };

      mockPrismaService.account.create.mockResolvedValue(mockCreatedAccount);

      const result = await service.create(accountData as any);

      expect(result).toEqual(mockCreatedAccount);
      expect(mockPrismaService.account.create).toHaveBeenCalledWith({
        data: accountData,
      });
    });
  });

  describe('updateBalance', () => {
    it('should update account balance', async () => {
      const accountId = 'acc-1';
      const newBalance = 1500;
      const mockUpdatedAccount = {
        id: accountId,
        balance: newBalance,
        updatedAt: expect.any(Date),
      };

      mockPrismaService.account.update.mockResolvedValue(mockUpdatedAccount);

      const result = await service.updateBalance(accountId, newBalance);

      expect(result).toEqual(mockUpdatedAccount);
      expect(mockPrismaService.account.update).toHaveBeenCalledWith({
        where: { id: accountId },
        data: {
          balance: newBalance,
          updatedAt: expect.any(Date),
        },
      });
    });
  });
});