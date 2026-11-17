import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Repository } from 'typeorm';
import { Auth, type AuthUser, CurrentUser } from '../common/auth/auth.decorators';
import { PaymentsService } from '../payments/payments.service';
import { User } from './user.entity';

export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? 'uploads';

class PreferencesDto {
  @IsOptional() @IsArray() @IsString({ each: true }) sports?: string[];
  @IsOptional() @IsInt() @Min(1) @Max(48) remindBeforeHours?: number;
  @IsOptional() @IsBoolean() promoNotifications?: boolean;
}

class UpdateProfileDto {
  @IsOptional() @IsString() @MinLength(2) fullName?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @ValidateNested() @Type(() => PreferencesDto) preferences?: PreferencesDto;
}

@Controller('users/me')
@Auth()
export class UsersController {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly payments: PaymentsService,
  ) {}

  @Get()
  me(@CurrentUser() user: AuthUser) {
    return this.users.findOneByOrFail({ id: user.id });
  }

  @Patch()
  async update(@CurrentUser() auth: AuthUser, @Body() dto: UpdateProfileDto) {
    const user = await this.users.findOneByOrFail({ id: auth.id });
    if (dto.fullName !== undefined) user.fullName = dto.fullName;
    if (dto.phone !== undefined) user.phone = dto.phone || null;
    if (dto.preferences) user.preferences = { ...user.preferences, ...dto.preferences };
    return this.users.save(user);
  }

  @Post('photo')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
      }),
      limits: { fileSize: 3 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => cb(null, /^image\/(png|jpe?g|webp|gif)$/.test(file.mimetype)),
    }),
  )
  async photo(@CurrentUser() auth: AuthUser, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Завантажте зображення до 3 МБ');
    await this.users.update(auth.id, { photoUrl: `/uploads/${file.filename}` });
    return this.users.findOneByOrFail({ id: auth.id });
  }

  @Get('payments')
  paymentHistory(@CurrentUser() auth: AuthUser) {
    return this.payments.forUser(auth.id);
  }
}
