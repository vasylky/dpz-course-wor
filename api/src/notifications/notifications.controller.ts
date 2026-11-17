import { Controller, Get, HttpCode, Param, ParseIntPipe, Post } from '@nestjs/common';
import { Auth, type AuthUser, CurrentUser } from '../common/auth/auth.decorators';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@Auth()
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.notifications.list(user.id);
  }

  @Get('unread')
  unread(@CurrentUser() user: AuthUser) {
    return this.notifications.unread(user.id);
  }

  @Post('read-all')
  @HttpCode(200)
  readAll(@CurrentUser() user: AuthUser) {
    return this.notifications.markRead(user.id);
  }

  @Post(':id/read')
  @HttpCode(200)
  read(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.notifications.markRead(user.id, id);
  }
}
