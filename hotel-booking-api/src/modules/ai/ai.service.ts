import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

type AppLanguage = 'vi' | 'en';

type ModerationResult = {
  allowed: boolean;
  flagged: boolean;
  source: 'openai' | 'local' | 'disabled';
  message: string;
  categories: string[];
};

type SupportHistoryMessage = {
  role: 'assistant' | 'user';
  content: string;
};

type SupportIntent = 'booking' | 'payment' | 'promotion' | 'contact' | 'hotel' | 'hotel_stats' | 'unknown';

@Injectable()
export class AiService {
  private readonly openAiBaseUrl = 'https://api.openai.com/v1';
  private readonly localBlockedPatterns = [
    /\b(dmm|dm|dit|du\s+(ma|me)|vai\s+lon|me\s+may|oc\s+cho|cho\s+chet)\b/i,
    /\b(fuck|fucking|shit|bitch|asshole|cunt|motherfucker)\b/i,
  ];
  private readonly localBlockedTerms = [
    '\u0111\u1ecbt',
    '\u0111\u1ee5',
    'l\u1ed3n',
    'c\u1eb7c',
    'bu\u1ed3i',
    '\u0111\u00e9o',
    'v\u00e3i l\u1ed3n',
    'm\u1eb9 m\u00e0y',
    '\u00f3c ch\u00f3',
    'ch\u00f3 ch\u1ebft',
  ];

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private get apiKey() {
    return this.configService.get<string>('OPENAI_API_KEY')?.trim();
  }

  private get chatModel() {
    return this.configService.get<string>('OPENAI_CHAT_MODEL')?.trim() || 'gpt-4.1-mini';
  }

  private get moderationModel() {
    return this.configService.get<string>('OPENAI_MODERATION_MODEL')?.trim() || 'omni-moderation-latest';
  }

  private getModerationMessage(language: AppLanguage) {
    return language === 'en'
      ? 'Your message contains offensive or unsafe language. Please rewrite it politely before sending.'
      : 'Nội dung có từ ngữ phản cảm hoặc không an toàn. Vui lòng viết lại lịch sự hơn trước khi gửi.';
  }

  private detectLocalProfanity(text: string) {
    const compactText = ` ${text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ')} `;
    const plainText = compactText.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0111/g, 'd');

