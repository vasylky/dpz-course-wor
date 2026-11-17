import { Body, Controller, Get, Post } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Auth, type AuthUser, CurrentUser } from '../common/auth/auth.decorators';
import { CardDto } from '../payments/payment.dto';
import type { LoyaltyTier } from '../users/user.entity';
import { LoyaltyService } from './loyalty.service';

class UpgradeDto {
  @IsIn(['premium', 'corporate'])
  tier: LoyaltyTier;

  @IsOptional()
  @IsString()
  companyName?: string;

  @ValidateNested()
  @Type(() => CardDto)
  card: CardDto;
}

@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyalty: LoyaltyService) {}

  @Get('cards')
  cards() {
    return this.loyalty.cards();
  }

  @Get('me')
  @Auth()
  me(@CurrentUser() user: AuthUser) {
    return this.loyalty.summary(user.id);
  }

  @Post('upgrade')
  @Auth()
  upgrade(@CurrentUser() user: AuthUser, @Body() dto: UpgradeDto) {
    return this.loyalty.upgrade(user.id, dto.tier, dto.card, dto.companyName);
  }
}
