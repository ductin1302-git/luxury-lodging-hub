import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('user')
  async listUserNotifications(@CurrentUser() user: { userId: string }) {
    return this.notificationsService.listUserNotifications(user.userId);
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('admin', 'staff')
  async listAdminNotifications(@CurrentUser() user: { userId: string }) {
    return this.notificationsService.listAdminNotifications(user.userId);
  }

  @Patch(':id/read')
  async markAsRead(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(user.userId, id);
  }

  @Patch('read-all/user')
  async markAllUserAsRead(@CurrentUser() user: { userId: string }) {
    return this.notificationsService.markAllAsRead(user.userId, 'user');
  }

  @Patch('read-all/admin')
  @UseGuards(RolesGuard)
  @Roles('admin', 'staff')
  async markAllAdminAsRead(@CurrentUser() user: { userId: string }) {
    return this.notificationsService.markAllAsRead(user.userId, 'admin');
  }
}
