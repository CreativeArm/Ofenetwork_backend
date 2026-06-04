import { IsNumber, IsObject, IsString, Min } from "class-validator";

export class CreateBonusCashoutDto {
  @IsString()
  userId!: string;

  @IsNumber()
  @Min(1)
  amount!: number;

  @IsObject()
  destinationDetails!: Record<string, string>;
}
