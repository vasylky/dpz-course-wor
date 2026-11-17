import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../bookings/booking.entity';
import { BookingsModule } from '../bookings/bookings.module';
import { CATALOG_ENTITIES, CatalogModule } from '../catalog/catalog.module';
import { Payment } from '../payments/payment.entity';
import { Promotion } from '../promotions/promotion.entity';
import { User } from '../users/user.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([...CATALOG_ENTITIES, Promotion, User, Booking, Payment]),
    CatalogModule,
    BookingsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
