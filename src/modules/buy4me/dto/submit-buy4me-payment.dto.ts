import { IsOptional, IsString } from "class-validator";

export class SubmitBuy4MePaymentDto {
  @IsString()
  paymentMethod!: string;

  @IsOptional()
  @IsString()
  proofOfPaymentUrl?: string;
}
