import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreateRateDto {
  @IsString()
  service!: string;

  @IsString()
  depositRate!: string;

  @IsString()
  withdrawalRate!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
