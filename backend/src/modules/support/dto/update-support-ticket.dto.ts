import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateSupportTicketDto {
  @IsOptional()
  @IsIn(["OPEN", "PENDING_USER", "RESOLVED"])
  status?: "OPEN" | "PENDING_USER" | "RESOLVED";

  @IsOptional()
  @IsString()
  @MaxLength(80)
  owner?: string;

  @IsOptional()
  @IsIn(["LOW", "MEDIUM", "HIGH"])
  priority?: "LOW" | "MEDIUM" | "HIGH";
}
