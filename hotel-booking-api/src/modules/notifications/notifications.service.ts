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
      throw new NotFoundException('Thông báo không tồn tại.');
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
      title: `Đã tiếp nhận đơn ${booking.bookingCode}`,
      message: `Luxury Stay đã ghi nhận yêu cầu đặt phòng tại ${booking.hotelNameSnapshot}. Chúng tôi sẽ cập nhật ngay khi trạng thái thay đổi.`,
      href: `/my-bookings/${booking.id}`,
      statusLabel: 'Mới tạo',
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
      title: `Đơn đặt phòng mới từ ${booking.guestName}`,
      message: `${booking.hotelNameSnapshot} • ${this.formatCurrency(Number(booking.total || 0))}`,
      href: `/admin/bookings/view/${booking.id}`,
      statusLabel: 'Mới tạo',
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
      title: `Liên hệ mới từ ${contact.name}`,
      message: contact.subject || 'Khách hàng vừa gửi một yêu cầu mới.',
      href: `/admin/contact/view/${contact.id}`,
      statusLabel: 'Mới',
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
      title: `Đã phản hồi yêu cầu "${contact.subject}"`,
      message: contact.replyMessage?.trim() || 'Bộ phận hỗ trợ đã gửi phản hồi mới cho yêu cầu của bạn.',
      href: `/support/messages/${contact.id}`,
      statusLabel: 'Đã phản hồi',
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
          title: 'Đơn đặt phòng đã được xác nhận',
          message: note?.trim() || `Khách sạn ${hotelName} đã xác nhận đặt phòng của bạn. Bạn có thể xem chi tiết để chuẩn bị cho kỳ nghỉ.`,
          statusLabel: 'Đã xác nhận',
        };
      case 'checked_in':
        return {
          title: 'Bạn đã check-in thành công',
          message: note?.trim() || `Chúc bạn có một kỳ nghỉ tuyệt vời tại ${hotelName}.`,
          statusLabel: 'Đang lưu trú',
        };
      case 'checked_out':
        return {
          title: 'Đơn lưu trú đã hoàn tất',
          message: note?.trim() || `Cảm ơn bạn đã lựa chọn ${hotelName}. Hãy quay lại bất cứ lúc nào.`,
          statusLabel: 'Hoàn tất',
        };
      case 'cancelled':
        return {
          title: 'Đơn đặt phòng đã bị hủy',
          message: note?.trim() || `Đặt phòng tại ${hotelName} đã được hủy. Nếu có hoàn tiền, hệ thống sẽ thông báo tiếp cho bạn.`,
          statusLabel: 'Đã hủy',
        };
      case 'pending':
      default:
        return {
          title: 'Đơn đặt phòng đang chờ xử lý',
          message: note?.trim() || `Yêu cầu đặt phòng tại ${hotelName} đang được Luxury Stay xử lý.`,
          statusLabel: 'Chờ xử lý',
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
          title: 'Thanh toán thành công',
          message:
            note?.trim() ||
            `Luxury Stay đã nhận ${this.formatCurrency(total)} cho đặt phòng tại ${hotelName}${transactionId ? `. Mã giao dịch: ${transactionId}.` : '.'}`,
          statusLabel: 'Đã thanh toán',
        };
      case 'failed':
        return {
          title: 'Thanh toán thất bại',
          message:
            note?.trim() ||
            `Giao dịch cho ${hotelName} không thành công. Bạn có thể thử lại hoặc chọn phương thức thanh toán khác.`,
          statusLabel: 'Thất bại',
        };
      case 'refunded':
        return {
          title: 'Tiền đã được hoàn',
          message:
            note?.trim() ||
            `Khoản thanh toán cho ${hotelName} đã được cập nhật hoàn tiền. Vui lòng kiểm tra tài khoản nhận tiền của bạn.`,
          statusLabel: 'Đã hoàn tiền',
        };
      case 'cancelled':
        return {
          title: 'Thanh toán đã bị hủy',
          message:
            note?.trim() ||
            `Yêu cầu thanh toán cho ${hotelName} đã bị hủy. Nếu cần hỗ trợ, vui lòng liên hệ Luxury Stay.`,
          statusLabel: 'Đã hủy',
        };
      case 'pending':
      default:
        return {
          title: 'Thanh toán đang chờ xử lý',
          message:
            note?.trim() ||
            `Hệ thống đang chờ xác nhận thanh toán cho đặt phòng tại ${hotelName}.`,
          statusLabel: 'Đang chờ',
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
          title: `Thanh toán thành công từ ${guestName}`,
          message: `${hotelName} • ${this.formatCurrency(total)}${transactionId ? ` • GD ${transactionId}` : ''}`,
          statusLabel: 'Đã thanh toán',
        };
      case 'refunded':
        return {
          title: `Đã hoàn tiền cho ${guestName}`,
          message: `${hotelName} • ${this.formatCurrency(total)}`,
          statusLabel: 'Đã hoàn tiền',
        };
      case 'failed':
        return {
          title: `Thanh toán thất bại của ${guestName}`,
          message: `${hotelName} • Cần kiểm tra lại giao dịch`,
          statusLabel: 'Thất bại',
        };
      case 'cancelled':
        return {
          title: `Thanh toán bị hủy của ${guestName}`,
          message: `${hotelName} • Chưa hoàn tất giao dịch`,
          statusLabel: 'Đã hủy',
        };
      case 'pending':
      default:
        return {
          title: `Thanh toán đang chờ của ${guestName}`,
          message: `${hotelName} • Đang đợi cập nhật hệ thống`,
          statusLabel: 'Chờ xử lý',
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
