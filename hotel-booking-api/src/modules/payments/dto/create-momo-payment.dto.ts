import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateMomoPaymentDto {
  @IsString()
  bookingId: string;

  @IsOptional()
  @IsIn(['full', 'deposit'])
  paymentOption?: 'full' | 'deposit';
}
