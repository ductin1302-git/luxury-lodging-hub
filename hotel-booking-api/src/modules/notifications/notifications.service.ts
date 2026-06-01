import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type NotificationScope = 'user' | 'admin';

interface CreateNotificationInput {
  recipientUserId: string;
  scope: NotificationScope;
  kind: string;
  title: string;
  message: string;
  href?: string;
  statusLabel?: string;
  entityType?: string;
  entityId?: string;
  eventKey: string;
  metadata?: Record<string, any> | null;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  private get notificationClient() {
    return (this.prisma as any).notification;
  }

  async listUserNotifications(userId: string) {
    return this.notificationClient.findMany({
      where: {
        recipientUserId: userId,
        scope: 'user',
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async listAdminNotifications(userId: string) {
    return this.notificationClient.findMany({
      where: {
        recipientUserId: userId,
        scope: 'admin',
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.notificationClient.findFirst({
      where: {
        id: notificationId,
        recipientUserId: userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Thong bao khong ton tai.');
    }

    return this.notificationClient.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: notification.readAt || new Date(),
      },
    });
  }

  async markAllAsRead(userId: string, scope: NotificationScope) {
    await this.notificationClient.updateMany({
      where: {
        recipientUserId: userId,
        scope,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { success: true };
  }

  async createForUser(input: CreateNotificationInput) {
    return this.notificationClient.upsert({
      where: { eventKey: input.eventKey },
      create: {
        recipientUserId: input.recipientUserId,
        scope: input.scope,
        kind: input.kind,
        title: input.title,
        message: input.message,
        href: input.href,
        statusLabel: input.statusLabel,
        entityType: input.entityType,
        entityId: input.entityId,
        eventKey: input.eventKey,
        metadata: input.metadata || undefined,
      },
      update: {
        title: input.title,
        message: input.message,
        href: input.href,
        statusLabel: input.statusLabel,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: input.metadata || undefined,
        isRead: false,
        readAt: null,
      },
    });
  }

  async createForAdmins(input: Omit<CreateNotificationInput, 'recipientUserId' | 'scope' | 'eventKey'> & { eventKeyBase: string }) {
    const admins = await this.prisma.appUser.findMany({
      where: {
        role: { in: ['admin', 'staff'] },
        isActive: true,
      },
      select: { id: true },
    });

    await Promise.all(
      admins.map((admin) =>
        this.createForUser({
          recipientUserId: admin.id,
          scope: 'admin',
          kind: input.kind,
          title: input.title,
          message: input.message,
          href: input.href,
          statusLabel: input.statusLabel,
          entityType: input.entityType,
          entityId: input.entityId,
          metadata: input.metadata,
          eventKey: `${input.eventKeyBase}:${admin.id}`,
        }),
      ),
    );
  }

  async notifyBookingCreatedForUser(booking: {
    id: string;
    bookingCode: string;
    userId?: string | null;
    hotelNameSnapshot: string;
    total: any;
    paymentStatus: string;
    status: string;
  }) {
    if (!booking.userId) return;

    await this.createForUser({
      recipientUserId: booking.userId,
      scope: 'user',
      kind: 'user_booking',
      title: `Da tiep nhan don ${booking.bookingCode}`,
      message: `Luxury Stay da ghi nhan yeu cau dat phong tai ${booking.hotelNameSnapshot}. Chung toi se cap nhat ngay khi trang thai thay doi.`,
      href: `/my-bookings/${booking.id}`,
      statusLabel: 'Moi tao',
      entityType: 'booking',
      entityId: booking.id,
      eventKey: `user-booking-created:${booking.id}:${booking.status}:${booking.paymentStatus}:${booking.userId}`,
      metadata: {
        bookingCode: booking.bookingCode,
        hotelNameSnapshot: booking.hotelNameSnapshot,
        total: Number(booking.total || 0),
      },
    });
  }

  async notifyBookingCreatedForAdmins(booking: {
    id: string;
    bookingCode: string;
    guestName: string;
    hotelNameSnapshot: string;
    total: any;
  }) {
    await this.createForAdmins({
      kind: 'admin_booking',
      title: `Don dat phong moi tu ${booking.guestName}`,
      message: `${booking.hotelNameSnapshot} • ${this.formatCurrency(Number(booking.total || 0))}`,
      href: `/admin/bookings/view/${booking.id}`,
      statusLabel: 'Moi tao',
      entityType: 'booking',
      entityId: booking.id,
      eventKeyBase: `admin-booking-created:${booking.id}`,
      metadata: {
        bookingCode: booking.bookingCode,
        guestName: booking.guestName,
        total: Number(booking.total || 0),
      },
    });
  }

  async notifyBookingStatusChangedForUser(booking: {
    id: string;
    bookingCode: string;
    userId?: string | null;
    hotelNameSnapshot: string;
    status: string;
    adminNote?: string | null;
  }) {
    if (!booking.userId) return;

    const config = this.getBookingStatusPresentation(booking.status, booking.hotelNameSnapshot, booking.adminNote);
    await this.createForUser({
      recipientUserId: booking.userId,
      scope: 'user',
      kind: 'user_booking',
      title: `${booking.bookingCode}: ${config.title}`,
      message: config.message,
      href: `/my-bookings/${booking.id}`,
      statusLabel: config.statusLabel,
      entityType: 'booking',
      entityId: booking.id,
      eventKey: `user-booking-status:${booking.id}:${booking.status}:${booking.userId}`,
      metadata: {
        bookingCode: booking.bookingCode,
        hotelNameSnapshot: booking.hotelNameSnapshot,
      },
    });
  }

  async notifyPaymentStatusChangedForUser(booking: {
    id: string;
    bookingCode: string;
    userId?: string | null;
    hotelNameSnapshot: string;
    paymentStatus: string;
    total: any;
    transactionId?: string | null;
    adminNote?: string | null;
  }) {
    if (!booking.userId) return;

    const config = this.getPaymentStatusPresentation(
      booking.paymentStatus,
      booking.hotelNameSnapshot,
      Number(booking.total || 0),
      booking.transactionId,
      booking.adminNote,
    );

    await this.createForUser({
      recipientUserId: booking.userId,
      scope: 'user',
      kind: 'user_payment',
      title: `${booking.bookingCode}: ${config.title}`,
      message: config.message,
      href: `/my-bookings/${booking.id}`,
      statusLabel: config.statusLabel,
      entityType: 'payment',
      entityId: booking.id,
      eventKey: `user-payment-status:${booking.id}:${booking.paymentStatus}:${booking.transactionId || 'na'}:${booking.userId}`,
      metadata: {
        bookingCode: booking.bookingCode,
        hotelNameSnapshot: booking.hotelNameSnapshot,
        total: Number(booking.total || 0),
      },
    });
  }

  async notifyPaymentStatusChangedForAdmins(booking: {
    id: string;
    bookingCode: string;
    guestName: string;
    hotelNameSnapshot: string;
    paymentStatus: string;
    total: any;
    transactionId?: string | null;
  }) {
    const config = this.getAdminPaymentStatusPresentation(
      booking.paymentStatus,
      booking.guestName,
      booking.hotelNameSnapshot,
      Number(booking.total || 0),
      booking.transactionId,
    );

    await this.createForAdmins({
      kind: 'admin_payment',
      title: config.title,
      message: config.message,
      href: `/admin/bookings/view/${booking.id}`,
      statusLabel: config.statusLabel,
      entityType: 'payment',
      entityId: booking.id,
      eventKeyBase: `admin-payment-status:${booking.id}:${booking.paymentStatus}:${booking.transactionId || 'na'}`,
      metadata: {
        bookingCode: booking.bookingCode,
        guestName: booking.guestName,
        total: Number(booking.total || 0),
      },
    });
  }

  async notifyContactCreatedForAdmins(contact: {
    id: string;
    name: string;
    subject: string;
    createdAt?: Date | string;
  }) {
    await this.createForAdmins({
      kind: 'admin_contact',
      title: `Lien he moi tu ${contact.name}`,
      message: contact.subject || 'Khach hang vua gui mot yeu cau moi.',
      href: `/admin/contact/view/${contact.id}`,
      statusLabel: 'Moi',
      entityType: 'contact',
      entityId: contact.id,
      eventKeyBase: `admin-contact-created:${contact.id}`,
      metadata: {
        subject: contact.subject,
      },
    });
  }

  async notifyContactReplyForUser(contact: {
    id: string;
    email: string;
    subject: string;
    replyMessage?: string | null;
  }) {
    const recipient = await this.prisma.appUser.findFirst({
      where: {
        email: {
          equals: contact.email,
          mode: 'insensitive',
        },
      },
      select: { id: true },
    });

    if (!recipient?.id) return;

    await this.createForUser({
      recipientUserId: recipient.id,
      scope: 'user',
      kind: 'contact_reply',
      title: `Da phan hoi yeu cau "${contact.subject}"`,
      message: contact.replyMessage?.trim() || 'Bo phan ho tro da gui phan hoi moi cho yeu cau cua ban.',
      href: `/support/messages/${contact.id}`,
      statusLabel: 'Da phan hoi',
      entityType: 'contact',
      entityId: contact.id,
      eventKey: `user-contact-reply:${contact.id}:${recipient.id}`,
      metadata: {
        subject: contact.subject,
      },
    });
  }

  private getBookingStatusPresentation(status: string, hotelName: string, note?: string | null) {
    switch (status) {
      case 'confirmed':
        return {
          title: 'Don dat phong da duoc xac nhan',
          message: note?.trim() || `Khach san ${hotelName} da xac nhan dat phong cua ban. Ban co the xem chi tiet de chuan bi cho ky nghi.`,
          statusLabel: 'Da xac nhan',
        };
      case 'checked_in':
        return {
          title: 'Ban da check-in thanh cong',
          message: note?.trim() || `Chuc ban co mot ky nghi tuyet voi tai ${hotelName}.`,
          statusLabel: 'Dang luu tru',
        };
      case 'checked_out':
        return {
          title: 'Don luu tru da hoan tat',
          message: note?.trim() || `Cam on ban da lua chon ${hotelName}. Hy quay lai bat cu luc nao.`,
          statusLabel: 'Hoan tat',
        };
      case 'cancelled':
        return {
          title: 'Don dat phong da bi huy',
          message: note?.trim() || `Dat phong tai ${hotelName} da duoc huy. Neu co hoan tien, he thong se thong bao tiep cho ban.`,
          statusLabel: 'Da huy',
        };
      case 'pending':
      default:
        return {
          title: 'Don dat phong dang cho xu ly',
          message: note?.trim() || `Yeu cau dat phong tai ${hotelName} dang duoc Luxury Stay xu ly.`,
          statusLabel: 'Cho xu ly',
        };
    }
  }

  private getPaymentStatusPresentation(
    paymentStatus: string,
    hotelName: string,
    total: number,
    transactionId?: string | null,
    note?: string | null,
  ) {
    switch (paymentStatus) {
      case 'paid':
        return {
          title: 'Thanh toan thanh cong',
          message:
            note?.trim() ||
            `Luxury Stay da nhan ${this.formatCurrency(total)} cho dat phong tai ${hotelName}${transactionId ? `. Ma giao dich: ${transactionId}.` : '.'}`,
          statusLabel: 'Da thanh toan',
        };
      case 'failed':
        return {
          title: 'Thanh toan that bai',
          message:
            note?.trim() ||
            `Giao dich cho ${hotelName} khong thanh cong. Ban co the thu lai hoac chon phuong thuc thanh toan khac.`,
          statusLabel: 'That bai',
        };
      case 'refunded':
        return {
          title: 'Tien da duoc hoan',
          message:
            note?.trim() ||
            `Khoan thanh toan cho ${hotelName} da duoc cap nhat hoan tien. Vui long kiem tra tai khoan nhan tien cua ban.`,
          statusLabel: 'Da hoan tien',
        };
      case 'cancelled':
        return {
          title: 'Thanh toan da bi huy',
          message:
            note?.trim() ||
            `Yeu cau thanh toan cho ${hotelName} da bi huy. Neu can ho tro, vui long lien he Luxury Stay.`,
          statusLabel: 'Da huy',
        };
      case 'pending':
      default:
        return {
          title: 'Thanh toan dang cho xu ly',
          message:
            note?.trim() ||
            `He thong dang cho xac nhan thanh toan cho dat phong tai ${hotelName}.`,
          statusLabel: 'Dang cho',
        };
    }
  }

  private getAdminPaymentStatusPresentation(
    paymentStatus: string,
    guestName: string,
    hotelName: string,
    total: number,
    transactionId?: string | null,
  ) {
    switch (paymentStatus) {
      case 'paid':
        return {
          title: `Thanh toan thanh cong tu ${guestName}`,
          message: `${hotelName} • ${this.formatCurrency(total)}${transactionId ? ` • GD ${transactionId}` : ''}`,
          statusLabel: 'Da thanh toan',
        };
      case 'refunded':
        return {
          title: `Da hoan tien cho ${guestName}`,
          message: `${hotelName} • ${this.formatCurrency(total)}`,
          statusLabel: 'Da hoan tien',
        };
      case 'failed':
        return {
          title: `Thanh toan that bai cua ${guestName}`,
          message: `${hotelName} • Can kiem tra lai giao dich`,
          statusLabel: 'That bai',
        };
      case 'cancelled':
        return {
          title: `Thanh toan bi huy cua ${guestName}`,
          message: `${hotelName} • Chua hoan tat giao dich`,
          statusLabel: 'Da huy',
        };
      case 'pending':
      default:
        return {
          title: `Thanh toan dang cho cua ${guestName}`,
          message: `${hotelName} • Dang doi cap nhat he thong`,
          statusLabel: 'Cho xu ly',
        };
    }
  }

  private formatCurrency(value: number) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
