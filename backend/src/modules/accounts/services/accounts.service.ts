import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { UpdateAccountDto } from '../dto/update-account.dto';
import { AccountFiltersDto } from '../dto/account-filters.dto';
import { Account, Prisma } from '@prisma/client';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string, filters: AccountFiltersDto = {}) {
    const where: Prisma.AccountWhereInput = {
      userId,
      ...(filters.type && { type: filters.type }),
      ...(filters.provider && { provider: filters.provider }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
    };

    const accounts = await this.prisma.account.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    return {
      accounts,
      total: accounts.length,
    };
  }

  async findOneByUser(userId: string, accountId: string) {
    const account = await this.prisma.account.findFirst({
      where: {
        id: accountId,
        userId,
      },
      select: {
        id: true,
        userId: true,
        type: true,
        provider: true,
        providerAccountId: true,
        name: true,
        balance: true,
        currency: true,
        isActive: true,
        lastSyncAt: true,
        accessToken: true,
        refreshToken: true,
        tokenExpiresAt: true,
        syncError: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  async create(data: Prisma.AccountCreateInput): Promise<Account> {
    return this.prisma.account.create({
      data,
    });
  }

  async update(
    userId: string,
    accountId: string,
    updateData: UpdateAccountDto | any, // Allow any for internal updates
  ): Promise<Account> {
    // Verify account belongs to user (skip for system updates)
    if (userId !== 'system') {
      await this.findOneByUser(userId, accountId);
    }

    return this.prisma.account.update({
      where: { id: accountId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });
  }

  async disconnect(userId: string, accountId: string): Promise<void> {
    // Verify account belongs to user
    await this.findOneByUser(userId, accountId);

    // Soft delete by marking as inactive
    await this.prisma.account.update({
      where: { id: accountId },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });
  }

  async updateBalance(accountId: string, balance: number): Promise<Account> {
    return this.prisma.account.update({
      where: { id: accountId },
      data: {
        balance,
        updatedAt: new Date(),
      },
    });
  }

  async updateLastSync(accountId: string): Promise<Account> {
    return this.prisma.account.update({
      where: { id: accountId },
      data: {
        lastSyncAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async getTransactions(
    userId: string,
    accountId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    } = {},
  ) {
    // Verify account belongs to user
    await this.findOneByUser(userId, accountId);

    const { startDate, endDate, limit = 50, offset = 0 } = options;

    const where: Prisma.TransactionWhereInput = {
      accountId,
      userId,
      ...(startDate && { date: { gte: startDate } }),
      ...(endDate && { date: { lte: endDate } }),
    };

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        take: limit,
        skip: offset,
        include: {
          category: true,
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      transactions,
      total,
      limit,
      offset,
    };
  }

  async findByProvider(
    userId: string,
    provider: string,
    providerAccountId: string,
  ): Promise<Account | null> {
    return this.prisma.account.findFirst({
      where: {
        userId,
        provider,
        providerAccountId,
      },
    });
  }

  async getActiveAccountsForSync(): Promise<Account[]> {
    return this.prisma.account.findMany({
      where: {
        isActive: true,
        provider: {
          not: 'manual',
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }
}