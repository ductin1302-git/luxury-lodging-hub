import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryHotelsDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'beach resort da nang' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: 'Da Nang' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    example: 'hotel',
    enum: ['hotel', 'resort', 'villa', 'apartment', 'homestay'],
  })
  @IsOptional()
  @IsIn(['hotel', 'resort', 'villa', 'apartment', 'homestay'])
  hotelType?: 'hotel' | 'resort' | 'villa' | 'apartment' | 'homestay';

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  stars?: number;

  @ApiPropertyOptional({ example: 1000000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ example: 3000000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ example: '2026-06-10' })
  @IsOptional()
  @IsDateString()
  checkIn?: string;

  @ApiPropertyOptional({ example: '2026-06-12' })
  @IsOptional()
  @IsDateString()
  checkOut?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  guests?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  rooms?: number;

  @ApiPropertyOptional({ example: 'WiFi mien phi,Ho boi' })
  @IsOptional()
  @IsString()
  amenities?: string;

  @ApiPropertyOptional({
    example: 'popular',
    enum: ['popular', 'price_asc', 'price_desc', 'rating_desc'],
  })
  @IsOptional()
  @IsIn(['popular', 'price_asc', 'price_desc', 'rating_desc'])
  sort?: 'popular' | 'price_asc' | 'price_desc' | 'rating_desc';
}
