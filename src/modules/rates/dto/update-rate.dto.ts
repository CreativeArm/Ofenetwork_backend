import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class UpdateRateDto {
  @IsOptional()
  @IsString()
  service?: string;

  @IsOptional()
  @IsString()
  depositRate?: string;

  @IsOptional()
  @IsString()
  withdrawalRate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
