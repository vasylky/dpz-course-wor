import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogModule } from '../catalog/catalog.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { PaymentsModule } from '../payments/payments.module';
import { User } from '../users/user.entity';
import { Booking } from './booking.entity';
import { BookingFacade } from './booking.facade';
import { BookingScheduler } from './booking.scheduler';
import { BookingsController } from './bookings.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, User]),
    CatalogModule,
    LoyaltyModule,
    MembershipsModule,
    PaymentsModule,
  ],
  controllers: [BookingsController],
  providers: [BookingFacade, BookingScheduler],
  exports: [BookingFacade, BookingScheduler],
})
export class BookingsModule {}
