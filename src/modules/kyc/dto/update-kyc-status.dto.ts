import { KycStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class UpdateKycStatusDto {
  @IsEnum(KycStatus)
  status!: KycStatus;

  @IsString()
  actorId!: string;

  @IsOptional()
  @IsString()
  note?: string;
}
