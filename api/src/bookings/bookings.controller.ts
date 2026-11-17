import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post } from '@nestjs/common';
import { Auth, type AuthUser, CurrentUser } from '../common/auth/auth.decorators';
import { CreateBookingDto, PayBookingDto } from './booking.dto';
import { BookingFacade } from './booking.facade';

@Controller('bookings')
@Auth()
export class BookingsController {
  constructor(private readonly facade: BookingFacade) {}

  @Post('quote')
  @HttpCode(200)
  quote(@CurrentUser() user: AuthUser, @Body() dto: CreateBookingDto) {
    return this.facade.quote(user.id, dto);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBookingDto) {
    return this.facade.create(user.id, dto);
  }

  @Get('me')
  mine(@CurrentUser() user: AuthUser) {
    return this.facade.mine(user.id);
  }

  @Get(':id')
  one(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.facade.one(user.id, id);
  }

  @Post(':id/pay')
  @HttpCode(200)
  pay(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: PayBookingDto) {
    return this.facade.pay(user.id, id, dto.card);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  cancel(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.facade.cancel(user.id, id);
  }
}
