import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../bookings/booking.entity';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { Hall } from './entities/hall.entity';
import { SectionSession } from './entities/section-session.entity';
import { Section } from './entities/section.entity';
import { Sport } from './entities/sport.entity';
import { SportsCenter } from './entities/sports-center.entity';
import { Trainer } from './entities/trainer.entity';

export const CATALOG_ENTITIES = [Sport, SportsCenter, Hall, Trainer, Section, SectionSession];

@Module({
  imports: [TypeOrmModule.forFeature([...CATALOG_ENTITIES, Booking])],
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService, TypeOrmModule],
})
export class CatalogModule {}
