import { OltVendor } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateOltDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(OltVendor)
  vendor: OltVendor;

  @IsString()
  @IsNotEmpty()
  host: string;

  @IsInt()
  @Min(1)
  port: number;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}