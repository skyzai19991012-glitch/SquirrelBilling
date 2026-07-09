import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePackageDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(1)
  downloadMbps: number;

  @IsInt()
  @Min(1)
  uploadMbps: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @IsNotEmpty()
  mikrotikProfile: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}