    return (
      this.localBlockedTerms.some((term) => compactText.includes(` ${term} `)) ||
      this.localBlockedPatterns.some((pattern) => pattern.test(plainText))
    );
  }

  async moderateText(text: string, language: AppLanguage = 'vi'): Promise<ModerationResult> {
    const value = String(text || '').trim();
    if (!value) {
      return {
        allowed: true,
        flagged: false,
        source: 'disabled',
        message: '',
        categories: [],
      };
    }

    if (this.detectLocalProfanity(value)) {
      return {
        allowed: false,
        flagged: true,
        source: 'local',
        message: this.getModerationMessage(language),
        categories: ['offensive_language'],
      };
    }

    if (!this.apiKey) {
      return {
        allowed: true,
        flagged: false,
        source: 'disabled',
        message: '',
        categories: [],
      };
    }

    try {
      const response = await fetch(`${this.openAiBaseUrl}/moderations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.moderationModel,
          input: value,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI moderation failed with status ${response.status}`);
      }

      const data: any = await response.json();
      const result = data?.results?.[0] || {};
      const categories = Object.entries(result.categories || {})
        .filter(([, isFlagged]) => Boolean(isFlagged))
        .map(([category]) => category);

      return {
        allowed: !result.flagged,
        flagged: Boolean(result.flagged),
        source: 'openai',
        message: result.flagged ? this.getModerationMessage(language) : '',
        categories,
      };
    } catch (error) {
      console.warn('[AI] Moderation unavailable, using local filter only:', error);
      return {
        allowed: true,
        flagged: false,
        source: 'local',
        message: '',
        categories: [],
      };
    }
  }

  async assertTextAllowed(text: string, language: AppLanguage = 'vi') {
    const result = await this.moderateText(text, language);
    if (!result.allowed) {
      throw new BadRequestException({
        message: result.message,
        code: 'AI_MODERATION_BLOCKED',
        categories: result.categories,
      });
    }

    return result;
  }

  async createSupportReply(
    userId: string | null | undefined,
    message: string,
    language: AppLanguage = 'vi',
    pageUrl?: string,
    history: SupportHistoryMessage[] = [],
  ) {
    const trimmedMessage = String(message || '').trim();
    if (!trimmedMessage) {
      throw new BadRequestException(language === 'en' ? 'Please enter your question.' : 'Vui lòng nhập câu hỏi.');
    }

    await this.assertTextAllowed(trimmedMessage, language);

    const context = await this.buildSupportContext(userId, language, trimmedMessage);
    const normalizedQuestion = this.normalizeSearchText(trimmedMessage);
    const intent = this.detectSupportIntent(normalizedQuestion, context);
    if (!userId && !this.isGuestAllowedIntent(intent)) {
      return {
        answer: this.createGuestHotelOnlyAnswer(language),
        mode: 'database',
        moderation: 'local',
        intent,
        relatedHotels: [],
      };
    }

    const shouldAttachHotels = intent === 'hotel' && this.shouldAttachRelatedHotels(normalizedQuestion, context);
    const relatedHotels = this.selectRelatedHotels(trimmedMessage, context, 3, shouldAttachHotels);
    const databaseAnswer = this.createDatabaseSupportAnswer(language, trimmedMessage, context, relatedHotels, intent);
    const directIntent = intent !== 'hotel';

    if (!this.apiKey || directIntent) {
      return {
        answer: databaseAnswer,
        mode: 'database',
        moderation: 'local',
        intent,
        relatedHotels: shouldAttachHotels ? relatedHotels : [],
      };
    }

    try {
      const compactHistory = history
        .slice(-8)
        .map((item) => `${item.role === 'assistant' ? 'Assistant' : 'Customer'}: ${String(item.content || '').slice(0, 700)}`)
        .join('\n');

      const response = await fetch(`${this.openAiBaseUrl}/responses`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.chatModel,
          instructions: this.getSupportInstructions(language),
          input: [
            {
              role: 'user',
              content: [
                {
                  type: 'input_text',
                  text: [
                    `Current page: ${pageUrl || 'unknown'}`,
                    compactHistory ? `Recent conversation:\n${compactHistory}` : 'Recent conversation: none',
                    `Customer signed in: ${userId ? 'yes' : 'no'}`,
                    `User question: ${trimmedMessage}`,
                    `Detected intent: ${intent}`,
                    `Best matched hotels JSON: ${JSON.stringify(relatedHotels)}`,
                    `System context JSON: ${JSON.stringify(context)}`,
                  ].join('\n\n'),
                },
              ],
            },
          ],
          max_output_tokens: 700,
          store: false,
        }),
        signal: AbortSignal.timeout(25000),
      });

      if (!response.ok) {
        throw new Error(`OpenAI response failed with status ${response.status}`);
      }

      const data: any = await response.json();
      const answer = this.extractOutputText(data) || databaseAnswer;

      return {
        answer,
        mode: 'ai',
        moderation: 'openai',
        intent,
        relatedHotels,
      };
    } catch (error) {
      console.warn('[AI] Support response unavailable:', error);
      return {
        answer: databaseAnswer,
        mode: 'database',
        moderation: 'local',
        intent,
        relatedHotels: shouldAttachHotels ? relatedHotels : [],
      };
    }
  }

  private extractOutputText(data: any) {
    if (typeof data?.output_text === 'string' && data.output_text.trim()) {
      return data.output_text.trim();
    }

    const parts = Array.isArray(data?.output)
      ? data.output.flatMap((item: any) => (Array.isArray(item?.content) ? item.content : []))
      : [];

    return parts
      .filter((part: any) => part?.type === 'output_text' && typeof part.text === 'string')
      .map((part: any) => part.text)
      .join('\n')
      .trim();
  }

  private getSupportInstructions(language: AppLanguage) {
    if (language === 'en') {
      return [
        'You are Luxury Stay AI Support for a hotel booking website.',
        'Use the provided database context as your source of truth for hotels, rooms, promotions, reviews, contact support, payments, and the signed-in customer bookings.',
        'Protect privacy: only discuss the signed-in customer bookings from context. Never reveal other customers, internal admin notes, raw IDs unless helpful, or hidden data.',
        'If the customer is not signed in, answer only hotel, room, location, amenity, and public hotel detail questions. Ask them to sign in for booking, payment, voucher, profile, or account-specific questions.',
        'Answer only the user question. Do not add hotel recommendations, promotions, or next-step suggestions unless the user explicitly asks for them.',
        'If the detected intent is booking, payment, promotion, contact, or hotel_stats, answer that topic only and do not recommend hotels or rooms.',
        'Be concise, practical, friendly, and professional. Recommend specific hotels or rooms only when the user asks to find, compare, or view hotels. Do not invent availability, prices, vouchers, or booking details.',
        'Never ask for card numbers, passwords, OTPs, or API keys. For urgent booking changes, direct the customer to the hotline or contact page.',
      ].join('\n');
    }

    return [
      'Tra loi dung cau nguoi dung hoi. Khong tu y goi y khach san, uu dai hoac buoc tiep theo neu nguoi dung khong hoi.',
      'Neu khach chua dang nhap, chi tra loi cau hoi ve khach san, phong, vi tri, tien ich va chi tiet khach san cong khai. Cac cau hoi booking, thanh toan, voucher, ho so hoac rieng theo tai khoan thi yeu cau dang nhap.',
      'Neu intent la booking, thanh toan, voucher, lien he hoac hotel_stats, chi tra loi dung chu de do va khong goi y khach san/phong.',
      'Bạn là AI hỗ trợ của website đặt phòng Luxury Stay.',
      'Chỉ trả lời về khách sạn, phòng, ưu đãi, liên hệ hỗ trợ, thanh toán và các booking của khách đã đăng nhập có trong dữ liệu ngữ cảnh.',
      'Trả lời ngắn gọn, rõ ràng, thân thiện và chuyên nghiệp. Không bịa thông tin booking. Nếu không có booking trong ngữ cảnh, hướng dẫn khách đăng nhập hoặc gửi liên hệ.',
      'Không bao giờ hỏi số thẻ, mật khẩu, OTP hoặc API key. Với yêu cầu gấp về đổi/hủy booking, hướng dẫn gọi hotline hoặc vào trang liên hệ.',
    ].join('\n');
  }

  private async buildSupportContext(userId: string | null | undefined, language: AppLanguage, question = '') {
    const normalizedQuestion = this.normalizeSearchText(question);
    const includeHotelBookingStats = this.isHotelStatsQuestion(normalizedQuestion);
    const [hotels, promotions, bookings, hotelBookingGroups] = await Promise.all([
      this.prisma.hotel.findMany({
        where: { isActive: true, status: 'published', deletedAt: null },
        orderBy: [{ isFeatured: 'desc' }, { reviewCount: 'desc' }],
        take: 16,
        select: {
          id: true,
          slug: true,
          name: true,
          stars: true,
          city: true,
          district: true,
          location: true,
          addressLine: true,
          contactPhone: true,
          contactEmail: true,
          rating: true,
          reviewCount: true,
          pricePerNight: true,
          shortDescription: true,
          description: true,
          checkInTime: true,
          checkOutTime: true,
          images: {
            orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }],
            take: 5,
            select: {
              url: true,
              altText: true,
            },
          },
          amenities: {
            select: {
              amenity: {
                select: {
                  name: true,
                },
              },
            },
          },
          policies: {
            orderBy: { sortOrder: 'asc' },
            take: 4,
            select: {
              policyType: true,
              title: true,
              content: true,
            },
          },
          rooms: {
            where: { isActive: true, status: 'active' },
            take: 5,
            select: {
              id: true,
              name: true,
              description: true,
              size: true,
              price: true,
              salePrice: true,
              quantityAvailable: true,
              maxGuests: true,
              maxAdults: true,
              maxChildren: true,
              bedType: true,
              bedCount: true,
              bathroomCount: true,
              roomView: true,
              hasBalcony: true,
              hasBathtub: true,
              images: {
                orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }],
                take: 4,
                select: {
                  url: true,
                  altText: true,
                },
              },
              amenities: {
                select: {
                  amenity: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
          reviews: {
            where: { isVisible: true },
            orderBy: [{ createdAt: 'desc' }],
            take: 3,
            select: {
              rating: true,
              comment: true,
              userName: true,
              reviewDate: true,
            },
          },
        },
      }),
      this.prisma.promotion.findMany({
        where: {
          isActive: true,
          OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
        },
        orderBy: [{ createdAt: 'desc' }],
        take: 5,
        select: {
          code: true,
          title: true,
          description: true,
          discountType: true,
          discountValue: true,
          endDate: true,
        },
      }),
      userId
        ? this.prisma.booking.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 6,
            include: {
              items: {
                include: {
                  room: { select: { id: true, name: true } },
                },
              },
              payment: true,
            },
          })
        : Promise.resolve([]),
      includeHotelBookingStats
        ? this.prisma.booking.groupBy({
            by: ['hotelId'],
            where: {
              status: { in: ['confirmed', 'checked_in', 'checked_out'] },
              paymentStatus: { notIn: ['failed', 'cancelled'] },
            },
            _count: {
              hotelId: true,
            },
            _sum: {
              total: true,
            },
          })
        : Promise.resolve([]),
    ]);

    const rankedHotelIds = hotelBookingGroups
      .map((group) => group.hotelId)
      .filter(Boolean);
    const rankedHotels = rankedHotelIds.length
      ? await this.prisma.hotel.findMany({
          where: { id: { in: rankedHotelIds } },
          select: {
            id: true,
            slug: true,
            name: true,
            city: true,
          },
        })
      : [];
    const rankedHotelMap = new Map(rankedHotels.map((hotel) => [hotel.id, hotel]));
    const hotelBookingStats = hotelBookingGroups
      .map((group) => {
        const hotel = rankedHotelMap.get(group.hotelId);
        return {
          hotelId: group.hotelId,
          slug: hotel?.slug || '',
          hotelName: hotel?.name || group.hotelId,
          city: hotel?.city || '',
          successfulBookings: Number(group._count.hotelId || 0),
          revenue: Number(group._sum.total || 0),
        };
      })
      .sort((first, second) => second.successfulBookings - first.successfulBookings || second.revenue - first.revenue)
      .slice(0, 5);

    return {
      language,
      question,
      now: new Date().toISOString(),
      contact: {
        hotline: '+84 (028) 3888 9999',
        email: 'contact@luxurystay.com',
        address: language === 'en' ? '88 Luxury Way, District 1, Ho Chi Minh City' : '88 Luxury Way, Quận 1, TP. Hồ Chí Minh',
        supportHours: '08:00 - 22:00',
      },
      hotels: hotels.map((hotel) => ({
        id: hotel.id,
        slug: hotel.slug,
        name: hotel.name,
        stars: hotel.stars,
        city: hotel.city,
        district: hotel.district,
        location: hotel.location,
        addressLine: hotel.addressLine,
        contactPhone: hotel.contactPhone,
        contactEmail: hotel.contactEmail,
        rating: Number(hotel.rating || 0),
        reviewCount: hotel.reviewCount,
        pricePerNight: Number(hotel.pricePerNight || 0),
        description: this.truncateText(hotel.shortDescription || hotel.description, 700),
        checkInTime: hotel.checkInTime,
        checkOutTime: hotel.checkOutTime,
        images: hotel.images.map((image) => image.url),
        amenities: hotel.amenities.map((item) => item.amenity.name),
        policies: hotel.policies.map((policy) => ({
          type: policy.policyType,
          title: policy.title,
          content: this.truncateText(policy.content, 300),
        })),
        rooms: hotel.rooms.map((room) => ({
          id: room.id,
          name: room.name,
          description: this.truncateText(room.description || '', 360),
          size: room.size,
          price: Number(room.price || 0),
          salePrice: room.salePrice ? Number(room.salePrice) : null,
          quantityAvailable: room.quantityAvailable,
          maxGuests: room.maxGuests,
          maxAdults: room.maxAdults,
          maxChildren: room.maxChildren,
          bedType: room.bedType,
          bedCount: room.bedCount,
          bathroomCount: room.bathroomCount,
          roomView: room.roomView,
          hasBalcony: room.hasBalcony,
          hasBathtub: room.hasBathtub,
          images: room.images.map((image) => image.url),
          amenities: room.amenities.map((item) => item.amenity.name),
        })),
        recentReviews: hotel.reviews.map((review) => ({
          rating: review.rating,
          comment: this.truncateText(review.comment, 220),
          userName: review.userName,
          reviewDate: review.reviewDate,
        })),
      })),
      promotions: promotions.map((promotion) => ({
        code: promotion.code,
        title: promotion.title,
        description: promotion.description,
        discountType: promotion.discountType,
        discountValue: Number(promotion.discountValue || 0),
        endDate: promotion.endDate,
      })),
      hotelBookingStats,
      userBookings: bookings.map((booking: any) => ({
        id: booking.id,
        bookingCode: booking.bookingCode,
        hotelName: booking.hotelNameSnapshot,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        total: Number(booking.total || 0),
        guests: booking.guests,
        roomsCount: booking.roomsCount,
        roomName: booking.items?.[0]?.roomNameSnapshot || booking.items?.[0]?.room?.name || '',
      })),
    };
  }

  private createDatabaseSupportAnswer(
    language: AppLanguage,
    question: string,
    context: any,
    relatedHotels: any[] = [],
    intent: SupportIntent = 'unknown',
  ) {
    const normalizedQuestion = this.normalizeSearchText(question);
    const resolvedIntent = intent === 'unknown' ? this.detectSupportIntent(normalizedQuestion, context) : intent;

    if (resolvedIntent === 'booking') return this.createBookingAnswer(language, context, normalizedQuestion);
    if (resolvedIntent === 'promotion') return this.createPromotionAnswer(language, context);
    if (resolvedIntent === 'payment') return this.createPaymentAnswer(language, context);
    if (resolvedIntent === 'contact') return this.createContactAnswer(language, context);
    if (resolvedIntent === 'hotel_stats') return this.createHotelStatsAnswer(language, context);
    if (resolvedIntent === 'hotel') return this.createHotelAnswer(language, context, normalizedQuestion, relatedHotels);

    return this.createClarifyingAnswer(language, context);
  }

  private detectSupportIntent(normalizedQuestion: string, context?: any): SupportIntent {
    const bookingKeywords = [
      'booking',
      'bookings',
      'lich booking',
      'lich dat',
      'lich su dat',
      'don dat',
      'don phong',
      'don hang',
      'ma booking',
      'ma dat',
      'dat phong cua toi',
      'phong cua toi',
      'trang thai booking',
      'trang thai don',
      'huy booking',
      'huy phong',
      'doi lich',
      'doi ngay',
      'check in',
      'check out',
      'nhan phong',
      'tra phong',
      'my booking',
      'my bookings',
      'booking history',
      'reservation',
      'reservations',
    ];
    const paymentKeywords = [
      'thanh toan',
      'payment',
      'paid',
      'chua thanh toan',
      'da thanh toan',
      'momo',
      'the ngan hang',
      'the',
      'card',
      'chuyen khoan',
      'hoan tien',
      'refund',
      'dat coc',
      'deposit',
    ];
    const promotionKeywords = [
      'voucher',
      'uu dai',
      'giam gia',
      'khuyen mai',
      'ma giam',
      'coupon',
      'promotion',
      'deal',
      'promo',
    ];
    const contactKeywords = [
      'lien he',
      'hotline',
      'email',
      'ho tro',
      'tu van',
      'support',
      'contact',
      'dia chi cong ty',
      'cham soc khach hang',
    ];
    const hotelKeywords = [
      'khach san',
      'tim khach san',
      'goi y khach san',
      'resort',
      'villa',
      'homestay',
      'hotel',
      'room',
      'phong nao',
      'loai phong',
      'xem phong',
      'gia phong',
      'tien ich',
      'dia chi khach san',
      'hinh anh',
      'anh khach san',
      'danh gia khach san',
      'gan bien',
      'view bien',
      'family',
      'luxury',
      '5 sao',
    ];
    if (this.isHotelStatsQuestion(normalizedQuestion)) return 'hotel_stats';
    if (this.hasAnyKeyword(normalizedQuestion, bookingKeywords)) return 'booking';
    if (this.hasAnyKeyword(normalizedQuestion, paymentKeywords)) return 'payment';
    if (this.hasAnyKeyword(normalizedQuestion, promotionKeywords)) return 'promotion';
    if (this.hasAnyKeyword(normalizedQuestion, contactKeywords)) return 'contact';
    if (this.hasAnyKeyword(normalizedQuestion, hotelKeywords)) return 'hotel';

    const matchedKnownHotel = (context?.hotels || []).some((hotel: any) => {
      const hotelName = this.normalizeSearchText(hotel.name);
      const hotelTokens = hotelName.split(' ').filter((token) => token.length >= 3);
      return normalizedQuestion.includes(hotelName) || hotelTokens.filter((token) => normalizedQuestion.includes(token)).length >= 2;
    });

    return matchedKnownHotel ? 'hotel' : 'unknown';
  }

  private isGuestAllowedIntent(intent: SupportIntent) {
    return intent === 'hotel' || intent === 'hotel_stats';
  }

  private createGuestHotelOnlyAnswer(language: AppLanguage) {
    return language === 'en'
      ? 'You are browsing as a guest. I can currently help with hotel, room, location, amenity and hotel detail questions. Please sign in to ask about your bookings, payments, vouchers or account-specific requests.'
      : 'Bạn đang dùng chế độ khách. Hiện mình chỉ hỗ trợ các câu hỏi về khách sạn, phòng, vị trí, tiện ích và chi tiết khách sạn. Hãy đăng nhập để hỏi về booking, thanh toán, voucher hoặc yêu cầu theo tài khoản của bạn.';
  }

  private isHotelStatsQuestion(normalizedQuestion: string) {
    const hotelStatsKeywords = [
      'booking nhieu nhat',
      'dat nhieu nhat',
      'duoc dat nhieu nhat',
      'khach dat nhieu nhat',
      'khach hang dat nhieu nhat',
      'khach toi nhieu nhat',
      'khach hang toi nhieu nhat',
      'khach o nhieu nhat',
      'noi bat nhat theo booking',
      'top booking',
      'top dat phong',
      'most booked',
      'booked the most',
      'most popular hotel',
      'top hotel bookings',
    ];

    return (
      this.hasAnyKeyword(normalizedQuestion, hotelStatsKeywords) ||
      (this.hasAnyKeyword(normalizedQuestion, ['khach san', 'hotel', 'resort']) &&
        this.hasAnyKeyword(normalizedQuestion, ['nhieu nhat', 'top', 'xep hang', 'duoc dat', 'dat nhieu', 'booking nhieu', 'toi nhieu', 'most booked']))
    );
  }

  private createClarifyingAnswer(language: AppLanguage, context: any) {
    if (language === 'en') {
      return `I can help with booking history, payment status, vouchers, contact support, or hotel details. Please ask one specific question, for example: "Show my latest booking" or "What vouchers are active?"`;
    }

    return `Mình có thể hỗ trợ lịch booking, trạng thái thanh toán, voucher, liên hệ hỗ trợ hoặc chi tiết khách sạn. Bạn hỏi rõ một ý giúp mình nhé, ví dụ: "Xem booking gần nhất của tôi" hoặc "Có voucher nào đang áp dụng?"`;
  }

  private createHotelStatsAnswer(language: AppLanguage, context: any) {
    const isEnglish = language === 'en';
    const stats = Array.isArray(context.hotelBookingStats) ? context.hotelBookingStats : [];

    if (!stats.length) {
      return isEnglish
        ? 'I do not see any successful hotel bookings in the system yet. Successful bookings include confirmed, checked-in, and checked-out bookings only.'
        : 'Mình chưa thấy booking khách sạn thành công nào trong hệ thống. Mình chỉ tính các đơn đã xác nhận, đã nhận phòng hoặc đã hoàn thành.';
    }

    const topHotel = stats[0];
    const topLocation = topHotel.city
      ? isEnglish
        ? ` in ${topHotel.city}`
        : ` tại ${topHotel.city}`
      : '';
    const lines = stats.slice(0, 5).map((stat: any, index: number) => {
      const location = stat.city ? ` (${stat.city})` : '';
      return isEnglish
        ? `${index + 1}. ${stat.hotelName}${location}: ${stat.successfulBookings} successful booking(s), recorded revenue ${this.formatCurrency(stat.revenue, language)}.`
        : `${index + 1}. ${stat.hotelName}${location}: ${stat.successfulBookings} booking thành công, doanh thu ghi nhận ${this.formatCurrency(stat.revenue, language)}.`;
    });

    return isEnglish
      ? `${topHotel.hotelName}${topLocation} is currently the most booked hotel based on successful bookings. I counted confirmed, checked-in, and checked-out bookings only, excluding cancelled or failed payments.\nTop hotels by successful bookings:\n${lines.join('\n')}`
      : `${topHotel.hotelName}${topLocation} hiện là khách sạn được booking thành công nhiều nhất. Mình chỉ tính các đơn đã xác nhận, đã nhận phòng hoặc đã hoàn thành, không tính đơn hủy/thanh toán lỗi.\nTop khách sạn theo booking thành công:\n${lines.join('\n')}`;
  }

  private createHotelAnswer(language: AppLanguage, context: any, normalizedQuestion: string, relatedHotels: any[] = []) {
    const isEnglish = language === 'en';
    const hotels = Array.isArray(context.hotels) ? context.hotels : [];
    const wantsFamily = this.hasAnyKeyword(normalizedQuestion, ['gia dinh', 'tre em', 'family', 'children', 'kids']);
    const wantsLuxury = this.hasAnyKeyword(normalizedQuestion, ['sang', 'luxury', 'cao cap', '5 sao', 'vip']);
    const wantsCheap = this.hasAnyKeyword(normalizedQuestion, ['gia re', 'tiet kiem', 'cheap', 'budget', 'gia tot']);
    const requestedCity = this.getRequestedCity(normalizedQuestion, hotels);
    const availableCities = Array.from(new Set(hotels.map((hotel: any) => hotel.city).filter(Boolean)));

    if (requestedCity && !hotels.some((hotel: any) => this.hotelMatchesRequestedLocation(hotel, requestedCity))) {
      const cityName = this.toTitleCase(requestedCity);
      return isEnglish
        ? `I could not find an active hotel in ${cityName} in the current database. Available cities include: ${availableCities.join(', ') || 'none yet'}.`
        : `Mình chưa thấy khách sạn đang mở bán ở ${cityName} trong dữ liệu hiện tại. Các khu vực đang có trên hệ thống: ${availableCities.join(', ') || 'chưa có'}.`;
    }

    const selectedHotels = relatedHotels.length
      ? relatedHotels
      : this.selectRelatedHotels(normalizedQuestion, context, 4, true);

    if (!selectedHotels.length) {
      return isEnglish
        ? `I could not find active hotels in the database right now. Please contact ${context.contact.hotline} for direct support.`
        : `Hiện mình chưa tìm thấy khách sạn đang mở bán trong dữ liệu. Bạn có thể liên hệ ${context.contact.hotline} để được hỗ trợ trực tiếp.`;
    }

    if (selectedHotels.length === 1) {
      const hotel = selectedHotels[0];
      const rooms = (hotel.rooms || []).slice(0, 3).map((room: any) => {
        const roomPrice = this.formatCurrency(room.salePrice || room.price, language);
        return isEnglish
          ? `${room.name}: up to ${room.maxGuests} guests, from ${roomPrice}`
          : `${room.name}: tối đa ${room.maxGuests} khách, từ ${roomPrice}`;
      });
      const amenities = (hotel.amenities || []).slice(0, 8).join(', ');
      const review = hotel.recentReviews?.[0];
      const imageNote = hotel.images?.length
        ? isEnglish
          ? `I attached ${hotel.images.length} hotel photo${hotel.images.length > 1 ? 's' : ''} below.`
          : `Mình đã hiển thị ${hotel.images.length} ảnh khách sạn ở bên dưới.`
        : isEnglish
          ? 'This hotel does not have uploaded photos yet.'
          : 'Khách sạn này chưa có ảnh được upload.';

      return isEnglish
        ? [
            `${hotel.name} is the closest match in the database.`,
            `Location: ${hotel.addressLine || hotel.location}, ${hotel.city}. Rating: ${hotel.rating}/5 from ${hotel.reviewCount} reviews. From ${this.formatCurrency(hotel.pricePerNight, language)}/night.`,
            hotel.description ? `Overview: ${hotel.description}` : '',
            amenities ? `Amenities: ${amenities}.` : '',
            rooms.length ? `Rooms: ${rooms.join('; ')}.` : '',
            review ? `Recent review: ${review.rating}/5 - ${review.comment}` : '',
            imageNote,
          ].filter(Boolean).join('\n')
        : [
            `${hotel.name} là khách sạn khớp nhất với câu hỏi của bạn.`,
            `Vị trí: ${hotel.addressLine || hotel.location}, ${hotel.city}. Đánh giá: ${hotel.rating}/5 từ ${hotel.reviewCount} đánh giá. Giá từ ${this.formatCurrency(hotel.pricePerNight, language)}/đêm.`,
            hotel.description ? `Tổng quan: ${hotel.description}` : '',
            amenities ? `Tiện ích: ${amenities}.` : '',
            rooms.length ? `Phòng nổi bật: ${rooms.join('; ')}.` : '',
            review ? `Đánh giá gần đây: ${review.rating}/5 - ${review.comment}` : '',
            imageNote,
          ].filter(Boolean).join('\n');
    }

    const lines = selectedHotels.map((hotel: any, index: number) => {
      const room = hotel.rooms?.[0];
      const roomText = room
        ? isEnglish
          ? `Suggested room: ${room.name}, up to ${room.maxGuests} guests, from ${this.formatCurrency(room.salePrice || room.price, language)}.`
          : `Phòng gợi ý: ${room.name}, tối đa ${room.maxGuests} khách, từ ${this.formatCurrency(room.salePrice || room.price, language)}.`
        : isEnglish
          ? 'No active room is listed yet.'
          : 'Chưa có phòng đang mở bán.';

      return `${index + 1}. ${hotel.name} (${hotel.city}) - ${hotel.stars || 5} sao, ${hotel.rating}/5 từ ${hotel.reviewCount} đánh giá, từ ${this.formatCurrency(hotel.pricePerNight, language)}/đêm. ${roomText}`;
    });

    const intro = isEnglish
      ? `I checked the live database and found these suitable options:`
      : `Mình đã kiểm tra dữ liệu hệ thống và gợi ý các lựa chọn phù hợp:`;
    const nextStep = isEnglish
      ? 'Open a hotel detail page to choose dates and check real availability.'
      : 'Bạn mở chi tiết khách sạn để chọn ngày và kiểm tra phòng trống thực tế nhé.';

    return `${intro}\n${lines.join('\n')}\n${nextStep}`;
  }

  private createPromotionAnswer(language: AppLanguage, context: any) {
    const isEnglish = language === 'en';
    const promotions = Array.isArray(context.promotions) ? context.promotions : [];

    if (!promotions.length) {
      return isEnglish
        ? 'There are no active vouchers right now. Please check the promotions page later or contact support for group offers.'
        : 'Hiện chưa có voucher đang khả dụng. Bạn có thể quay lại trang ưu đãi sau hoặc liên hệ hỗ trợ nếu cần báo giá đoàn.';
    }

    const lines = promotions.slice(0, 5).map((promotion: any, index: number) => {
      const numericValue = Number(promotion.discountValue || 0);
      const isPercentDiscount = promotion.discountType === 'percent' && numericValue <= 100;
      const discount =
        isPercentDiscount
          ? `${numericValue}%`
          : this.formatCurrency(numericValue, language);
      const endDate = promotion.endDate
        ? isEnglish
          ? `, valid until ${this.formatDate(promotion.endDate, language)}`
          : `, dùng đến ${this.formatDate(promotion.endDate, language)}`
        : '';
      return `${index + 1}. ${promotion.code} - ${promotion.title}: ${isEnglish ? 'save' : 'giảm'} ${discount}${endDate}.`;
    });

    return isEnglish
      ? `Active vouchers from the database:\n${lines.join('\n')}`
      : `Các voucher đang khả dụng trong hệ thống:\n${lines.join('\n')}`;
  }

  private createBookingAnswer(language: AppLanguage, context: any, normalizedQuestion: string) {
    const isEnglish = language === 'en';
    const bookings = Array.isArray(context.userBookings) ? context.userBookings : [];

    if (!bookings.length) {
      return isEnglish
        ? 'I do not see any booking in your signed-in account. Please sign in with the booking account, then ask me again.'
        : 'Mình chưa thấy booking nào trong tài khoản đang đăng nhập. Bạn hãy đăng nhập đúng tài khoản đặt phòng rồi hỏi lại nhé.';
    }

    const wantsBookingList = this.hasAnyKeyword(normalizedQuestion, [
      'lich booking',
      'lich dat',
      'lich su',
      'danh sach',
      'tat ca',
      'cac booking',
      'bookings',
      'booking history',
      'my bookings',
    ]);

    if (wantsBookingList) {
      const lines = bookings.slice(0, 5).map((booking: any, index: number) => {
        const roomName = booking.roomName || (isEnglish ? 'room updating' : 'dang cap nhat phong');
        const stay = `${this.formatDate(booking.checkIn, language)} - ${this.formatDate(booking.checkOut, language)}`;
        return isEnglish
          ? `${index + 1}. ${booking.bookingCode} - ${booking.hotelName}, ${roomName}. Stay: ${stay}. Status: ${booking.status}, payment: ${booking.paymentStatus}. Total: ${this.formatCurrency(booking.total, language)}.`
          : `${index + 1}. ${booking.bookingCode} - ${booking.hotelName}, ${roomName}. Lich o: ${stay}. Trang thai: ${booking.status}, thanh toan: ${booking.paymentStatus}. Tong: ${this.formatCurrency(booking.total, language)}.`;
      });

      return isEnglish
        ? `Your recent bookings:\n${lines.join('\n')}`
        : `Cac booking gan day cua ban:\n${lines.join('\n')}`;
    }

    const matchingBooking =
      bookings.find((booking: any) => this.normalizeSearchText(booking.bookingCode).split(' ').some((code) => normalizedQuestion.includes(code))) ||
      bookings[0];
    const roomName = matchingBooking.roomName || (isEnglish ? 'room details are being updated' : 'đang cập nhật phòng');

    return isEnglish
      ? `Your matching booking is ${matchingBooking.bookingCode} at ${matchingBooking.hotelName}. Stay: ${this.formatDate(matchingBooking.checkIn, language)} - ${this.formatDate(matchingBooking.checkOut, language)}. Status: ${matchingBooking.status}, payment: ${matchingBooking.paymentStatus}. Room: ${roomName}. Total: ${this.formatCurrency(matchingBooking.total, language)}. For urgent changes, call ${context.contact.hotline}.`
      : `Booking phù hợp của bạn là ${matchingBooking.bookingCode} tại ${matchingBooking.hotelName}. Lịch ở: ${this.formatDate(matchingBooking.checkIn, language)} - ${this.formatDate(matchingBooking.checkOut, language)}. Trạng thái: ${matchingBooking.status}, thanh toán: ${matchingBooking.paymentStatus}. Phòng: ${roomName}. Tổng tiền: ${this.formatCurrency(matchingBooking.total, language)}. Nếu cần đổi/hủy gấp, hãy gọi ${context.contact.hotline}.`;
  }

  private createPaymentAnswer(language: AppLanguage, context: any) {
    const isEnglish = language === 'en';
    const latestBooking = Array.isArray(context.userBookings) ? context.userBookings[0] : null;
    const bookingLine = latestBooking
      ? isEnglish
        ? ` Your latest booking ${latestBooking.bookingCode} has payment status: ${latestBooking.paymentStatus}.`
        : ` Booking gần nhất ${latestBooking.bookingCode} có trạng thái thanh toán: ${latestBooking.paymentStatus}.`
      : '';

    return isEnglish
      ? `Luxury Stay supports pay at hotel, e-wallet gateway, card and bank transfer depending on the booking flow.${bookingLine} Never share card numbers, OTPs or passwords in chat.`
      : `Luxury Stay hỗ trợ thanh toán tại khách sạn, ví điện tử/cổng thanh toán, thẻ và chuyển khoản tùy luồng đặt phòng.${bookingLine} Bạn không nên gửi số thẻ, OTP hoặc mật khẩu trong chat.`;
  }

  private createContactAnswer(language: AppLanguage, context: any) {
    return language === 'en'
      ? `You can contact Luxury Stay via hotline ${context.contact.hotline}, email ${context.contact.email}, or the contact page. Support hours: ${context.contact.supportHours}.`
      : `Bạn có thể liên hệ Luxury Stay qua hotline ${context.contact.hotline}, email ${context.contact.email}, hoặc trang liên hệ. Khung giờ hỗ trợ: ${context.contact.supportHours}.`;
  }

  private shouldAttachRelatedHotels(normalizedQuestion: string, context: any) {
    const hotelKeywords = [
      'khach san',
      'phong',
      'resort',
      'villa',
      'homestay',
      'hotel',
      'room',
      'hinh anh',
      'anh',
      'gia',
      'tien ich',
      'dia chi',
      'danh gia',
      'family',
      'luxury',
    ];

    if (this.hasAnyKeyword(normalizedQuestion, hotelKeywords)) return true;

    return (context.hotels || []).some((hotel: any) => {
      const hotelName = this.normalizeSearchText(hotel.name);
      const hotelTokens = hotelName.split(' ').filter((token) => token.length >= 3);
      return normalizedQuestion.includes(hotelName) || hotelTokens.filter((token) => normalizedQuestion.includes(token)).length >= 2;
    });
  }

  private selectRelatedHotels(question: string, context: any, limit = 3, allowFallback = true) {
    const hotels = Array.isArray(context.hotels) ? context.hotels : [];
    if (!hotels.length) return [];

    const normalizedQuestion = this.normalizeSearchText(question);
    const requestedCity = this.getRequestedCity(normalizedQuestion, hotels);
    const baseHotels = requestedCity
      ? hotels.filter((hotel: any) => this.hotelMatchesRequestedLocation(hotel, requestedCity))
      : hotels;

    if (!baseHotels.length) return [];

    const tokens = this.getMeaningfulSearchTokens(normalizedQuestion);
    const wantsCheap = this.hasAnyKeyword(normalizedQuestion, ['gia re', 'tiet kiem', 'cheap', 'budget', 'gia tot']);
    const scoredHotels = baseHotels
      .map((hotel: any) => ({
        hotel,
        score: this.scoreHotelMatch(hotel, normalizedQuestion, tokens, requestedCity),
      }))
      .sort((a: any, b: any) => {
        if (b.score !== a.score) return b.score - a.score;
        if (wantsCheap) return Number(a.hotel.pricePerNight || 0) - Number(b.hotel.pricePerNight || 0);
        return Number(b.hotel.rating || 0) - Number(a.hotel.rating || 0);
      });

    const topScore = scoredHotels[0]?.score || 0;
    const specificMatch = topScore >= 80;

    return scoredHotels
      .filter((entry: any) => entry.score > 0 || allowFallback)
      .slice(0, specificMatch ? 1 : limit)
      .map((entry: any) => this.toRelatedHotelCard(entry.hotel));
  }

  private scoreHotelMatch(hotel: any, normalizedQuestion: string, tokens: string[], requestedCity: string | null) {
    const hotelName = this.normalizeSearchText(hotel.name);
    const slug = this.normalizeSearchText(hotel.slug);
    const city = this.normalizeSearchText(hotel.city);
    const district = this.normalizeSearchText(hotel.district);
    const location = this.normalizeSearchText(hotel.location);
    const description = this.normalizeSearchText(hotel.description);
    const amenities = this.normalizeSearchText((hotel.amenities || []).join(' '));
    const roomText = this.normalizeSearchText((hotel.rooms || []).map((room: any) => [room.name, room.description, room.roomView, room.amenities?.join(' ')].join(' ')).join(' '));
    let score = 0;

    if (requestedCity && this.hotelMatchesRequestedLocation(hotel, requestedCity)) score += 45;
    if (hotelName && normalizedQuestion.includes(hotelName)) score += 140;
    if (slug && normalizedQuestion.includes(slug)) score += 120;

    for (const token of tokens) {
      if (hotelName.includes(token)) score += 18;
      if (slug.includes(token)) score += 14;
      if (city.includes(token)) score += 12;
      if (district.includes(token)) score += 9;
      if (location.includes(token)) score += 7;
      if (amenities.includes(token)) score += 5;
      if (roomText.includes(token)) score += 5;
      if (description.includes(token)) score += 3;
    }

    if (this.hasAnyKeyword(normalizedQuestion, ['gia dinh', 'tre em', 'family', 'children', 'kids']) && hotel.rooms?.some((room: any) => Number(room.maxGuests || 0) >= 3)) {
      score += 20;
    }

    if (this.hasAnyKeyword(normalizedQuestion, ['bien', 'sea', 'ocean']) && [location, description, roomText].some((value) => value.includes('bien') || value.includes('sea') || value.includes('ocean'))) {
      score += 18;
    }

    if (this.hasAnyKeyword(normalizedQuestion, ['sang', 'luxury', 'cao cap', '5 sao', 'vip']) && (Number(hotel.stars || 0) >= 5 || Number(hotel.rating || 0) >= 4.5)) {
      score += 16;
    }

    score += Math.min(8, Number(hotel.rating || 0));
    return score;
  }

  private toRelatedHotelCard(hotel: any) {
    return {
      id: hotel.id,
      slug: hotel.slug,
      name: hotel.name,
      city: hotel.city,
      district: hotel.district,
      location: hotel.location,
      addressLine: hotel.addressLine,
      stars: hotel.stars,
      rating: hotel.rating,
      reviewCount: hotel.reviewCount,
      pricePerNight: hotel.pricePerNight,
      description: hotel.description,
      images: (hotel.images || []).slice(0, 5),
      amenities: (hotel.amenities || []).slice(0, 8),
      policies: (hotel.policies || []).slice(0, 3),
      rooms: (hotel.rooms || []).slice(0, 3),
      recentReviews: (hotel.recentReviews || []).slice(0, 2),
      detailUrl: `/hotel/${hotel.id}`,
    };
  }

  private normalizeSearchText(value: unknown) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\u0111\u0110]/g, 'd')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private hasAnyKeyword(value: string, keywords: string[]) {
    return keywords.some((keyword) => value.includes(this.normalizeSearchText(keyword)));
  }

  private getMeaningfulSearchTokens(value: string) {
    const stopWords = new Set([
      'khach',
      'san',
      'nao',
      'phu',
      'hop',
      'cho',
      'gia',
      'dinh',
      'toi',
      'minh',
      'ban',
      'can',
      'tim',
      'tai',
      'gan',
      'nhat',
      'tot',
      'hotel',
      'room',
      'best',
      'for',
      'with',
      'the',
      'and',
      'family',
    ]);

    return value
      .split(' ')
      .filter((word) => word.length >= 3 && !stopWords.has(word));
  }

  private getRequestedCity(normalizedQuestion: string, hotels: any[]) {
    const knownCities = [
      'da nang',
      'ha noi',
      'ho chi minh',
      'sai gon',
      'phu quoc',
      'nha trang',
      'da lat',
      'hoi an',
      'hue',
      'vung tau',
      'quy nhon',
      'can tho',
      'kien giang',
    ];
    const citiesFromData = hotels.map((hotel: any) => this.normalizeSearchText(hotel.city)).filter(Boolean);
    const city = [...citiesFromData, ...knownCities].find((item) => normalizedQuestion.includes(item));
    if (city === 'sai gon') return 'ho chi minh';
    return city || null;
  }

  private cityMatches(city: unknown, requestedCity: string) {
    const value = this.normalizeSearchText(city);
    return value === requestedCity || value.includes(requestedCity) || requestedCity.includes(value);
  }

  private hotelMatchesRequestedLocation(hotel: any, requestedLocation: string) {
    const fields = [
      hotel?.city,
      hotel?.district,
      hotel?.location,
      hotel?.addressLine,
      hotel?.name,
      hotel?.slug,
      hotel?.description,
    ]
      .map((value) => this.normalizeSearchText(value))
      .filter(Boolean);

    return fields.some(
      (value) => value === requestedLocation || value.includes(requestedLocation) || requestedLocation.includes(value),
    );
  }

  private toTitleCase(value: string) {
    return value
      .split(' ')
      .filter(Boolean)
      .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
      .join(' ');
  }

  private truncateText(value: string | null | undefined, maxLength: number) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (text.length <= maxLength) return text;
    return `${text.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
  }

  private formatCurrency(value: unknown, language: AppLanguage) {
    return new Intl.NumberFormat(language === 'en' ? 'en-US' : 'vi-VN', {
      style: 'currency',
      currency: language === 'en' ? 'USD' : 'VND',
      maximumFractionDigits: 0,
    }).format(Number(value || 0) / (language === 'en' ? 25000 : 1));
  }

  private formatDate(value: unknown, language: AppLanguage) {
    if (!value) return language === 'en' ? 'not set' : 'chưa có';
    return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'vi-VN').format(new Date(value as any));
  }

  private createFallbackSupportAnswer(language: AppLanguage) {
    if (language === 'en') {
      return 'AI support is temporarily using basic mode. I can still help with hotel search, promotions, contact information, and booking history after you sign in. For urgent changes, call +84 (028) 3888 9999 or email contact@luxurystay.com.';
    }

    return 'AI hỗ trợ đang chạy ở chế độ cơ bản. Tôi vẫn có thể hỗ trợ tìm khách sạn, ưu đãi, thông tin liên hệ và lịch booking sau khi bạn đăng nhập. Nếu cần xử lý gấp, gọi +84 (028) 3888 9999 hoặc gửi email contact@luxurystay.com.';
  }
}
