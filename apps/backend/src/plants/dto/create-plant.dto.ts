import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlantHealth } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreatePlantDto {
  @ApiProperty()
  @IsUUID()
  zoneId!: string;

  @ApiProperty({ example: 'Hass Avocado' })
  @IsString()
  @MinLength(2)
  species!: string;

  @ApiProperty()
  @IsDateString()
  plantedAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  plantIndex?: number;

  @ApiPropertyOptional({ enum: PlantHealth })
  @IsOptional()
  @IsEnum(PlantHealth)
  health?: PlantHealth;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  statusNote?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  estimatedHarvestAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  currentYieldEstimate?: number;
}
