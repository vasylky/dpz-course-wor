import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Matches } from 'class-validator';
import { CatalogService } from './catalog.service';
import { AGE_GROUPS, type AgeGroup, LEVELS, type Level } from './entities/section.entity';

class SectionQuery {
  @IsOptional() @IsString() sport?: string;
  @IsOptional() @IsIn(LEVELS) level?: Level;
  @IsOptional() @IsIn(AGE_GROUPS) ageGroup?: AgeGroup;
  @IsOptional() @Type(() => Number) @IsInt() centerId?: number;
  @IsOptional() @Type(() => Number) @IsInt() trainerId?: number;
  @IsOptional() @IsString() q?: string;
}

class HallQuery {
  @IsOptional() @IsString() sport?: string;
  @IsOptional() @Type(() => Number) @IsInt() centerId?: number;
}

class DayQuery {
  @Matches(/^\d{4}-\d{2}-\d{2}$/) date: string;
}

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('sports')
  sports() {
    return this.catalog.listSports();
  }

  @Get('centers')
  centers() {
    return this.catalog.listCenters();
  }

  @Get('trainers')
  trainers() {
    return this.catalog.listTrainers();
  }

  @Get('structure')
  structure() {
    return this.catalog.structure();
  }

  @Get('sections')
  sections(@Query() q: SectionQuery) {
    return this.catalog.listSections(q);
  }

  @Get('sections/:id')
  section(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.section(id);
  }

  @Get('halls')
  halls(@Query() q: HallQuery) {
    return this.catalog.listHalls(q.sport, q.centerId);
  }

  @Get('halls/:id')
  hall(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.hall(id);
  }

  @Get('halls/:id/availability')
  availability(@Param('id', ParseIntPipe) id: number, @Query() q: DayQuery) {
    return this.catalog.hallAvailability(id, q.date);
  }
}
