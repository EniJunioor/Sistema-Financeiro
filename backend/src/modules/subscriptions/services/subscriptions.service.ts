import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateSubscriptionDto, UpdateSubscriptionDto, SubscriptionFiltersDto } from '../dto';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSubscriptionDto: CreateSubscriptionDto, userId: string) {
    // Validate account if provided
    if (createSubscriptionDto.accountId) {
      const account = await this.prisma.account.findFirst({
        where: {
          id: createSubscriptionDto.accountId,
          userId,
        },
      });
      if (!account) {
        throw new NotFoundException('Account not found');
      }
    }

    // Validate category if provided
    if (createSubscriptionDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: createSubscriptionDto.categoryId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    const subscription = await this.prisma.subscription.create({
      data: {
        ...createSubscriptionDto,
        userId,
        nextPaymentDate: new Date(createSubscriptionDto.nextPaymentDate),
        startDate: createSubscriptionDto.startDate
          ? new Date(createSubscriptionDto.startDate)
          : new Date(),
        endDate: createSubscriptionDto.endDate
          ? new Date(createSubscriptionDto.endDate)
          : null,
      },
      include: {
        account: true,
      },
    });

    return subscription;
  }

  async findAll(userId: string, filters?: SubscriptionFiltersDto) {
    const where: any = {
      userId,
    };

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.accountId) {
      where.accountId = filters.accountId;
    }

    const subscriptions = await this.prisma.subscription.findMany({
      where,
      include: {
        account: true,
      },
      orderBy: {
        nextPaymentDate: 'asc',
      },
    });

    return subscriptions;
  }

  async findOne(id: string, userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        account: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  async update(id: string, updateSubscriptionDto: UpdateSubscriptionDto, userId: string) {
    const subscription = await this.findOne(id, userId);

    // Validate account if provided
    if (updateSubscriptionDto.accountId) {
      const account = await this.prisma.account.findFirst({
        where: {
          id: updateSubscriptionDto.accountId,
          userId,
        },
      });
      if (!account) {
        throw new NotFoundException('Account not found');
      }
    }

    // Validate category if provided
    if (updateSubscriptionDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateSubscriptionDto.categoryId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    const updated = await this.prisma.subscription.update({
      where: { id },
      data: {
        ...updateSubscriptionDto,
        nextPaymentDate: updateSubscriptionDto.nextPaymentDate
          ? new Date(updateSubscriptionDto.nextPaymentDate)
          : undefined,
        endDate: updateSubscriptionDto.endDate
          ? new Date(updateSubscriptionDto.endDate)
          : undefined,
      },
      include: {
        account: true,
      },
    });

    return updated;
  }

  async remove(id: string, userId: string) {
    const subscription = await this.findOne(id, userId);

    await this.prisma.subscription.delete({
      where: { id },
    });

    return { message: 'Subscription deleted successfully' };
  }

  async getUpcoming(userId: string, days: number = 30) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        userId,
        isActive: true,
        nextPaymentDate: {
          lte: endDate,
          gte: new Date(),
        },
      },
      include: {
        account: true,
      },
      orderBy: {
        nextPaymentDate: 'asc',
      },
    });

    return subscriptions;
  }
}
