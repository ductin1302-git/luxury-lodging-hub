import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryHotelsDto } from './dto/query-hotels.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class HotelsService {
  constructor(private readonly prisma: PrismaService) {}

  private buildCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  private buildSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-') + '-' + Math.random().toString(36).substring(2, 7);
  }

  private cleanImageUrls(images?: string[]) {
    return Array.isArray(images)
      ? images.filter((url) => typeof url === 'string' && url.trim() !== '').map((url) => url.trim())
      : [];
  }

  private buildRoomImagePayload(roomId: string, images: string[]) {
    return images.map((url, index) => ({
      roomId,
      url,
      isCover: index === 0,
      sortOrder: index + 1,
      altText: null,
    }));
  }

  private async replaceRoomImages(roomId: string, images: string[]) {
    try {
      await this.prisma.roomImage.deleteMany({ where: { roomId } });

      if (images.length) {
        await this.prisma.roomImage.createMany({
          data: this.buildRoomImagePayload(roomId, images),
        });
      }
    } catch (error: any) {
      console.warn(`Could not sync room images for ${roomId}:`, error?.message || error);
    }
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

  async create(dto: CreateHotelDto) {
    try {
      console.log('Creating hotel with DTO:', dto);
      
      const cleanImages = (dto.images || []).filter(url => !!url);
      const cleanAmenities = (dto.amenities || []).filter(name => !!name);

      const hotel = await this.prisma.hotel.create({
        data: {
          id: randomUUID(),
          code: this.buildCode(),
          slug: this.buildSlug(dto.name),
          name: dto.name,
          location: dto.location,
          city: dto.city,
          stars: dto.stars,
          description: dto.description,
          shortDescription: dto.shortDescription || '',
          pricePerNight: dto.pricePerNight,
          popular: dto.popular ?? false,
          promoted: dto.promoted ?? false,
          country: 'Việt Nam',
          hotelType: 'hotel',
          status: 'published',
          // Set standard defaults for missing fields to avoid DB constraint issues
          addressLine: '',
          district: dto.district || '',
          ward: dto.ward || '',
          postalCode: '',
          contactPhone: '',
          contactEmail: '',
          isFeatured: false,
          isActive: true,
          seoTitle: dto.name,
          seoDescription: dto.shortDescription || '',
          images: cleanImages.length ? {
            create: cleanImages.map((url, index) => ({ 
              url,
              isCover: index === 0,
              sortOrder: index + 1,
              altText: dto.name
            })),
          } : undefined,
          amenities: cleanAmenities.length ? {
            create: cleanAmenities.map(name => ({
              amenity: {
                connectOrCreate: {
                  where: { name },
                  create: { name, scope: 'hotel' }
                }
              }
            })),
          } : undefined,
        },
        include: {
          images: true,
          amenities: {
            include: {
              amenity: true
            }
          }
        }
      });
      
      const response = {
        ...hotel,
        amenities: hotel.amenities.map(ha => ha.amenity)
      };

      return JSON.parse(JSON.stringify(response));
    } catch (error: any) {
      console.error('Error in HotelsService.create:', error);
      try {
        const fs = require('fs');
        fs.appendFileSync('create-hotel-error.log', `\n[${new Date().toISOString()}] ${error.message}\n${error.stack}\n`);
      } catch (e) {}
      throw error;
    }
  }

  async update(id: string, dto: UpdateHotelDto) {
    const hotel = await this.prisma.hotel.findUnique({ 
      where: { id },
      include: { images: true, amenities: true }
    });
    
    if (!hotel) {
      throw new NotFoundException('Khách sạn không tồn tại');
    }

    return this.prisma.hotel.update({
      where: { id },
      data: {
        name: dto.name,
        location: dto.location,
        city: dto.city,
        stars: dto.stars,
        description: dto.description,
        shortDescription: dto.shortDescription,
        pricePerNight: dto.pricePerNight,
        popular: dto.popular,
        promoted: dto.promoted,
        district: dto.district,
        ward: dto.ward,
        images: dto.images ? {
          deleteMany: {},
          create: dto.images.map(url => ({ url })),
        } : undefined,
        amenities: dto.amenities ? {
          deleteMany: {},
          create: dto.amenities.map(name => ({
            amenity: {
              connectOrCreate: {
                where: { name },
                create: { name }
              }
            }
          }))
        } : undefined,
      },
    });
  }

  async remove(id: string) {
    const hotel = await this.prisma.hotel.findUnique({ where: { id } });
    if (!hotel) {
      throw new NotFoundException('Khách sạn không tồn tại');
    }

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      await tx.room.updateMany({
        where: { hotelId: id },
        data: {
          isActive: false,
          status: 'inactive',
          updatedAt: now,
        },
      });

      const archivedHotel = await tx.hotel.update({
        where: { id },
        data: {
          isActive: false,
          status: 'archived',
          deletedAt: now,
          updatedAt: now,
        },
        include: {
          images: {
            orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }],
          },
          amenities: {
            include: {
              amenity: true,
            },
          },
          rooms: true,
        },
      });

      return {
        ...archivedHotel,
        deleted: true,
        message: 'Khách sạn đã được ẩn khỏi hệ thống, dữ liệu booking vẫn được giữ lại.',
        amenities: archivedHotel.amenities.map((ha) => ha.amenity),
      };
    });
  }

  async findAllAdmin(query: QueryHotelsDto = {}) {
    const where: Record<string, any> = {
      deletedAt: null,
    };

    if (query.q) {
      const tokens = query.q.trim().split(/\s+/).filter(Boolean);
      const searchConditions = tokens.map(token => ({
        OR: [
          { name: { contains: token, mode: 'insensitive' } },
          { city: { contains: token, mode: 'insensitive' } },
          { district: { contains: token, mode: 'insensitive' } },
          { location: { contains: token, mode: 'insensitive' } },
          { shortDescription: { contains: token, mode: 'insensitive' } },
        ]
      }));
      where.AND = [
        ...(where.AND || []),
        ...searchConditions
      ];
    }

    if (query.city) {
      where.city = { contains: query.city, mode: 'insensitive' };
    }

    if (query.hotelType) {
      where.hotelType = query.hotelType;
    }

    if (query.stars) {
      where.stars = query.stars;
    }

    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const skip = (page - 1) * limit;

    const [hotels, total] = await Promise.all([
      this.prisma.hotel.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }],
        include: {
          images: {
            orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }],
          },
          amenities: {
            include: {
              amenity: true,
            },
          },
          rooms: {
            orderBy: [{ createdAt: 'desc' }],
            include: {
              images: {
                orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }],
              },
            },
          },
        },
      }),
      this.prisma.hotel.count({ where }),
    ]);

    return {
      data: hotels.map((hotel) => ({
        ...hotel,
        amenities: hotel.amenities.map((ha) => ha.amenity),
        availableRoomCount: hotel.rooms.filter((room) => room.isActive && room.status === 'active').length,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAll(query: QueryHotelsDto) {
    const where: Record<string, any> = {
      isActive: true,
      status: 'published',
      deletedAt: null,
    };

    if (query.q) {
      const tokens = query.q.trim().split(/\s+/).filter(Boolean);
      const searchConditions = tokens.map(token => ({
        OR: [
          { name: { contains: token, mode: 'insensitive' } },
          { city: { contains: token, mode: 'insensitive' } },
          { district: { contains: token, mode: 'insensitive' } },
          { location: { contains: token, mode: 'insensitive' } },
          { shortDescription: { contains: token, mode: 'insensitive' } },
        ]
      }));
      where.AND = [
        ...(where.AND || []),
        ...searchConditions
      ];
    }

    if (query.city) {
      where.city = { contains: query.city, mode: 'insensitive' };
    }

    if (query.hotelType) {
      where.hotelType = query.hotelType;
    }

    if (query.stars) {
      where.stars = query.stars;
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.pricePerNight = {};
      if (query.minPrice !== undefined) where.pricePerNight.gte = query.minPrice;
      if (query.maxPrice !== undefined) where.pricePerNight.lte = query.maxPrice;
    }

    const requestedAmenities = query.amenities
      ?.split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (requestedAmenities?.length) {
      where.AND = [
        ...(where.AND || []),
        ...requestedAmenities.map((name) => ({
          amenities: {
            some: {
              amenity: {
                name: { equals: name, mode: 'insensitive' },
              },
            },
          },
        })),
      ];
    }

    const parsedRooms = parseInt(query.rooms as any, 10);
    const requestedRooms = isNaN(parsedRooms) ? 1 : Math.max(1, parsedRooms);
    const parsedGuests = parseInt(query.guests as any, 10);
    const requestedGuests = isNaN(parsedGuests) ? 1 : Math.max(1, parsedGuests);
    const hasDateRange = Boolean(query.checkIn && query.checkOut);
    const checkIn = hasDateRange ? new Date(query.checkIn as string) : null;
    const checkOut = hasDateRange ? new Date(query.checkOut as string) : null;

    let orderBy: Record<string, any> = { popular: 'desc' };

    if (query.sort === 'price_asc') orderBy = { pricePerNight: 'asc' };
    if (query.sort === 'price_desc') orderBy = { pricePerNight: 'desc' };
    if (query.sort === 'rating_desc') orderBy = { rating: 'desc' };

    const hotels = await this.prisma.hotel.findMany({
      where,
      orderBy,
      include: {
        images: true,
        amenities: {
          include: {
            amenity: true
          }
        },
        rooms: {
          where: {
            isActive: true,
            status: 'active',
            maxGuests: { gte: Math.ceil(requestedGuests / requestedRooms) },
          },
          include: {
            bookingItems: hasDateRange
              ? {
                  where: {
                    booking: {
                      status: { not: 'cancelled' },
                      checkIn: { lt: checkOut as Date },
                      checkOut: { gt: checkIn as Date },
                    },
                  },
                  select: { 
                    roomsCount: true,
                    booking: { select: { checkIn: true, checkOut: true } }
                  },
                }
              : false,
          },
        },
      },
    });

    return hotels
      .map((hotel) => {
        const rooms = hotel.rooms.map((room: any) => {
          let reservedUnits = 0;
          if (hasDateRange && room.bookingItems) {
            for (let d = new Date(checkIn as Date); d < (checkOut as Date); d.setDate(d.getDate() + 1)) {
              let dailyReserved = 0;
              const dNorm = new Date(d);
              dNorm.setHours(0, 0, 0, 0);

              for (const item of room.bookingItems) {
                const bCheckIn = new Date(item.booking.checkIn);
                const bCheckOut = new Date(item.booking.checkOut);
                
                const bCheckInNorm = new Date(bCheckIn);
                bCheckInNorm.setHours(0, 0, 0, 0);
                
                const bCheckOutNorm = new Date(bCheckOut);
                bCheckOutNorm.setHours(0, 0, 0, 0);

                if (dNorm >= bCheckInNorm && dNorm < bCheckOutNorm) {
                  dailyReserved += Number(item.roomsCount || 0);
                }
              }
              if (dailyReserved > reservedUnits) {
                reservedUnits = dailyReserved;
              }
            }
          }
          const availableUnits = Math.max(0, Number(room.quantityAvailable || 0) - reservedUnits);
          const { bookingItems, ...publicRoom } = room;

          return {
            ...publicRoom,
            availableUnits,
            quantityAvailable: availableUnits,
          };
        });
        const availableRooms = rooms.filter((room: any) => room.availableUnits >= requestedRooms);
        const lowestAvailablePrice = availableRooms.reduce((lowest: number | null, room: any) => {
          const price = Number(room.salePrice || room.price || 0);
          if (!price) return lowest;
          return lowest === null ? price : Math.min(lowest, price);
        }, null);

        return {
          ...hotel,
          rooms: availableRooms,
          amenities: hotel.amenities.map(ha => ha.amenity),
          availableRoomCount: availableRooms.length,
          lowestAvailablePrice,
          pricePerNight: lowestAvailablePrice ?? hotel.pricePerNight,
        };
      })
      .filter((hotel) => hotel.rooms.length > 0);
  }

  async findOne(id: string, query: QueryHotelsDto = {}) {
    const parsedRooms = parseInt(query.rooms as any, 10);
    const requestedRooms = isNaN(parsedRooms) ? 1 : Math.max(1, parsedRooms);
    const parsedGuests = parseInt(query.guests as any, 10);
    const requestedGuests = isNaN(parsedGuests) ? 1 : Math.max(1, parsedGuests);
    const hasDateRange = Boolean(query.checkIn && query.checkOut);
    const checkIn = hasDateRange ? new Date(query.checkIn as string) : null;
    const checkOut = hasDateRange ? new Date(query.checkOut as string) : null;

    const hotel = await this.prisma.hotel.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        images: true,
        amenities: {
          include: {
            amenity: true
          }
        },
        rooms: {
          where: {
            isActive: true,
            status: 'active',
            maxGuests: { gte: Math.ceil(requestedGuests / requestedRooms) },
          },
          include: {
            amenities: {
              include: {
                amenity: true
              }
            },
            images: {
              orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }],
            },
            bookingItems: hasDateRange
              ? {
                  where: {
                    booking: {
                      status: { not: 'cancelled' },
                      checkIn: { lt: checkOut as Date },
                      checkOut: { gt: checkIn as Date },
                    },
                  },
                  select: { 
                    roomsCount: true,
                    booking: { select: { checkIn: true, checkOut: true } }
                  },
                }
              : false,
          },
        },
        reviews: {
          where: {
            isVisible: true,
          },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        policies: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    });

    if (!hotel) {
      throw new NotFoundException('Khách sạn không tồn tại');
    }

    const reviewMediaMap = await this.getReviewMediaMap(hotel.reviews.map((review) => review.id));

    // Flatten amenities
    return {
      ...hotel,
      amenities: hotel.amenities.map(ha => ha.amenity),
      reviews: hotel.reviews.map((review) => {
        const media = reviewMediaMap.get(review.id) || { images: [], videos: [] };
        return {
          ...review,
          bookingId: this.getBookingIdFromReviewId(review.id),
          avatar: review.user?.avatar || review.avatar,
          images: media.images,
          videos: media.videos,
        };
      }),
      rooms: hotel.rooms
        .map((room: any) => {
          let reservedUnits = 0;
          if (hasDateRange && room.bookingItems) {
            for (let d = new Date(checkIn as Date); d < (checkOut as Date); d.setDate(d.getDate() + 1)) {
              let dailyReserved = 0;
              for (const item of room.bookingItems) {
                const bCheckIn = new Date(item.booking.checkIn);
                const bCheckOut = new Date(item.booking.checkOut);
                if (d >= bCheckIn && d < bCheckOut) {
                  dailyReserved += Number(item.roomsCount || 0);
                }
              }
              if (dailyReserved > reservedUnits) {
                reservedUnits = dailyReserved;
              }
            }
          }
          const availableUnits = Math.max(0, Number(room.quantityAvailable || 0) - reservedUnits);
          const { bookingItems, ...publicRoom } = room;

          return {
            ...publicRoom,
            availableUnits,
            quantityAvailable: availableUnits,
            amenities: room.amenities.map((ra: any) => ra.amenity),
          };
        })
        .filter((room: any) => room.availableUnits >= requestedRooms)
    };
  }

  async createRoom(hotelId: string, dto: CreateRoomDto) {
    const hotel = await this.prisma.hotel.findUnique({
      where: { id: hotelId },
    });

    if (!hotel) {
      throw new NotFoundException('Khách sạn không tồn tại');
    }

    const validImages = this.cleanImageUrls(dto.images);

    const createdRoom = await this.prisma.room.create({
      data: {
        id: `ROOM-${randomUUID()}`,
        hotelId,
        code: `RM-${randomUUID().slice(0, 8).toUpperCase()}`,
        name: dto.name,
        image: dto.image || validImages[0] || null,
        maxGuests: Number(dto.maxGuests),
        price: Number(dto.price),
        description: dto.description || null,
        size: dto.size ? Number(dto.size) : null,
        quantityAvailable: dto.quantityAvailable !== undefined ? Number(dto.quantityAvailable) : 10,

      },
    });

    await this.replaceRoomImages(createdRoom.id, validImages);

    return {
      ...createdRoom,
      images: this.buildRoomImagePayload(createdRoom.id, validImages),
    };
  }

  async updateRoom(id: string, roomId: string, dto: UpdateRoomDto) {
    const room = await this.prisma.room.findFirst({
      where: { id: roomId, hotelId: id }
    });

    if (!room) {
      throw new NotFoundException('Phòng không tồn tại');
    }

    const validImages = this.cleanImageUrls(dto.images);

    const updatedRoom = await this.prisma.room.update({
      where: { id: roomId },
      data: {
        name: dto.name,
        image: dto.image || validImages[0] || undefined,
        maxGuests: dto.maxGuests,
        price: dto.price,
        description: dto.description,
        size: dto.size,
        quantityAvailable: dto.quantityAvailable !== undefined ? dto.quantityAvailable : undefined,
      },
    });

    if (Array.isArray(dto.images)) {
      await this.replaceRoomImages(roomId, validImages);
    }

    return {
      ...updatedRoom,
      images: this.buildRoomImagePayload(roomId, validImages),
    };
  }

  async removeRoom(id: string, roomId: string) {
    const room = await this.prisma.room.findFirst({
      where: { id: roomId, hotelId: id }
    });

    if (!room) {
      throw new NotFoundException('Phòng không tồn tại');
    }

    return this.prisma.room.update({
      where: { id: roomId },
      data: {
        isActive: false,
        status: 'inactive',
        updatedAt: new Date(),
      },
    });
  }
}
