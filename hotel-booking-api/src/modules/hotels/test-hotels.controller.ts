import { Controller, Get, Query } from '@nestjs/common';
import { HotelsService } from './hotels.service';
import { QueryHotelsDto } from './dto/query-hotels.dto';

@Controller('test-hotels')
export class TestHotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @Get()
  findAllAdmin(@Query() query: QueryHotelsDto) {
    return this.hotelsService.findAllAdmin(query);
  }
}
