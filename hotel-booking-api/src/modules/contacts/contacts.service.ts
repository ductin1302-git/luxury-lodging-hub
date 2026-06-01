import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly aiService: AiService,
  ) {}

  async create(data: any) {
    await this.aiService.assertTextAllowed(
      `${String(data.subject || '')}\n${String(data.message || '')}`,
      'vi',
    );

    const contact = await this.prisma.contact.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        subject: data.subject,
        message: data.message,
        status: 'new',
      },
    });

    await this.dispatchNotification('notify contact created for admins', () =>
      this.notificationsService.notifyContactCreatedForAdmins(contact),
    );

    return contact;
  }

  async findAll() {
    return this.prisma.contact.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.contact.findMany({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByEmailAndId(email: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: {
        id,
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
    });

    if (!contact) {
      throw new NotFoundException('Liên hệ không tồn tại');
    }

    return contact;
  }

  async findById(id: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      throw new NotFoundException('Liên hệ không tồn tại');
    }

    return contact;
  }

  async update(id: string, data: { status?: 'new' | 'read' | 'replied'; replyMessage?: string }) {
    const existing = await this.findById(id);

    const nextStatus = data.status || existing.status;
    const trimmedReply = data.replyMessage?.trim();

    const updated = await this.prisma.contact.update({
      where: { id },
      data: {
        status: nextStatus,
        replyMessage: trimmedReply !== undefined ? trimmedReply : existing.replyMessage,
        repliedAt: nextStatus === 'replied' ? new Date() : existing.repliedAt,
      },
    });

    if (updated.status === 'replied' && updated.replyMessage?.trim()) {
      await this.dispatchNotification('notify contact reply for user', () =>
        this.notificationsService.notifyContactReplyForUser(updated),
      );
    }

    return updated;
  }

  async remove(id: string) {
    await this.findById(id);

    return this.prisma.contact.delete({
      where: { id },
    });
  }

  private async dispatchNotification(label: string, task: () => Promise<unknown>) {
    try {
      await task();
    } catch (error) {
      console.error(`[Notifications] ${label} failed`, error);
    }
  }
}
