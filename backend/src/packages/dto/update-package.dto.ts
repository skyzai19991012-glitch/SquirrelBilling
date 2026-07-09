import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdatePackageDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  downloadMbps?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  uploadMbps?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  mikrotikProfile?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}