import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import type { BookingStatus } from '../bookings/booking.entity';
import { BookingFacade } from '../bookings/booking.facade';
import { CatalogService } from '../catalog/catalog.service';
import { Auth, type AuthUser, CurrentUser } from '../common/auth/auth.decorators';
import {
  AdminUserDto,
  CenterDto,
  HallDto,
  PromotionDto,
  SectionDto,
  SessionDto,
  SportDto,
  TrainerDto,
} from './admin.dto';
import { AdminService } from './admin.service';

@Controller('admin')
@Auth('admin')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly catalog: CatalogService,
    private readonly bookings: BookingFacade,
  ) {}

  @Get('stats')
  stats() {
    return this.admin.stats();
  }

  @Post('sports')
  createSport(@Body() dto: SportDto) {
    return this.admin.saveSport(dto);
  }

  @Patch('sports/:id')
  updateSport(@Param('id', ParseIntPipe) id: number, @Body() dto: SportDto) {
    return this.admin.saveSport(dto, id);
  }

  @Delete('sports/:id')
  deleteSport(@Param('id', ParseIntPipe) id: number) {
    return this.admin.remove(this.admin.sports, id);
  }

  @Post('centers')
  createCenter(@Body() dto: CenterDto) {
    return this.admin.saveCenter(dto);
  }

  @Patch('centers/:id')
  updateCenter(@Param('id', ParseIntPipe) id: number, @Body() dto: CenterDto) {
    return this.admin.saveCenter(dto, id);
  }

  @Delete('centers/:id')
  deleteCenter(@Param('id', ParseIntPipe) id: number) {
    return this.admin.remove(this.admin.centers, id);
  }

  @Post('halls')
  createHall(@Body() dto: HallDto) {
    return this.admin.saveHall(dto);
  }

  @Patch('halls/:id')
  updateHall(@Param('id', ParseIntPipe) id: number, @Body() dto: HallDto) {
    return this.admin.saveHall(dto, id);
  }

  @Delete('halls/:id')
  deleteHall(@Param('id', ParseIntPipe) id: number) {
    return this.admin.remove(this.admin.halls, id);
  }

  @Post('trainers')
  createTrainer(@Body() dto: TrainerDto) {
    return this.admin.saveTrainer(dto);
  }

  @Patch('trainers/:id')
  updateTrainer(@Param('id', ParseIntPipe) id: number, @Body() dto: TrainerDto) {
    return this.admin.saveTrainer(dto, id);
  }

  @Delete('trainers/:id')
  deleteTrainer(@Param('id', ParseIntPipe) id: number) {
    return this.admin.remove(this.admin.trainers, id);
  }

  @Get('sections')
  sections() {
    return this.catalog.listSections({ includeInactive: true });
  }

  @Post('sections')
  createSection(@Body() dto: SectionDto) {
    return this.admin.saveSection(dto);
  }

  @Patch('sections/:id')
  updateSection(@Param('id', ParseIntPipe) id: number, @Body() dto: SectionDto) {
    return this.admin.saveSection(dto, id);
  }

  @Delete('sections/:id')
  deleteSection(@Param('id', ParseIntPipe) id: number) {
    return this.admin.remove(this.admin.sections, id);
  }

  @Get('sessions')
  sessions(@Query('sectionId', ParseIntPipe) sectionId: number) {
    return this.admin.listSessions(sectionId);
  }

  @Post('sessions')
  createSessions(@Body() dto: SessionDto) {
    return this.admin.createSessions(dto);
  }

  @Delete('sessions/:id')
  deleteSession(@Param('id', ParseIntPipe) id: number) {
    return this.admin.remove(this.admin.sessions, id);
  }

  @Post('promotions')
  createPromotion(@Body() dto: PromotionDto) {
    return this.admin.createPromotion(dto);
  }

  @Delete('promotions/:id')
  deletePromotion(@Param('id', ParseIntPipe) id: number) {
    return this.admin.remove(this.admin.promotions, id);
  }

  @Get('users')
  users() {
    return this.admin.listUsers();
  }

  @Patch('users/:id')
  updateUser(@Param('id', ParseIntPipe) id: number, @Body() dto: AdminUserDto) {
    return this.admin.updateUser(id, dto);
  }

  @Get('bookings')
  listBookings(@Query('status') status?: BookingStatus) {
    return this.bookings.listAll(status);
  }

  @Post('bookings/:id/cancel')
  @HttpCode(200)
  cancelBooking(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.bookings.cancel(user.id, id, true);
  }
}
