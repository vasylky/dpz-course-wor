import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { Promotion } from './promotion.entity';

@Controller('promotions')
export class PromotionsController {
  constructor(@InjectRepository(Promotion) private readonly repo: Repository<Promotion>) {}

  @Get()
  active() {
    return this.repo.find({
      where: [{ validTo: IsNull() }, { validTo: MoreThan(new Date()) }],
      order: { createdAt: 'DESC' },
    });
  }
}
