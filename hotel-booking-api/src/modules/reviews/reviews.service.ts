import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminReviewQueryDto } from './dto/admin-review-query.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  private numberFrom(value: string | undefined, fallback: number) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private async refreshHotelReviewStats(hotelId: string) {
    const aggregate = await this.prisma.review.aggregate({
      where: { hotelId, isVisible: true },
      _avg: { rating: true },
      _count: { _all: true },
    });

    await this.prisma.hotel.update({
      where: { id: hotelId },
      data: {
        rating: Number((aggregate._avg.rating || 0).toFixed(1)),
        reviewCount: aggregate._count._all,
        updatedAt: new Date(),
      },
    });
  }

  private async ensureReviewMediaTable() {
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS review_media (
        id BIGSERIAL PRIMARY KEY,
        review_id VARCHAR(100) NOT NULL,
        url TEXT NOT NULL,
        media_type VARCHAR(20) NOT NULL DEFAULT 'image',
        sort_order INT NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_review_media_review ON review_media(review_id)');
    try {
      await this.prisma.$executeRawUnsafe(`
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

  private getBookingIdFromReviewId(reviewId?: string | null) {
    return reviewId?.startsWith('RV-BK-') ? reviewId.slice(3) : null;
  }

  private async getReviewMediaMap(reviewIds: string[]) {
    const uniqueIds = Array.from(new Set(reviewIds.filter(Boolean)));
    if (!uniqueIds.length) return new Map<string, { images: string[]; videos: string[] }>();

    try {
      await this.ensureReviewMediaTable();
      const rows = await this.prisma.reviewMedia.findMany({
        where: {
          reviewId: { in: uniqueIds },
        },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      });

      return rows.reduce((map, row) => {
        const current = map.get(row.reviewId) || { images: [], videos: [] };
        if (row.mediaType === 'video') {
          current.videos.push(row.url);
        } else {
          current.images.push(row.url);
        }
        map.set(row.reviewId, current);
        return map;
      }, new Map<string, { images: string[]; videos: string[] }>());
    } catch {
      return new Map<string, { images: string[]; videos: string[] }>();
    }
  }

  private async deleteReviewMedia(reviewId: string) {
    try {
      await this.ensureReviewMediaTable();
      await this.prisma.reviewMedia.deleteMany({ where: { reviewId } });
    } catch {
      // Media table is created lazily when the first media review is saved.
    }
  }

  private buildWhere(query: AdminReviewQueryDto) {
    const where: Prisma.ReviewWhereInput = {};
    const search = query.q?.trim();

    if (query.status === 'visible') {
      where.isVisible = true;
    }

    if (query.status === 'hidden') {
      where.isVisible = false;
    }

    if (query.rating && query.rating !== 'all') {
      const rating = Number(query.rating);
      if (Number.isInteger(rating) && rating >= 1 && rating <= 5) {
        where.rating = rating;
      }
    }

    if (query.hotelId) {
      where.hotelId = query.hotelId;
    }

    if (query.dateFrom || query.dateTo) {
      where.reviewDate = {};
      if (query.dateFrom) {
        where.reviewDate.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        const endDate = new Date(query.dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.reviewDate.lte = endDate;
      }
    }

    if (search) {
      where.OR = [
        { userName: { contains: search, mode: 'insensitive' } },
        { comment: { contains: search, mode: 'insensitive' } },
        { hotel: { is: { name: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    return where;
  }

  private toReviewResponse(review: any, media: { images: string[]; videos: string[] } = { images: [], videos: [] }) {
    const hotelImage =
      Array.isArray(review.hotel?.images) && review.hotel.images.length
        ? review.hotel.images[0].url
        : null;

    return {
      id: review.id,
      bookingId: this.getBookingIdFromReviewId(review.id),
      hotelId: review.hotelId,
      hotelName: review.hotel?.name || 'Khách sạn',
      hotelCity: review.hotel?.city || '',
      hotelImage,
      userId: review.userId,
      userName: review.userName,
      userEmail: review.user?.email || null,
      avatar: review.user?.avatar || review.avatar,
      rating: review.rating,
      comment: review.comment,
      images: media.images,
      videos: media.videos,
      reviewDate: review.reviewDate,
      createdAt: review.createdAt,
      isVisible: review.isVisible,
    };
  }

  async findAllAdmin(query: AdminReviewQueryDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(5, query.limit || 12));
    const where = this.buildWhere(query);

    const [reviews, total, allStats, visibleCount, hiddenCount, lowRatingCount] =
      await this.prisma.$transaction([
        this.prisma.review.findMany({
          where,
          orderBy: [{ createdAt: 'desc' }, { reviewDate: 'desc' }],
          skip: (page - 1) * limit,
          take: limit,
          include: {
            hotel: {
              select: {
                id: true,
                name: true,
                city: true,
                images: {
                  orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }],
                  take: 1,
                },
              },
            },
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatar: true,
              },
            },
          },
        }),
        this.prisma.review.count({ where }),
        this.prisma.review.aggregate({
          _avg: { rating: true },
          _count: { _all: true },
        }),
        this.prisma.review.count({ where: { isVisible: true } }),
        this.prisma.review.count({ where: { isVisible: false } }),
        this.prisma.review.count({ where: { rating: { lte: 2 } } }),
      ]);

    const mediaMap = await this.getReviewMediaMap(reviews.map((review) => review.id));

    return {
      data: reviews.map((review) => this.toReviewResponse(review, mediaMap.get(review.id))),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      stats: {
        total: allStats._count._all,
        visible: visibleCount,
        hidden: hiddenCount,
        lowRating: lowRatingCount,
        averageRating: Number((allStats._avg.rating || 0).toFixed(1)),
      },
    };
  }

  async updateVisibility(id: string, isVisible: boolean) {
    const existingReview = await this.prisma.review.findUnique({
      where: { id },
      select: { hotelId: true },
    });

    if (!existingReview) {
      throw new NotFoundException('Không tìm thấy đánh giá.');
    }

    const review = await this.prisma.review.update({
      where: { id },
      data: { isVisible },
      include: {
        hotel: {
          select: {
            id: true,
            name: true,
            city: true,
            images: {
              orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }],
              take: 1,
            },
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    await this.refreshHotelReviewStats(existingReview.hotelId);

    const mediaMap = await this.getReviewMediaMap([review.id]);

    return this.toReviewResponse(review, mediaMap.get(review.id));
  }

  async remove(id: string) {
    const existingReview = await this.prisma.review.findUnique({
      where: { id },
      select: { hotelId: true },
    });

    if (!existingReview) {
      throw new NotFoundException('Không tìm thấy đánh giá.');
    }

    await this.deleteReviewMedia(id);
    await this.prisma.review.delete({ where: { id } });
    await this.refreshHotelReviewStats(existingReview.hotelId);

    return { success: true };
  }
}
