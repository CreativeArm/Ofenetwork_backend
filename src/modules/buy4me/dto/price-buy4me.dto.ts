import { IsNumber, IsString } from "class-validator";

export class PriceBuy4MeDto {
  @IsString()
  actorId!: string;

  @IsNumber()
  productCost!: number;

  @IsNumber()
  shippingCost!: number;

  @IsNumber()
  serviceCharge!: number;
}
