import { Body, Controller, Get, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateMomoPaymentDto } from './dto/create-momo-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('momo/create')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  createMomoPayment(
    @CurrentUser() user: any,
    @Body() dto: CreateMomoPaymentDto,
  ) {
    const userId = user?.userId || user?.sub || user?.id;
    return this.paymentsService.createMomoPayment(userId, dto);
  }

  @Get('momo/status/:bookingId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getMomoStatus(
    @CurrentUser() user: any,
    @Param('bookingId') bookingId: string,
  ) {
    const userId = user?.userId || user?.sub || user?.id;
    return this.paymentsService.getPaymentStatus(userId, bookingId);
  }

  @Get('momo/return')
  async momoReturn(@Query() query: Record<string, string>, @Res() res: Response) {
    const redirectUrl = await this.paymentsService.handleMomoReturn(query);
    return res.redirect(redirectUrl);
  }

  @Post('momo/ipn')
  async momoIpn(@Body() body: Record<string, any>) {
    await this.paymentsService.handleMomoIpn(body);
    return { resultCode: 0, message: 'OK' };
  }
}
