import { IsIn, IsOptional, IsString } from "class-validator";

export class UpdateBuy4MeStatusDto {
  @IsString()
  actorId!: string;

  @IsIn([
    "PROCESSING",
    "AWAITING_PAYMENT",
    "PAYMENT_SUBMITTED",
    "PURCHASING",
    "SHIPPED",
    "COMPLETED",
    "CANCELLED",
    "ISSUE",
  ])
  status!:
    | "PROCESSING"
    | "AWAITING_PAYMENT"
    | "PAYMENT_SUBMITTED"
    | "PURCHASING"
    | "SHIPPED"
    | "COMPLETED"
    | "CANCELLED"
    | "ISSUE";

  @IsOptional()
  @IsString()
  timelineUpdate?: string;

  @IsOptional()
  @IsString()
  adminNote?: string;
}
