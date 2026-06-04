import { IsIn, IsNumber, IsObject, IsOptional, IsString } from "class-validator";

export class CreateWithdrawalDto {
  @IsString()
  userId!: string;

  @IsString()
  service!: string;

  @IsNumber()
  amount!: number;

  @IsIn(["NGN", "USD"])
  currency!: "NGN" | "USD";

  @IsNumber()
  nairaEquivalent!: number;

  @IsObject()
  destinationDetails!: Record<string, string>;

  @IsOptional()
  @IsString()
  proofOfPaymentUrl?: string;
}
