import { IsString, IsNotEmpty, IsInt, IsNumber, IsOptional, Min, Max, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHotelDto {
  @ApiProperty({ example: 'Khách sạn Luxury', description: 'Tên khách sạn' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '123 Đường Bờ Biển', description: 'Địa chỉ cụ thể' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ example: 'Nha Trang', description: 'Thành phố' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 5, description: 'Số sao' })
  @IsInt()
  @Min(1)
  @Max(5)
  stars: number;

  @ApiProperty({ example: 'Khách sạn tuyệt đẹp...', description: 'Mô tả chi tiết' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'Nghỉ dưỡng 5 sao', description: 'Mô tả ngắn' })
  @IsString()
  @IsNotEmpty()
  shortDescription: string;

  @ApiProperty({ example: 2000000, description: 'Giá mỗi đêm (thấp nhất)' })
  @IsNumber()
  @Min(0)
  pricePerNight: number;

  @ApiPropertyOptional({ example: ['https://example.com/h1.jpg'], description: 'Hình ảnh khách sạn' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  popular?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  promoted?: boolean;

  @ApiPropertyOptional({ example: ['Wifi', 'Hồ bơi'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({ example: 'Quận 1', description: 'Quận/Huyện' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ example: 'Phường Bến Nghé', description: 'Phường/Xã' })
  @IsOptional()
  @IsString()
  ward?: string;
}
