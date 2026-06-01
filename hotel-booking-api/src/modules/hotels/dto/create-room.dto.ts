import { IsString, IsNotEmpty, IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty({ example: 'Phòng Deluxe Hướng Biển', description: 'Tên phòng' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg', description: 'Hình ảnh chính của phòng' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ type: [String], description: 'Danh sách hình ảnh chi tiết của phòng' })
  @IsOptional()
  images?: string[];

  @ApiProperty({ example: 2, description: 'Số khách tối đa' })
  @IsInt()
  @Min(1)
  maxGuests: number;

  @ApiProperty({ example: 1500000, description: 'Giá mỗi đêm' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 'Phòng sang trọng với ban công riêng...', description: 'Mô tả phòng' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 45, description: 'Kích thước phòng (m2)' })
  @IsInt()
  @Min(1)
  size: number;
}
