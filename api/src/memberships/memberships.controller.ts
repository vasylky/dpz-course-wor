import { Body, Controller, Get, Post } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Auth, type AuthUser, CurrentUser } from '../common/auth/auth.decorators';
import { CardDto } from '../payments/payment.dto';
import type { MembershipType } from './membership.entity';
import { MembershipsService } from './memberships.service';

class PurchaseDto {
  @IsIn(['single', 'monthly', 'corporate'])
  type: MembershipType;

  @IsOptional()
  @IsString()
  companyName?: string;

  @ValidateNested()
  @Type(() => CardDto)
  card: CardDto;
}

@Controller('memberships')
export class MembershipsController {
  constructor(private readonly memberships: MembershipsService) {}

  @Get('plans')
  plans() {
    return this.memberships.plans();
  }

  @Get('me')
  @Auth()
  mine(@CurrentUser() user: AuthUser) {
    return this.memberships.mine(user.id);
  }

  @Post()
  @Auth()
  purchase(@CurrentUser() user: AuthUser, @Body() dto: PurchaseDto) {
    return this.memberships.purchase(user.id, dto.type, dto.card, dto.companyName);
  }
}
