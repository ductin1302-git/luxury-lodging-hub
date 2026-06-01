import { Body, Controller, Delete, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { AdminReviewQueryDto } from './dto/admin-review-query.dto';
import { UpdateReviewVisibilityDto } from './dto/update-review-visibility.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews')
@ApiBearerAuth()
@Controller('reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('admin')
  @Roles('admin', 'staff')
  findAllAdmin(@Query() query: AdminReviewQueryDto) {
    return this.reviewsService.findAllAdmin(query);
  }

  @Patch('admin/:id/visibility')
  @Roles('admin', 'staff')
  updateVisibility(@Param('id') id: string, @Body() dto: UpdateReviewVisibilityDto) {
    return this.reviewsService.updateVisibility(id, dto.isVisible);
  }

  @Delete('admin/:id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}
