import { OltVendor } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateOltDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(OltVendor)
  @IsOptional()
  vendor?: OltVendor;

  @IsString()
  @IsOptional()
  host?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  port?: number;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}