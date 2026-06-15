import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMomoPaymentDto } from './dto/create-momo-payment.dto';

type MomoResultPayload = Record<string, any>;

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createMomoPayment(userId: string, dto: CreateMomoPaymentDto) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: dto.bookingId, userId },
      include: { payment: true, items: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking khong ton tai.');
    }
    if (booking.status === 'cancelled') {
      throw new BadRequestException('Booking da bi huy, khong the thanh toan.');
    }
    if (booking.paymentStatus === 'paid') {
      throw new BadRequestException('Booking nay da duoc thanh toan.');
    }

    const option = dto.paymentOption || 'full';
    const totalAmount = Math.round(Number(booking.total));
    const amount = option === 'deposit'
      ? Math.max(1000, Math.round(totalAmount * 0.3))
      : totalAmount;

    const partnerCode = this.getRequiredConfig('MOMO_PARTNER_CODE');
    const accessKey = this.getRequiredConfig('MOMO_ACCESS_KEY');
    const secretKey = this.getRequiredConfig('MOMO_SECRET_KEY');
    const endpoint = this.configService.get<string>('MOMO_ENDPOINT') || 'https://test-payment.momo.vn/v2/gateway/api/create';
    const redirectUrl = this.resolveBackendCallbackUrl('MOMO_REDIRECT_URL', '/api/payments/momo/return');
    const ipnUrl = this.resolveBackendCallbackUrl('MOMO_IPN_URL', '/api/payments/momo/ipn');
    const requestType = this.configService.get<string>('MOMO_REQUEST_TYPE') || 'payWithMethod';

    const requestId = `${booking.bookingCode}-${Date.now()}`;
    const orderId = requestId;
    const orderInfo = option === 'deposit'
      ? `Dat coc LuxStay ${booking.bookingCode}`
      : `Thanh toan LuxStay ${booking.bookingCode}`;
    const extraData = Buffer.from(JSON.stringify({
      bookingId: booking.id,
      userId,
      paymentOption: option,
      totalAmount,
      amount,
    })).toString('base64');

    const rawSignature =
      `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}` +
      `&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}` +
      `&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    const signature = this.sign(rawSignature, secretKey);

    const payload = {
      partnerCode,
      partnerName: 'LuxStay',
      storeId: 'LuxStayHotel',
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang: 'vi',
      requestType,
      orderExpireTime: 30,
      autoCapture: true,
      items: [
        {
          id: booking.id,
          name: booking.hotelNameSnapshot,
          description: booking.items?.[0]?.roomNameSnapshot || `Booking ${booking.bookingCode}`,
          category: 'hotel',
          price: amount,
          currency: 'VND',
          quantity: 1,
          unit: 'booking',
          totalPrice: amount,
        },
      ],
      userInfo: {
        name: booking.guestName,
        phoneNumber: booking.guestPhone,
        email: booking.guestEmail,
      },
      extraData,
      signature,
    };

    const momoResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new BadRequestException(data?.message || 'Khong the tao giao dich MoMo.');
      }
      return data;
    });

    if (Number(momoResponse.resultCode) !== 0 || !momoResponse.payUrl) {
      throw new BadRequestException(momoResponse.message || 'MoMo tu choi tao giao dich.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.upsert({
        where: { bookingId: booking.id },
        create: {
          bookingId: booking.id,
          paymentMethod: 'ewallet',
          paymentStatus: 'pending',
          amount,
          providerReference: orderId,
        },
        update: {
          paymentMethod: 'ewallet',
          paymentStatus: 'pending',
          amount,
          providerReference: orderId,
        },
      });

      await tx.booking.update({
        where: { id: booking.id },
        data: {
          paymentMethod: 'ewallet',
          paymentStatus: 'pending',
          adminNote: this.buildMomoNote(option, totalAmount, amount),
          updatedAt: new Date(),
        },
      });
    });

    await this.dispatchNotification('notify momo pending for user', () =>
      this.notificationsService.notifyPaymentStatusChangedForUser({
        ...booking,
        paymentStatus: 'pending',
        adminNote: this.buildMomoNote(option, totalAmount, amount),
      }),
    );

    return {
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      orderId,
      requestId,
      amount,
      totalAmount,
      paymentOption: option,
      payUrl: momoResponse.payUrl,
      shortLink: momoResponse.shortLink,
      deeplink: momoResponse.deeplink,
      qrCodeUrl: momoResponse.qrCodeUrl,
      message: momoResponse.message,
      resultCode: momoResponse.resultCode,
    };
  }

  async getPaymentStatus(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, userId },
      include: { payment: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking khong ton tai.');
    }

    return {
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      bookingStatus: booking.status,
      paymentStatus: booking.paymentStatus,
      transactionId: booking.transactionId,
      payment: booking.payment,
    };
  }

  async handleMomoReturn(payload: MomoResultPayload) {
    const frontendUrl = this.resolveFrontendUrl();
    const result = await this.processMomoResult(payload, false);
    const status = result.success ? 'success' : 'failed';
    const bookingId = result.bookingId || this.decodeExtraData(payload.extraData)?.bookingId || '';
    return `${frontendUrl}/booking-success?id=${encodeURIComponent(bookingId)}&payment=momo&result=${status}`;
  }

  async handleMomoIpn(payload: MomoResultPayload) {
    await this.processMomoResult(payload, true);
  }

  private async processMomoResult(payload: MomoResultPayload, requireValidSignature: boolean) {
    const isValidSignature = this.verifyResultSignature(payload);
    if (requireValidSignature && !isValidSignature) {
      throw new UnauthorizedException('Chu ky MoMo khong hop le.');
    }
    if (!isValidSignature) {
      return {
        success: false,
        bookingId: this.decodeExtraData(payload.extraData)?.bookingId,
      };
    }

    const extra = this.decodeExtraData(payload.extraData);
    const bookingId = extra?.bookingId;
    if (!bookingId) {
      return { success: false, bookingId: undefined };
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });
    if (!booking) {
      return { success: false, bookingId };
    }

    const resultCode = Number(payload.resultCode);
    const isSuccess = resultCode === 0;
    const transId = payload.transId ? String(payload.transId) : undefined;
    const paidAmount = Number(payload.amount || extra.amount || booking.payment?.amount || booking.total);

    await this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: isSuccess ? 'confirmed' : 'pending',
          paymentStatus: isSuccess ? 'paid' : 'failed',
          transactionId: transId,
          adminNote: isSuccess
            ? this.buildMomoPaidNote(extra.paymentOption, Number(extra.totalAmount || booking.total), paidAmount, transId)
            : `MoMo thanh toan that bai: ${payload.message || 'Khong ro ly do'}`,
          updatedAt: new Date(),
        },
      });

      await tx.payment.upsert({
        where: { bookingId: booking.id },
        create: {
          bookingId: booking.id,
          paymentMethod: 'ewallet',
          paymentStatus: isSuccess ? 'paid' : 'failed',
          amount: paidAmount,
          transactionId: transId,
          providerReference: payload.orderId ? String(payload.orderId) : undefined,
          paidAt: isSuccess ? new Date() : undefined,
        },
        update: {
          paymentStatus: isSuccess ? 'paid' : 'failed',
          amount: paidAmount,
          transactionId: transId,
          providerReference: payload.orderId ? String(payload.orderId) : booking.payment?.providerReference,
          paidAt: isSuccess ? new Date() : undefined,
        },
      });
    });

    if (isSuccess) {
      await this.dispatchNotification('notify momo booking confirmed for user', () =>
        this.notificationsService.notifyBookingStatusChangedForUser({
          ...booking,
          status: 'confirmed',
          adminNote: this.buildMomoPaidNote(
            extra.paymentOption,
            Number(extra.totalAmount || booking.total),
            paidAmount,
            transId,
          ),
        }),
      );
    }

    await this.dispatchNotification('notify momo payment result for user', () =>
      this.notificationsService.notifyPaymentStatusChangedForUser({
        ...booking,
        paymentStatus: isSuccess ? 'paid' : 'failed',
        transactionId: transId,
        adminNote: isSuccess
          ? this.buildMomoPaidNote(
              extra.paymentOption,
              Number(extra.totalAmount || booking.total),
              paidAmount,
              transId,
            )
          : `MoMo thanh toan that bai: ${payload.message || 'Khong ro ly do'}`,
      }),
    );
    await this.dispatchNotification('notify momo payment result for admins', () =>
      this.notificationsService.notifyPaymentStatusChangedForAdmins({
        ...booking,
        paymentStatus: isSuccess ? 'paid' : 'failed',
        transactionId: transId,
      }),
    );

    return { success: isSuccess, bookingId: booking.id };
  }

  private verifyResultSignature(payload: MomoResultPayload) {
    if (!payload.signature) return false;

    const accessKey = this.getRequiredConfig('MOMO_ACCESS_KEY');
    const secretKey = this.getRequiredConfig('MOMO_SECRET_KEY');
    const rawSignature =
      `accessKey=${accessKey}&amount=${payload.amount || ''}&extraData=${payload.extraData || ''}` +
      `&message=${payload.message || ''}&orderId=${payload.orderId || ''}&orderInfo=${payload.orderInfo || ''}` +
      `&orderType=${payload.orderType || ''}&partnerCode=${payload.partnerCode || ''}&payType=${payload.payType || ''}` +
      `&requestId=${payload.requestId || ''}&responseTime=${payload.responseTime || ''}` +
      `&resultCode=${payload.resultCode ?? ''}&transId=${payload.transId || ''}`;

    return this.sign(rawSignature, secretKey) === payload.signature;
  }

  private decodeExtraData(extraData?: string) {
    if (!extraData) return null;
    try {
      return JSON.parse(Buffer.from(extraData, 'base64').toString('utf8'));
    } catch {
      return null;
    }
  }

  private getRequiredConfig(key: string) {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new BadRequestException(`Thieu cau hinh ${key}.`);
    }
    return value;
  }

  private getConfig(key: string) {
    return this.configService.get<string>(key)?.trim();
  }

  private trimTrailingSlash(value: string) {
    return value.replace(/\/+$/, '');
  }

  private isLoopbackUrl(value?: string) {
    if (!value) return false;
    try {
      const { hostname } = new URL(value);
      return ['localhost', '127.0.0.1', '::1'].includes(hostname);
    } catch {
      return false;
    }
  }

  private resolveBackendPublicUrl() {
    const candidates = [
      this.getConfig('PUBLIC_API_URL'),
      this.getConfig('BACKEND_PUBLIC_URL'),
      this.getConfig('RENDER_EXTERNAL_URL'),
    ].filter(Boolean) as string[];

    const publicUrl = candidates.find((url) => /^https?:\/\//i.test(url) && !this.isLoopbackUrl(url));
    return publicUrl ? this.trimTrailingSlash(publicUrl) : '';
  }

  private resolveBackendCallbackUrl(configKey: string, path: string) {
    const configured = this.getConfig(configKey);
    if (configured && !this.isLoopbackUrl(configured)) {
      return configured;
    }

    const publicBackendUrl = this.resolveBackendPublicUrl();
    if (publicBackendUrl) {
      return `${publicBackendUrl}${path}`;
    }

    if (configured) {
      return configured;
    }

    throw new BadRequestException(`Thieu cau hinh ${configKey}.`);
  }

  private resolveFrontendUrl() {
    const configured = this.getConfig('FRONTEND_URL');
    if (configured && !this.isLoopbackUrl(configured)) {
      return this.trimTrailingSlash(configured);
    }

    const vercelUrl = this.getConfig('VERCEL_URL');
    if (vercelUrl) {
      return this.trimTrailingSlash(vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`);
    }

    return configured ? this.trimTrailingSlash(configured) : 'http://localhost:8080';
  }

  private sign(rawSignature: string, secretKey: string) {
    return createHmac('sha256', secretKey).update(rawSignature).digest('hex');
  }

  private buildMomoNote(option: 'full' | 'deposit', totalAmount: number, amount: number) {
    if (option === 'deposit') {
      return `Cho thanh toan dat coc MoMo 30%. So tien coc: ${amount.toLocaleString('vi-VN')} VND. Tong tien phong: ${totalAmount.toLocaleString('vi-VN')} VND.`;
    }

    return `Cho thanh toan toan bo qua MoMo. So tien: ${amount.toLocaleString('vi-VN')} VND.`;
  }

  private buildMomoPaidNote(option: string, totalAmount: number, amount: number, transId?: string) {
    if (option === 'deposit') {
      const remaining = Math.max(0, totalAmount - amount);
      return `Khach da dat coc MoMo 30%. Ma giao dich: ${transId || 'N/A'}. Da thu: ${amount.toLocaleString('vi-VN')} VND. Con lai thu tai khach san: ${remaining.toLocaleString('vi-VN')} VND.`;
    }

    return `Khach da thanh toan toan bo qua MoMo. Ma giao dich: ${transId || 'N/A'}. So tien: ${amount.toLocaleString('vi-VN')} VND.`;
  }

  private async dispatchNotification(label: string, task: () => Promise<unknown>) {
    try {
      await task();
    } catch (error) {
      console.error(`[Notifications] ${label} failed`, error);
    }
  }
}
