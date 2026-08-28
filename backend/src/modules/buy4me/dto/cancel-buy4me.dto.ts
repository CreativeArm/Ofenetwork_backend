import { IsOptional, IsString } from "class-validator";

export class CancelBuy4MeDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
