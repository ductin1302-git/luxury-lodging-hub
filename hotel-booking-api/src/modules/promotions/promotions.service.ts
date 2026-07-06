import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  private getTodayStart(value?: Date) {
    const today = value ? new Date(value) : new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  private hasEnded(endDate: Date | null) {
    if (!endDate) return false;
    return this.getTodayStart(endDate).getTime() < this.getTodayStart().getTime();
  }

  private async cleanupExpiredPromotions() {
    const todayStart = this.getTodayStart();
    const deleteBefore = new Date(todayStart);
    deleteBefore.setDate(deleteBefore.getDate() - 7);

    await this.prisma.promotion.updateMany({
      where: {
        isActive: true,
        endDate: {
          lt: todayStart,
        },
      },
      data: {
        isActive: false,
      },
    });

    await this.prisma.promotion.deleteMany({
      where: {
        endDate: {
          lt: deleteBefore,
        },
        bookings: {
          none: {},
        },
      },
    });
  }

  async findAll(page: number = 1, limit: number = 10) {
    await this.cleanupExpiredPromotions();
    const skip = (page - 1) * limit;

    const [promotions, total] = await Promise.all([
      this.prisma.promotion.findMany({
        skip,
        take: limit,
        include: {
          promotion_hotels: true,
          promotion_rooms: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.promotion.count(),
    ]);

    return {
      data: promotions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(data: any) {
    await this.cleanupExpiredPromotions();

    const id = `PROMO_${Date.now()}`;
    const startDate = data.startDate ? new Date(data.startDate) : null;
    const endDate = data.endDate ? new Date(data.endDate) : null;
    
    return this.prisma.promotion.create({
      data: {
        id,
        code: data.code,
        title: data.title,
        description: data.description || '',
        discountType: data.discountType || 'percent',
        discountValue: Number(data.discountValue),
        minOrderAmount: data.minOrderAmount ? Number(data.minOrderAmount) : 0,
        maxDiscountAmount: data.maxDiscountAmount ? Number(data.maxDiscountAmount) : null,
        startDate,
        endDate,
        usageLimit: data.usageLimit ? Number(data.usageLimit) : null,
        isActive: this.hasEnded(endDate) ? false : data.isActive !== undefined ? Boolean(data.isActive) : true,
        usedCount: 0,
        imageUrl: data.imageUrl || null,
      }
    });
  }

  async update(id: string, data: any) {
    await this.cleanupExpiredPromotions();

    const existingPromotion = await this.prisma.promotion.findUnique({
      where: { id },
      select: { endDate: true },
    });

    const updateData: any = {};
    if (data.code !== undefined) updateData.code = data.code;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description || '';
    if (data.discountType !== undefined) updateData.discountType = data.discountType;
    if (data.discountValue !== undefined) updateData.discountValue = Number(data.discountValue);
    if (data.minOrderAmount !== undefined) updateData.minOrderAmount = data.minOrderAmount ? Number(data.minOrderAmount) : 0;
    if (data.maxDiscountAmount !== undefined) updateData.maxDiscountAmount = data.maxDiscountAmount ? Number(data.maxDiscountAmount) : null;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    const effectiveEndDate = data.endDate !== undefined
      ? data.endDate ? new Date(data.endDate) : null
      : existingPromotion?.endDate ?? null;
    if (data.endDate !== undefined) updateData.endDate = effectiveEndDate;
    if (data.usageLimit !== undefined) updateData.usageLimit = data.usageLimit ? Number(data.usageLimit) : null;
    if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);
    if (this.hasEnded(effectiveEndDate)) updateData.isActive = false;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl || null;

    return this.prisma.promotion.update({
      where: { id },
      data: updateData
    });
  }

  async remove(id: string) {
    return this.prisma.promotion.delete({
      where: { id }
    });
  }
}
