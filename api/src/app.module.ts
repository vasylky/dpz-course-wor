import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { CatalogModule } from './catalog/catalog.module';
import { EventsModule } from './common/events/event-publisher';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { MembershipsModule } from './memberships/memberships.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { PromotionsModule } from './promotions/promotions.module';
import { SeedService } from './seed/seed.service';
import { UPLOAD_DIR } from './users/users.controller';
import { UsersModule } from './users/users.module';

const uploads = resolve(UPLOAD_DIR);
if (!existsSync(uploads)) mkdirSync(uploads, { recursive: true });
const webDist = process.env.WEB_DIST ?? join(__dirname, '..', '..', 'web', 'dist');

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../.env'] }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL', 'postgres://sport:sport@localhost:5433/sport'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot(
      { rootPath: uploads, serveRoot: '/uploads' },
      ...(existsSync(webDist) ? [{ rootPath: webDist, exclude: ['/api/{*path}', '/uploads/{*path}'] }] : []),
    ),
    EventsModule,
    AuthModule,
    UsersModule,
    CatalogModule,
    PaymentsModule,
    LoyaltyModule,
    MembershipsModule,
    BookingsModule,
    NotificationsModule,
    PromotionsModule,
    AdminModule,
  ],
  providers: [SeedService],
})
export class AppModule {}
