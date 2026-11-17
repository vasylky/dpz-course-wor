import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { AGE_GROUPS, type AgeGroup, LEVELS, type Level } from '../catalog/entities/section.entity';
import type { LoyaltyTier, UserRole } from '../users/user.entity';

export class SportDto {
  @IsString() @MinLength(2) name: string;
  @IsString() @MinLength(2) slug: string;
  @IsOptional() @IsBoolean() premiumIncluded?: boolean;
}

export class CenterDto {
  @IsString() @MinLength(2) name: string;
  @IsString() city: string;
  @IsString() address: string;
  @IsOptional() @IsString() description?: string;
}

export class HallDto {
  @IsString() @MinLength(2) name: string;
  @IsInt() centerId: number;
  @IsOptional() @IsInt() sportId?: number | null;
  @IsInt() @Min(1) capacity: number;
  @Type(() => Number) @IsNumber() @Min(0) pricePerHour: number;
  @IsOptional() @IsInt() @Min(0) @Max(23) openHour?: number;
  @IsOptional() @IsInt() @Min(1) @Max(24) closeHour?: number;
  @IsOptional() @IsString() description?: string;
}

export class TrainerDto {
  @IsString() @MinLength(2) fullName: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsInt() @Min(0) experienceYears?: number;
  @IsOptional() @IsInt() sportId?: number | null;
  @IsOptional() @IsString() photoUrl?: string;
}

export class SectionDto {
  @IsString() @MinLength(2) name: string;
  @IsOptional() @IsString() description?: string;
  @IsInt() sportId: number;
  @IsInt() hallId: number;
  @IsOptional() @IsInt() trainerId?: number | null;
  @IsIn(LEVELS) level: Level;
  @IsIn(AGE_GROUPS) ageGroup: AgeGroup;
  @IsInt() @Min(1) capacity: number;
  @Type(() => Number) @IsNumber() @Min(0) pricePerVisit: number;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class SessionDto {
  @IsInt() sectionId: number;
  @IsDateString() startsAt: string;
  @IsOptional() @IsInt() @Min(15) @Max(240) durationMin?: number;
  @IsOptional() @IsInt() @Min(1) @Max(12) repeatWeeks?: number;
}

export class PromotionDto {
  @IsString() @MinLength(3) title: string;
  @IsString() description: string;
  @IsOptional() @IsDateString() validTo?: string;
}

export class AdminUserDto {
  @IsOptional() @IsIn(['client', 'admin']) role?: UserRole;
  @IsOptional() @IsIn(['standard', 'premium', 'corporate']) loyaltyTier?: LoyaltyTier;
  @IsOptional() @IsInt() @Min(0) bonusPoints?: number;
  @IsOptional() @IsString() companyName?: string;
}
