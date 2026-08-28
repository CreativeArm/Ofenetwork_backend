import { IsString } from "class-validator";

export class CreateBuy4MeDto {
  @IsString()
  userId!: string;

  @IsString()
  productLink!: string;

  @IsString()
  productDetails!: string;
}
