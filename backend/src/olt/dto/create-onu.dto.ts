import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateOnuDto {
  @IsString()
  @IsNotEmpty()
  oltId: string;

  @IsString()
  @IsNotEmpty()
  serialNumber: string;

  @IsString()
  @IsNotEmpty()
  ponPort: string;

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