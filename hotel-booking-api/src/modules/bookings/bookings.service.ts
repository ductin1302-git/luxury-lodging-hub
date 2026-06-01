import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { NotificationsService } from '../notifications/notifications.service';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateBookingStatusDto, UpdatePaymentStatusDto } from './dto/update-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly aiService: AiService,
  ) {}

  private async ensureReviewMediaTable(client: { $executeRawUnsafe: (query: string, ...values: any[]) => Promise<unknown> }) {
    await client.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS review_media (
        id BIGSERIAL PRIMARY KEY,
        review_id VARCHAR(100) NOT NULL,
        url TEXT NOT NULL,
        media_type VARCHAR(20) NOT NULL DEFAULT 'image',
        sort_order INT NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await client.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_review_media_review ON review_media(review_id)');
    try {
      await client.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'review_media_review_id_fkey'
          ) THEN
            ALTER TABLE review_media
            ADD CONSTRAINT review_media_review_id_fkey
            FOREIGN KEY (review_id) REFERENCES reviews(id)
            ON DELETE CASCADE ON UPDATE NO ACTION;
          END IF;
        END $$;
      `);
    } catch (error: any) {
      console.warn('Could not attach review_media foreign key:', error?.message || error);
    }
  }

  private persistReviewDataUrl(dataUrl: string, expectedType: 'image' | 'video', maxBytes: number) {
    const match = dataUrl.match(/^data:(image|video)\/([a-z0-9.+-]+);base64,(.+)$/i);

    if (!match || match[1] !== expectedType) {
      throw new BadRequestException(expectedType === 'image' ? 'File ảnh không hợp lệ.' : 'File video không hợp lệ.');
    }

    const mimeType = `${match[1]}/${match[2].toLowerCase()}`;
    const extensionByMime: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'video/quicktime': 'mov',
    };
    const extension = extensionByMime[mimeType];

    if (!extension) {
      throw new BadRequestException(expectedType === 'image' ? 'Định dạng ảnh chưa được hỗ trợ.' : 'Định dạng video chưa được hỗ trợ.');
    }

    const buffer = Buffer.from(match[3], 'base64');
    if (buffer.length > maxBytes) {
      throw new BadRequestException(expectedType === 'image' ? 'Mỗi ảnh cần nhỏ hơn 3MB.' : 'Video cần nhỏ hơn 10MB.');
    }

    const uploadDir = join(process.cwd(), 'uploads', 'reviews');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `review-${Date.now()}-${randomUUID()}.${extension}`;
    writeFileSync(join(uploadDir, filename), buffer);

    return `/uploads/reviews/${filename}`;
  }

  private normalizeReviewMedia(
    items: unknown,
    expectedType: 'image' | 'video',
    maxItems: number,
    maxBytes: number,
  ) {
    if (!Array.isArray(items)) return [];

    return items
      .filter((item) => typeof item === 'string' && item.trim() !== '')
      .slice(0, maxItems)
      .map((item) => {
        const value = String(item).trim();
        if (value.startsWith('data:')) {
          return this.persistReviewDataUrl(value, expectedType, maxBytes);
        }
        return value;
      });
  }

  private async saveReviewMedia(
    client: any,
    reviewId: string,
    images: string[],
    videos: string[],
  ) {
    const mediaItems = [
      ...images.map((url, index) => ({ url, type: 'image', sortOrder: index + 1 })),
      ...videos.map((url, index) => ({ url, type: 'video', sortOrder: images.length + index + 1 })),
    ];

    if (!mediaItems.length) return;

    try {
      await this.ensureReviewMediaTable(client);
      await client.reviewMedia.createMany({
        data: mediaItems.map((item) => ({
          reviewId,
          url: item.url,
          mediaType: item.type,
          sortOrder: item.sortOrder,
        })),
      });
    } catch (error: any) {
      console.warn(`Could not save review media for ${reviewId}:`, error?.message || error);
      throw new BadRequestException('Không thể lưu ảnh hoặc video đánh giá. Vui lòng thử lại.');
    }
  }

  private async replaceReviewMedia(
    client: any,
    reviewId: string,
    images: string[],
    videos: string[],
  ) {
    try {
      await this.ensureReviewMediaTable(client);
      await client.reviewMedia.deleteMany({ where: { reviewId } });
    } catch (error: any) {
      console.warn(`Could not clear review media for ${reviewId}:`, error?.message || error);
      throw new BadRequestException('Không thể cập nhật ảnh hoặc video đánh giá. Vui lòng thử lại.');
    }

    await this.saveReviewMedia(client, reviewId, images, videos);
  }

  private getTodayStart(value?: Date) {
    const date = value ? new Date(value) : new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private calculatePromotionDiscount(promotion: any, subtotal: number) {
    const rawValue = Number(promotion?.discountValue || 0);
    const isPercentDiscount = promotion?.discountType === 'percent' && rawValue <= 100;
    const discount = isPercentDiscount ? Math.round((subtotal * rawValue) / 100) : Math.round(rawValue);
    const maxDiscount = promotion?.maxDiscountAmount ? Number(promotion.maxDiscountAmount) : null;

    return Math.min(subtotal, Math.max(0, maxDiscount ? Math.min(discount, maxDiscount) : discount));
  }

  private validatePromotionForBooking(promotion: any, subtotal: number, hotelId: string, roomId: string) {
    if (!promotion || !promotion.isActive) {
      throw new BadRequestException('Ma voucher khong hop le hoac da het han.');
    }

    const today = this.getTodayStart().getTime();
    const startTime = promotion.startDate ? this.getTodayStart(promotion.startDate).getTime() : null;
    const endTime = promotion.endDate ? this.getTodayStart(promotion.endDate).getTime() : null;

    if ((startTime !== null && startTime > today) || (endTime !== null && endTime < today)) {
      throw new BadRequestException('Ma voucher khong nam trong thoi gian ap dung.');
    }

    if (promotion.usageLimit && Number(promotion.usedCount || 0) >= Number(promotion.usageLimit)) {
      throw new BadRequestException('Ma voucher da het luot su dung.');
    }

    if (promotion.minOrderAmount && subtotal < Number(promotion.minOrderAmount)) {
      throw new BadRequestException(`Don hang can toi thieu ${Number(promotion.minOrderAmount).toLocaleString('vi-VN')} VND de dung voucher nay.`);
    }

    const scopedHotels = promotion.promotion_hotels || [];
    const scopedRooms = promotion.promotion_rooms || [];

    if (scopedHotels.length && !scopedHotels.some((item: any) => item.hotelId === hotelId)) {
      throw new BadRequestException('Voucher nay khong ap dung cho khach san da chon.');
    }

    if (scopedRooms.length && !scopedRooms.some((item: any) => item.roomId === roomId)) {
      throw new BadRequestException('Voucher nay khong ap dung cho phong da chon.');
    }
  }

  async create(userId: string, dto: CreateBookingDto) {
    const createdBooking = await this.prisma
      .$transaction(async (tx) => {
        const room = await tx.room.findUnique({
          where: { id: dto.roomId },
          include: { hotel: true },
        });

        if (!room) {
          throw new BadRequestException('Phong khong ton tai.');
        }

        const checkIn = new Date(dto.checkIn);
        const checkOut = new Date(dto.checkOut);

        if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime()) || checkOut <= checkIn) {
          throw new BadRequestException('Ngay nhan phong va tra phong khong hop le.');
        }

        if (dto.guests > room.maxGuests * dto.roomsCount) {
          throw new BadRequestException(
            `Loai phong nay chi phu hop toi da ${room.maxGuests} khach moi phong.`,
          );
        }

        const overlappingBookings = await tx.bookingItem.findMany({
          where: {
            roomId: dto.roomId,
            booking: {
              status: { not: 'cancelled' },
              checkIn: { lt: checkOut },
              checkOut: { gt: checkIn },
            },
          },
          select: { roomsCount: true },
        });
        const reservedUnits = overlappingBookings.reduce(
          (sum, item) => sum + Number(item.roomsCount || 0),
          0,
        );
        const availableUnits = Number(room.quantityAvailable || 0) - reservedUnits;

        if (availableUnits < dto.roomsCount) {
          throw new BadRequestException(
            availableUnits <= 0
              ? 'Phong nay hien da het. Vui long chon loai phong khac.'
              : `Chi con ${availableUnits} phong trong cho khoang ngay ban chon.`,
          );
        }

        const bookingId = `BK-${randomUUID()}`;
        const bookingCode = `LUX-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        const requestedPaymentMethod = dto.paymentMethod.replace(/-/g, '_');
        const sanitizedPaymentMethod =
          requestedPaymentMethod === 'momo' ? 'ewallet' : requestedPaymentMethod;
        const waitsForGateway = sanitizedPaymentMethod === 'ewallet';
        const initialPaymentStatus =
          sanitizedPaymentMethod === 'pay_at_hotel' || waitsForGateway ? 'pending' : 'paid';
        const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000));
        const unitPrice = Number(room.salePrice || room.price || 0);
        const subtotal = unitPrice * nights * dto.roomsCount;
        const tax = Math.round(subtotal * 0.1);
        const promoCode = dto.promoCode?.trim();
        const promotion = promoCode
          ? await tx.promotion.findFirst({
              where: { code: { equals: promoCode, mode: 'insensitive' } },
              include: {
                promotion_hotels: true,
                promotion_rooms: true,
              },
            })
          : null;

        if (promoCode) {
          this.validatePromotionForBooking(promotion, subtotal, dto.hotelId, dto.roomId);
        }

        const discount = promotion ? this.calculatePromotionDiscount(promotion, subtotal) : 0;
        const total = Math.max(0, subtotal + tax - discount);

        if (promotion) {
          await tx.promotion.update({
            where: { id: promotion.id },
            data: { usedCount: { increment: 1 } },
          });
        }

        return tx.booking.create({
          data: {
            id: bookingId,
            bookingCode,
            userId,
            hotelId: dto.hotelId,
            promotionId: promotion?.id || null,
            hotelNameSnapshot: room.hotel.name,
            checkIn,
            checkOut,
            nights,
            guestName: dto.guestName,
            guestEmail: dto.guestEmail,
            guestPhone: dto.guestPhone,
            guests: dto.guests,
            roomsCount: dto.roomsCount,
            subtotal,
            tax,
            discount,
            total,
            paymentMethod: sanitizedPaymentMethod as any,
            status: waitsForGateway ? ('pending' as any) : ('confirmed' as any),
            paymentStatus: initialPaymentStatus as any,
            payment:
              sanitizedPaymentMethod === 'pay_at_hotel'
                ? undefined
                : {
                    create: {
                      paymentMethod: sanitizedPaymentMethod as any,
                      paymentStatus: initialPaymentStatus as any,
                      amount: waitsForGateway ? 0 : total,
                    },
                  },
            items: {
              create: [
                {
                  roomId: dto.roomId,
                  roomNameSnapshot: room.name,
                  roomPriceSnapshot: unitPrice,
                  roomsCount: dto.roomsCount,
                  guestsPerRoom: Math.ceil(dto.guests / dto.roomsCount),
                  nights,
                  lineSubtotal: subtotal,
                },
              ],
            },
          },
          include: {
            user: { select: { id: true, fullName: true, email: true, phone: true } },
            hotel: { select: { id: true, name: true, images: true } },
            promotion: true,
            payment: true,
            items: {
              include: {
                room: { select: { id: true, name: true } },
              },
            },
          },
        });
      })
      .catch((error) => {
        console.error('Create booking error:', error);
        if (error instanceof BadRequestException) throw error;
        throw new Error(`Loi he thong khi tao dat phong: ${error.message}`);
      });

    await this.dispatchNotification('notify booking created for user', () =>
      this.notificationsService.notifyBookingCreatedForUser(createdBooking),
    );
    await this.dispatchNotification('notify booking created for admins', () =>
      this.notificationsService.notifyBookingCreatedForAdmins(createdBooking),
    );

    return createdBooking;
  }

  async findAll(filters?: {
    status?: string;
    paymentStatus?: string;
    paymentMethod?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.status && filters.status !== 'all') {
      where.status = filters.status;
    }
    if (filters?.paymentStatus && filters.paymentStatus !== 'all') {
      where.paymentStatus = filters.paymentStatus;
    }
    if (filters?.paymentMethod && filters.paymentMethod !== 'all') {
      where.paymentMethod = filters.paymentMethod;
    }
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }
    if (filters?.search) {
      where.OR = [
        { bookingCode: { contains: filters.search, mode: 'insensitive' } },
        { guestName: { contains: filters.search, mode: 'insensitive' } },
        { guestEmail: { contains: filters.search, mode: 'insensitive' } },
        { guestPhone: { contains: filters.search } },
        { hotelNameSnapshot: { contains: filters.search, mode: 'insensitive' } },
        { transactionId: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.booking.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        hotel: { select: { id: true, name: true } },
        promotion: true,
        payment: true,
        items: {
          include: {
            room: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        hotel: { select: { id: true, name: true, images: true } },
        promotion: true,
        payment: true,
        items: {
          include: {
            room: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id, userId },
      include: {
        hotel: { select: { id: true, name: true, images: true } },
        promotion: true,
        payment: true,
        items: {
          include: {
            room: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!booking) throw new BadRequestException('Booking not found');
    return booking;
  }

  async createReview(userId: string, bookingId: string, dto: CreateReviewDto) {
    const rating = Number(dto.rating);
    const comment = String(dto.comment || '').trim();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException('Vui long chon diem danh gia tu 1 den 5 sao.');
    }

    if (comment.length < 10) {
      throw new BadRequestException('Vui long chia se nhan xet toi thieu 10 ky tu.');
    }

    await this.aiService.assertTextAllowed(comment, 'vi');

    const images = this.normalizeReviewMedia(dto.images, 'image', 3, 3 * 1024 * 1024);
    const videos = this.normalizeReviewMedia(dto.videos, 'video', 1, 10 * 1024 * 1024);

    const review = await this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findFirst({
        where: { id: bookingId, userId },
        include: {
          hotel: { select: { id: true, name: true } },
        },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      if (booking.status === 'cancelled') {
        throw new BadRequestException('Don da huy khong the danh gia.');
      }

      const stayCompleted =
        booking.status === 'checked_out' ||
        (booking.checkOut && new Date(booking.checkOut).getTime() <= Date.now());

      if (!stayCompleted) {
        throw new BadRequestException('Chi co the danh gia sau khi hoan tat ky luu tru.');
      }

      const reviewId = `RV-${booking.id}`;
      const existingBookingReview = await tx.review.findUnique({
        where: { id: reviewId },
      });

      const user = await tx.appUser.findUnique({
        where: { id: userId },
        select: { fullName: true, avatar: true },
      });
      const reviewerName = user?.fullName || booking.guestName || 'Luxury Stay guest';
      const reviewerInitial = reviewerName.trim().slice(0, 1).toUpperCase() || 'G';
      const reviewerAvatar =
        user?.avatar && user.avatar.length <= 20 && !user.avatar.startsWith('http')
          ? user.avatar
          : reviewerInitial;

      const savedReview = existingBookingReview
        ? await tx.review.update({
            where: { id: reviewId },
            data: {
              userName: reviewerName,
              avatar: reviewerAvatar,
              rating,
              comment,
              reviewDate: new Date(),
              isVisible: true,
            },
          })
        : await tx.review.create({
            data: {
              id: reviewId,
              hotelId: booking.hotelId,
              userId,
              userName: reviewerName,
              avatar: reviewerAvatar,
              rating,
              comment,
              reviewDate: new Date(),
            },
          });

      if (existingBookingReview) {
        await this.replaceReviewMedia(tx, reviewId, images, videos);
      } else {
        await this.saveReviewMedia(tx, reviewId, images, videos);
      }

      const aggregate = await tx.review.aggregate({
        where: {
          hotelId: booking.hotelId,
          isVisible: true,
        },
        _avg: { rating: true },
        _count: { _all: true },
      });

      const nextRating = Number((aggregate._avg.rating || rating).toFixed(1));

      await tx.hotel.update({
        where: { id: booking.hotelId },
        data: {
          rating: nextRating,
          reviewCount: aggregate._count._all,
          updatedAt: new Date(),
        },
      });

      return {
        ...savedReview,
        bookingId: booking.id,
        hotelName: booking.hotel.name,
        images,
        videos,
      };
    });

    return review;
  }

  async findOneAdmin(id: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        hotel: { select: { id: true, name: true } },
        promotion: true,
        payment: true,
        items: {
          include: {
            room: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async updateBookingStatus(id: string, dto: UpdateBookingStatusDto) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');

    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        status: dto.status as any,
        adminNote: dto.note,
        updatedAt: new Date(),
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        hotel: { select: { id: true, name: true } },
        promotion: true,
        payment: true,
        items: {
          include: {
            room: { select: { id: true, name: true } },
          },
        },
      },
    });

    await this.dispatchNotification('notify booking status changed', () =>
      this.notificationsService.notifyBookingStatusChangedForUser(updated),
    );

    return updated;
  }

  async updatePaymentStatus(id: string, dto: UpdatePaymentStatusDto) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.payment.upsert({
        where: { bookingId: id },
        create: {
          bookingId: id,
          paymentMethod: booking.paymentMethod,
          paymentStatus: dto.paymentStatus as any,
          amount: dto.paymentStatus === 'paid' ? booking.total : 0,
          transactionId: dto.transactionId,
          paidAt: dto.paymentStatus === 'paid' ? new Date() : undefined,
        },
        update: {
          paymentStatus: dto.paymentStatus as any,
          transactionId: dto.transactionId,
          paidAt: dto.paymentStatus === 'paid' ? new Date() : undefined,
        },
      });

      return tx.booking.update({
        where: { id },
        data: {
          paymentStatus: dto.paymentStatus as any,
          transactionId: dto.transactionId,
          adminNote: dto.note,
          updatedAt: new Date(),
        },
        include: {
          user: { select: { id: true, fullName: true, email: true, phone: true } },
          hotel: { select: { id: true, name: true } },
          promotion: true,
          payment: true,
          items: {
            include: {
              room: { select: { id: true, name: true } },
            },
          },
        },
      });
    });

    await this.dispatchNotification('notify payment status changed for user', () =>
      this.notificationsService.notifyPaymentStatusChangedForUser(updated),
    );
    await this.dispatchNotification('notify payment status changed for admins', () =>
      this.notificationsService.notifyPaymentStatusChangedForAdmins(updated),
    );

    return updated;
  }

  async cancelBooking(id: string, note?: string) {
    const cancelledBooking = await this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id },
        include: {
          items: true,
          user: { select: { id: true, fullName: true, email: true, phone: true } },
          hotel: { select: { id: true, name: true } },
          payment: true,
        },
      });

      if (!booking) throw new NotFoundException('Booking not found');
      if (booking.status === 'cancelled') {
        throw new BadRequestException('Booking da duoc huy truoc do.');
      }

      const nextPaymentStatus = booking.paymentStatus === 'paid' ? 'refunded' : booking.paymentStatus;

      return tx.booking.update({
        where: { id },
        data: {
          status: 'cancelled' as any,
          paymentStatus: nextPaymentStatus as any,
          adminNote: note || 'Huy boi admin',
          updatedAt: new Date(),
        },
        include: {
          user: { select: { id: true, fullName: true, email: true, phone: true } },
          hotel: { select: { id: true, name: true } },
          payment: true,
          items: {
            include: {
              room: { select: { id: true, name: true } },
            },
          },
        },
      });
    });

    await this.dispatchNotification('notify booking cancelled', () =>
      this.notificationsService.notifyBookingStatusChangedForUser(cancelledBooking),
    );

    if (cancelledBooking.paymentStatus === 'refunded') {
      await this.dispatchNotification('notify refund after cancellation for user', () =>
        this.notificationsService.notifyPaymentStatusChangedForUser(cancelledBooking),
      );
      await this.dispatchNotification('notify refund after cancellation for admins', () =>
        this.notificationsService.notifyPaymentStatusChangedForAdmins(cancelledBooking),
      );
    }

    return cancelledBooking;
  }

  async getStats() {
    const [total, confirmed, cancelled, pending, revenue] = await Promise.all([
      this.prisma.booking.count(),
      this.prisma.booking.count({ where: { status: 'confirmed' } }),
      this.prisma.booking.count({ where: { status: 'cancelled' } }),
      this.prisma.booking.count({ where: { status: 'pending' } }),
      this.prisma.booking.aggregate({
        _sum: { total: true },
        where: { status: { not: 'cancelled' } },
      }),
    ]);

    return {
      total,
      confirmed,
      cancelled,
      pending,
      revenue: revenue._sum.total || 0,
    };
  }

  private async dispatchNotification(label: string, task: () => Promise<unknown>) {
    try {
      await task();
    } catch (error) {
      console.error(`[Notifications] ${label} failed`, error);
    }
  }
}
