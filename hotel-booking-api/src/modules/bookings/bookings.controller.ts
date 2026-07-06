import {
  Controller, Get, Post, Patch, Body, UseGuards,
  Request, Param, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateBookingStatusDto, UpdatePaymentStatusDto } from './dto/update-booking.dto';

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@Request() req: any, @Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(req.user.userId, createBookingDto);
  }

  // ─── ADMIN routes ──────────────────────────────────────────
  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  findAll(
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.bookingsService.findAll({ status, paymentStatus, paymentMethod, dateFrom, dateTo, search, page, limit });
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('admin')
  getStats() {
    return this.bookingsService.getStats();
  }

  @Get('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  findOneAdmin(@Param('id') id: string) {
    return this.bookingsService.findOneAdmin(id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('admin')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateBookingStatusDto) {
    return this.bookingsService.updateBookingStatus(id, dto);
  }

  @Patch(':id/payment-status')
  @UseGuards(RolesGuard)
  @Roles('admin')
  updatePaymentStatus(@Param('id') id: string, @Body() dto: UpdatePaymentStatusDto) {
    return this.bookingsService.updatePaymentStatus(id, dto);
  }

  @Patch(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles('admin')
  cancelBooking(@Param('id') id: string, @Body() body: { note?: string }) {
    return this.bookingsService.cancelBooking(id, body.note);
  }

  // ─── Customer routes ────────────────────────────────────────
  @Get('my-bookings')
  findMyBookings(@Request() req: any) {
    return this.bookingsService.findByUser(req.user.userId);
  }

  @Post(':id/review')
  createReview(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.bookingsService.createReview(req.user.userId, id, dto);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.bookingsService.findOne(req.user.userId, id);
  }
}
