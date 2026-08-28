import { IsIn, IsNumber, IsObject, IsOptional, IsString } from "class-validator";

export class CreateDepositDto {
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

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsObject()
  destinationDetails?: Record<string, string>;

  @IsOptional()
  @IsString()
  proofOfPaymentUrl?: string;
}
