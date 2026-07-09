import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateOnuDto {
  @IsString()
  @IsOptional()
  serialNumber?: string;

  @IsString()
  @IsOptional()
  ponPort?: string;

  @IsString()
  @IsOptional()
  onuId?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  vlan?: number;

  @IsNumber()
  @IsOptional()
  rxPower?: number;

  @IsNumber()
  @IsOptional()
  txPower?: number;

  @IsNumber()
  @IsOptional()
  distance?: number;

  @IsBoolean()
  @IsOptional()
  online?: boolean;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;
}