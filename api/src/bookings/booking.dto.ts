import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  Matches,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { CardDto } from '../payments/payment.dto';
import type { BookingKind } from './booking.entity';

export class CreateBookingDto {
  @IsIn(['hall', 'section'])
  kind: BookingKind;

  @ValidateIf((o: CreateBookingDto) => o.kind === 'section')
  @IsInt()
  sessionId?: number;

  @ValidateIf((o: CreateBookingDto) => o.kind === 'hall')
  @IsInt()
  hallId?: number;

  @ValidateIf((o: CreateBookingDto) => o.kind === 'hall')
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;

  @ValidateIf((o: CreateBookingDto) => o.kind === 'hall')
  @IsInt()
  @Min(0)
  @Max(23)
  hour?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  hours?: number;

  @IsOptional()
  @IsBoolean()
  useBonus?: boolean;

  @IsOptional()
  @IsBoolean()
  useMembership?: boolean;
}

export class PayBookingDto {
  @ValidateNested()
  @Type(() => CardDto)
  card: CardDto;
}
