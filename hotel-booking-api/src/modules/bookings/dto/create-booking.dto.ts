import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString, IsInt } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsDateString()
  checkIn: string;

  @IsDateString()
  checkOut: string;

  @IsInt()
  guests: number;

  @IsInt()
  roomsCount: number;

  @IsInt()
  nights: number;

  @IsString()
  @IsNotEmpty()
  guestName: string;

  @IsString()
  @IsNotEmpty()
  guestEmail: string;

  @IsString()
  @IsNotEmpty()
  guestPhone: string;

  @IsOptional()
  @IsString()
  specialRequest?: string;

  @IsNumber()
  subtotal: number;

  @IsNumber()
  tax: number;

  @IsNumber()
  discount: number;

  @IsNumber()
  total: number;

  @IsOptional()
  @IsString()
  promoCode?: string;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string;
}
