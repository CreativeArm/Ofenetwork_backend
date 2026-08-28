import { IsNumber, IsObject, IsPositive, IsString } from "class-validator";

export class CreateBonusCashoutDto {
  @IsString()
  userId!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsObject()
  destinationDetails!: Record<string, string>;
}
